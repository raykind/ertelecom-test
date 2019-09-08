const consts = {
  SEC_SHIFT: 0.4, // Сколько пикселей в одной секунде
  MILLISEC_IN_SEC: 1000, // Кол-во миллисекунд в секунде
  SEC_IN_HOUR: 3600, // Кол-во секунд в часе
  SEC_IN_MIN: 60, // Кол-во секунд в минуте
  LEFT_BORDER: 0, // Положение левой границы в пикселях
  NOW_SEC: null
};
let channels, programs;

window.onload = function () {
  consts.NOW_SEC = /*getSeconds(new Date());*/35000;/* TODO т.к. у программ из json просроченный timestamp */
  document.getElementById('goToNow').addEventListener('click', toCurrentTime);
  document.addEventListener('keydown', arrowNavigate);
  loadChannels()
    .then(() => {
      let channelEntries = document.getElementsByClassName('channel-entry');
      for (let i = 0; i < channelEntries.length; i++){
        let entry = channelEntries[i];
        entry.addEventListener('click', () => {
          clearSelectChannel();
          entry.classList.add('active-channel');
        })
      }
      Promise.all([setTimeline(), loadPrograms()])
        .then(() => setEpgInNow())
    });
};
/*
 * Загрузка каналов
 */
function loadChannels()
{
  return loadJsonFile('src/json/channels.json', (data) => setChannels(data));
}
/*
 * Загрузка программ
 */
function loadPrograms()
{
  return loadJsonFile('src/json/programs.json', (data) => setPrograms(data));
}
/*
 * Загрузка файлов JSON
 */
function loadJsonFile(fileName, callback)
{
  return fetch(fileName)
    .then(response => response.json())
    .then(jsonResponse => callback(jsonResponse))
}
/*
 * Установка блока программ в соответствии с текущим времем
 */
function setEpgInNow()
{
  let left = getClassPropertyValue('.programs-block', 'left') - 8;
  let timelineEntryWidth = getClassPropertyValue('.timeline-entry', 'width');
  let value = left - consts.NOW_SEC * consts.SEC_SHIFT + Number(timelineEntryWidth);
  setClassPropertyValue('.programs-block', 'left', value);
  consts.LEFT_BORDER = consts.NOW_SEC * consts.SEC_SHIFT - Number(timelineEntryWidth);
}
/*
 * Установка списка каналов
 */
function setChannels(jsonData){
  let channelsArray = jsonData && jsonData.collection ? jsonData.collection : null;
  channels = channelsArray;
  if (channelsArray){
    channelsArray.sort((a, b) => {a.er_lcn - b.er_lcn});
    let channelsBlock = document.getElementsByClassName('channels-block')[0];
    for (let i = 0; i < channelsArray.length; i++){
      let item = channelsArray[i];
      let channelElement = document.createElement('DIV');
      channelElement.setAttribute('class', 'channel-entry');
      let numberDiv = document.createElement('DIV');
      numberDiv.setAttribute('class', 'channel-number-block');
      numberDiv.appendChild(document.createTextNode(item.er_lcn));
      let titleDiv = document.createElement('DIV');
      titleDiv.setAttribute('class', 'channel-title-block');
      titleDiv.appendChild(document.createTextNode(item.title));
      channelElement.appendChild(numberDiv);
      channelElement.appendChild(titleDiv);
      channelElement.setAttribute('data-epg-channel-id', item.epg_channel_id);
      channelsBlock.appendChild(channelElement);
      createEmptyProgramRow(item.epg_channel_id, i);
    }
  }
}
/*
 * Установка расписания программ
 */
function setPrograms(data)
{
  let channels = document.getElementsByClassName('channel-entry');
  programs = data && data.collection ? data.collection : [];
  let executedChannels = [];
  for (let i = 0; i < channels.length; i++){
    let channelId = channels[i].getAttribute('data-epg-channel-id');
    if (executedChannels.includes(channelId)){
      continue;
    }
    let appropriatePrograms = data && data.collection ? filterProgramsByChannelId(data.collection, channelId) : [];
    let programRows = document.getElementsByClassName('program-row');
    let appropriateRow = null;
    for (let j = 0; j < programRows.length; j++){
      if (programRows[j].getAttribute('data-epg-channel-id') == channelId){
        appropriateRow = programRows[j];
        break;
      }
    }
    let paddingSum = Number(getClassPropertyValue('.program-entry', 'paddingLeft')) + Number(getClassPropertyValue('.program-entry', 'paddingRight'));
    for (let j = 0; j < appropriatePrograms.length; j++){
      let program = document.createElement('DIV');
      program.setAttribute('class', 'program-entry');
      program.setAttribute('data-program-id', appropriatePrograms[j].id);
      let title = appropriatePrograms[j].duration > 300 ? appropriatePrograms[j].title : '...';
      program.style.width = appropriatePrograms[j].duration * consts.SEC_SHIFT - paddingSum + 'px';
      program.style.left = getProgramSecondFromDayStart(appropriatePrograms[j].start) * consts.SEC_SHIFT + j + 'px';
      program.onclick = () => programClick(program);
      if (program.style.width == ''){
        program.style.paddingLeft = program.style.paddingRight = '0px';
        program.style.width = appropriatePrograms[j].duration * consts.SEC_SHIFT + 'px';
        program.appendChild(document.createTextNode(''));
      } else {
        program.appendChild(document.createTextNode(title));
      }
      let secs = getSeconds(new Date(appropriatePrograms[j].start * 1000));
      if (secs < consts.NOW_SEC && secs + appropriatePrograms[j].duration >= consts.NOW_SEC){
        program.classList.add('current-time-program');
      }
      if (appropriateRow){
        appropriateRow.appendChild(program);
      }
    }
    executedChannels.push(channelId);
  }
}
/*
 * Выставление таймлайна
 */
function setTimeline()
{
  let timelineEntryWidth = getClassPropertyValue('.timeline-entry', 'width');
  let timelineEntry = document.getElementsByClassName('timeline-entry');
  let channelsBlockWidth = getComputedStyle(document.getElementsByClassName('channels-block')[0]).width;
  channelsBlockWidth = channelsBlockWidth.substring(0, channelsBlockWidth.length - 2);
  for (let i = 0; i < timelineEntry.length; i++){
    let left = (i + 1) * Number(timelineEntryWidth) + Number(channelsBlockWidth);
    left = left - consts.NOW_SEC * consts.SEC_SHIFT;
    timelineEntry[i].style.left = left + 'px';
  }
  setVerticalLine();
}
/*
 * Отображение информации о программе по клику
 */
function programClick(programElem)
{
  clearActive();
  let channelId = programElem.closest('.program-row').getAttribute('data-epg-channel-id');
  let programId = programElem.getAttribute('data-program-id');
  let program = programs.filter((item) => {
    return item.id == programId;
  });
  program = program[0];
  showProgramStart(program);
  let programRow = document.querySelectorAll('.program-row[data-epg-channel-id="' + channelId + '"]')[0];
  document.querySelectorAll('.program-entry[data-program-id="' + programId + '"]')[0].classList.add('active-program');
  let infoRow = document.createElement('DIV');
  infoRow.setAttribute('class', 'info-row');
  let channelsBlockWidth = getComputedStyle(document.getElementsByClassName('channels-block')[0]).width;
  channelsBlockWidth = Number(channelsBlockWidth.substring(0, channelsBlockWidth.length - 2));
  let contentLeft = Number(getClassPropertyValue('.programs-block', 'left')) * (-1) + channelsBlockWidth;;
  let genres = '';
  program.program.genres.forEach((item) => {genres += item.title + ', '});
  genres = genres.substring(0, genres.length - 2);
  let startHours = new Date(program.start * 1000).getHours(),
    startMinutes = new Date(program.start * 1000).getMinutes() < 10 ? '0' + new Date(program.start * 1000).getMinutes() : new Date(program.start * 1000).getMinutes(),
    endHours = new Date((program.start + program.duration) * 1000).getHours(),
    endMinutes = new Date((program.start + program.duration) * 1000).getMinutes() < 10 ? '0' + new Date((program.start + program.duration) * 1000).getMinutes() : new Date((program.start + program.duration) * 1000).getMinutes();
  let html = '<div class="info-content" style="left: ' + contentLeft + 'px;">' +
             '<h2>' + program.title + '</h2>' +
             '<span>' + startHours + ':' + startMinutes + ' - ' + endHours + ':' + endMinutes + '</span>' +
             '<span>' + (program.program.country ? program.program.country.title + ', ' : '') + genres + '</span>' +
             '<div>' + (program.program.description ? program.program.description : '') + '</div>' +
             '</div>';
  infoRow.innerHTML = html;
  programRow.parentNode.insertBefore(infoRow, programRow.nextSibling);
  let channel = document.querySelectorAll('.channel-entry[data-epg-channel-id="' + channelId + '"]')[0];
  channel.classList.add('active-row');
}
/*
 * Перемещение по сетке epg
 * @param {direction} 0 - влево, 1 - вправо
 */
function navigateAtEpg(pixels, direction)
{
  let timelineEntries = document.getElementsByClassName('timeline-entry'),
    programsBlock = document.getElementsByClassName('programs-block')[0],
    programEntries = document.getElementsByClassName('program-entry');
  if (direction == 0){
    for (let i = 0; i < timelineEntries.length; i++){
      timelineEntries[i].style.left = Number(timelineEntries[i].style.left.substring(0, timelineEntries[i].style.left.length - 2)) + Number(pixels) + 'px'
    }
    setClassPropertyValue('.programs-block', 'left', Number(getClassPropertyValue('.programs-block', 'left')) + Number(pixels));
  } else if (direction == 1){
    for (let i = 0; i < timelineEntries.length; i++){
      timelineEntries[i].style.left = Number(timelineEntries[i].style.left.substring(0, timelineEntries[i].style.left.length - 2)) - Number(pixels) + 'px'
    }
    setClassPropertyValue('.programs-block', 'left', Number(getClassPropertyValue('.programs-block', 'left')) - Number(pixels));
  }
}
/*
 * Навигация по стрелочкам
 */
function arrowNavigate(event)
{
  let programElement = document.getElementsByClassName('active-program')[0];
  if (programElement && event.altKey){
    let programRowIndex = Number(programElement.closest('.program-row').getAttribute('data-row-index'));
    let downCurrentElement = document.querySelectorAll('.program-row[data-row-index="' + programRowIndex + '"] .active-program');
    if (downCurrentElement.length > 0){
      let id = downCurrentElement[0].getAttribute('data-program-id');
      if (event.code == 'ArrowUp'){
        downCurrentElement = document.querySelectorAll('.program-row[data-row-index="' + (--programRowIndex) + '"] .current-time-program');
        if (downCurrentElement[0]){
          let program = programs.filter((item) => {return item.id == downCurrentElement[0].getAttribute('data-program-id')});
          showProgramStart(program[0]);
          programClick(downCurrentElement[0]);
        }
      } else if (event.code == 'ArrowDown'){
        downCurrentElement = document.querySelectorAll('.program-row[data-row-index="' + (++programRowIndex) + '"] .current-time-program');
        if (downCurrentElement[0]){
          let program = programs.filter((item) => {return item.id == downCurrentElement[0].getAttribute('data-program-id')});
          showProgramStart(program[0]);
          programClick(downCurrentElement[0]);
        }
      } else if (event.code == 'ArrowLeft'){
        if (downCurrentElement[0].previousSibling){
          id = downCurrentElement[0].previousSibling.getAttribute('data-program-id');
          showProgramStart(programs.filter((item) => {return item.id == id})[0]);
          programClick(downCurrentElement[0].previousSibling);
        }
        return;
      } else if (event.code == 'ArrowRight'){
        if (downCurrentElement[0].nextSibling){
          id = downCurrentElement[0].nextSibling.getAttribute('data-program-id');
          showProgramStart(programs.filter((item) => {return item.id == id})[0]);
          programClick(downCurrentElement[0].nextSibling);
        }
        return;
      }
    }
  }
}
/*
 * Получение свойства определенного класса без 'px'
 */
function getClassPropertyValue(classSelector, property)
{
  let styleProperty = getStyle(classSelector)[property];
  return styleProperty.substring(0, styleProperty.length - 2);
}
/*
 * Установка значения свойства определенного класса
 */
function setClassPropertyValue(classSelector, property, value)
{
  let style = getStyle(classSelector);
  if (typeof value == 'number'){
    style[property] = value + 'px';
  } else if (typeof value == 'string'){
    style[property] = value.indexOf('px') != -1 ? value : value + 'px';
  }
}
/*
 * Перемотать сетку на начало программы
 */
function showProgramStart(program)
{
  let now = consts.LEFT_BORDER;
  let programStart = getProgramSecondFromDayStart(program.start) * consts.SEC_SHIFT;
  if (programStart < now){
    navigateAtEpg(now - programStart, 0);
  } else if (programStart > now){
    navigateAtEpg(programStart - now, 1);
  }
  consts.LEFT_BORDER = programStart;
}
/*
 * К текущему моменту
 */
function toCurrentTime()
{
  clearActive();
  let now = consts.NOW_SEC * consts.SEC_SHIFT - Number(getClassPropertyValue('.timeline-entry', 'width')),
    leftBorder = consts.LEFT_BORDER;
  if (now > leftBorder){
    navigateAtEpg(now - leftBorder, 1);
  } else if (leftBorder > now){
    navigateAtEpg(leftBorder - now, 0);
  }
  consts.LEFT_BORDER = now;
}
/*
 * Очистка классов активности программ
 */
function clearActive()
{
  let infoRow = document.getElementsByClassName('info-row')[0];
  if (infoRow){
    infoRow.parentNode.removeChild(infoRow);
    document.getElementsByClassName('active-program')[0].classList.remove('active-program');
    document.getElementsByClassName('active-row')[0].classList.remove('active-row');
  }
}
/*
 * Очистка классов активностей каналов
 */
function clearSelectChannel()
{
  let actives = document.getElementsByClassName('active-channel');
  for (let i = 0; i < actives.length; i++){
    actives[i].classList.remove('active-channel');
  }
}
/*
 * Установка вертикальной линии
 */
function setVerticalLine()
{
  let channelsBlockHeight = getComputedStyle(document.getElementsByClassName('channels-block')[0]).height;
  setClassPropertyValue('.vertical-line', 'height', channelsBlockHeight);
  setClassPropertyValue('.vertical-line', 'left', consts.NOW_SEC * consts.SEC_SHIFT);
}
/*
 * Создание пустой строки с определенным epg_channel_id
 */
function createEmptyProgramRow(epgChannelId, index)
{
  let programRow = document.createElement('DIV');
  programRow.setAttribute('class', 'program-row');
  programRow.setAttribute('data-row-index', index);
  programRow.setAttribute('data-epg-channel-id', epgChannelId ? epgChannelId : -1);
  document.getElementsByClassName('programs-block')[0].appendChild(programRow);
}
/*
 * Возвращение кол-ва секунд от начала дня до старта программы
 */
function getProgramSecondFromDayStart(start)
{
  let date = new Date(start * consts.MILLISEC_IN_SEC);
  let hours = date.getHours() * consts.SEC_IN_HOUR + date.getMinutes() * consts.SEC_IN_MIN + date.getSeconds();
  return getSeconds(date);
}
/*
 * Получение списка программ с определенным channel_id
 */
function filterProgramsByChannelId(programs, channelId)
{
  return programs.filter((item) => {
    return item.channel_id == channelId;
  })
}
/*
 * Получения стиля определенного класса
 */
function getStyle(classSelector)
{
  let styleSheets = document.styleSheets;
  for (let i = 0; i < styleSheets.length; i++) {
    let styleSheet = styleSheets[i];
    let cssProps = styleSheet.cssRules || styleSheet.rules;
    for (let j = 0; j < cssProps.length; j++) {
      if (cssProps[j].selectorText.indexOf(classSelector) != -1){
        return cssProps[j].style;
      }
    }
  }
}
/*
 * Получение секунд из определенной даты
 */
function getSeconds(date)
{
  return date.getHours() * consts.SEC_IN_HOUR + date.getMinutes() * consts.SEC_IN_MIN + date.getSeconds();
}