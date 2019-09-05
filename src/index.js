const consts = {
  SEC_SHIFT: 0.4, // Сколько пикселей в одной секунде
  MILLISEC_IN_SEC: 1000, // Кол-во миллисекунд в секунде
  SEC_IN_HOUR: 3600, // Кол-во секунд в часе
  SEC_IN_MIN: 60, // Кол-во секунд в минуте
  NOW_SEC: null
};

window.onload = function () {
  consts.NOW_SEC = /*getSeconds(new Date());*/35000;/* TODO т.к. у программ из json просроченный timestamp */
  loadChannels()
    .then(() => {
      Promise.all([setTimeline(), loadPrograms()])
        .then(() => setEpgInNow())
    });
};
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
 * Установка блока программ в соответствии с текущим времем
 */
function setEpgInNow()
{
  let left = getClassPropertyValue('.programs-block', 'left');
  let timelineEntryWidth = getClassPropertyValue('.timeline-entry', 'width');
  setClassPropertyValue('.programs-block', 'left', left - consts.NOW_SEC * consts.SEC_SHIFT + Number(timelineEntryWidth) - 8);
}
/*
 * Загрузка каналов
 */
function loadChannels()
{
  return loadJsonFile('src/json/channels.json', (data) => setChannels(data));
}
/*
 * Установка списка каналов
 */
function setChannels(jsonData){
  let channelsArray = jsonData && jsonData.collection ? jsonData.collection : null;
  if (channelsArray){
    channelsArray.sort((a, b) => {a.er_lcn - b.er_lcn});
    let channelsBlock = document.getElementsByClassName('channels-block')[0];
    channelsArray.forEach((item) => {
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
      createEmptyProgramRow(item.epg_channel_id);
    })
  }
}
/*
 * Создание пустой строки с определенным epg_channel_id
 */
function createEmptyProgramRow(epgChannelId)
{
  let programRow = document.createElement('DIV');
  programRow.setAttribute('class', 'program-row');
  programRow.setAttribute('data-epg-channel-id', epgChannelId ? epgChannelId : -1);
  document.getElementsByClassName('programs-block')[0].appendChild(programRow);
}
/*
 * Загрузка программ
 */
function loadPrograms()
{
  return loadJsonFile('src/json/programs.json', (data) => setPrograms(data));
}
/*
 * Установка расписания программ
 */
function setPrograms(data)
{
  let channels = document.getElementsByClassName('channel-entry');
  for (let i = 0; i < channels.length; i++){
    let channelId = channels[i].getAttribute('data-epg-channel-id');
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
      let title = appropriatePrograms[j].duration > 300 ? appropriatePrograms[j].title : '...';
      program.style.width = appropriatePrograms[j].duration * consts.SEC_SHIFT - paddingSum + 'px';
      program.style.left = getProgramSecondFromDayStart(appropriatePrograms[j].start) * consts.SEC_SHIFT + j + 'px';
      if (program.style.width == ''){
        program.style.paddingLeft = program.style.paddingRight = '0px';
        program.style.width = appropriatePrograms[j].duration * consts.SEC_SHIFT + 'px';
        program.appendChild(document.createTextNode(''));
      } else {
        program.appendChild(document.createTextNode(title));
      }
      let secs = getSeconds(new Date(appropriatePrograms[j].start * 1000));
      if (secs < consts.NOW_SEC && secs + appropriatePrograms[j].duration >= consts.NOW_SEC){
        program.style.backgroundColor = '#b4b4b4';
      }
      if (appropriateRow){
        appropriateRow.appendChild(program);
      }
    }
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
  setVerticalLineHeight();
}
/*
 * Установка высоты вертикальной линии
 */
function setVerticalLineHeight()
{
  let channelsBlockHeight = getComputedStyle(document.getElementsByClassName('channels-block')[0]).height;
  setClassPropertyValue('.vertical-line', 'height', channelsBlockHeight);
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
 * Получение секунд из определенной даты
 */
function getSeconds(date)
{
  return date.getHours() * consts.SEC_IN_HOUR + date.getMinutes() * consts.SEC_IN_MIN + date.getSeconds();
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
 * Загрузка файлов JSON
 */
function loadJsonFile(fileName, callback)
{
  return fetch(fileName)
    .then(response => response.json())
    .then(jsonResponse => callback(jsonResponse))
}