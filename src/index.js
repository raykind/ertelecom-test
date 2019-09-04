window.onload = function () {
  loadChannels()
    .then(() => loadPrograms());
}

function loadChannels()
{
  return loadJsonFile('src/json/channels.json', (data) => setChannels(data));
}

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
      createAppropriateEmptyProgramRow(item.epg_channel_id);
    })
  }
}

function createAppropriateEmptyProgramRow(epgChannelId)
{
  let programRow = document.createElement('DIV');
  programRow.setAttribute('class', 'program-row');
  programRow.setAttribute('data-epg-channel-id', epgChannelId ? epgChannelId : -1);
  document.getElementsByClassName('programs-block')[0].appendChild(programRow);
}

function loadPrograms()
{
  return loadJsonFile('src/json/programs.json', (data) => setPrograms(data));
}

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
    for (let j = 0; j < appropriatePrograms.length; j++){
      let program = document.createElement('DIV');
      program.setAttribute('class', 'program-entry');
      program.appendChild(document.createTextNode(appropriatePrograms[j].title));
      if (appropriateRow){
        appropriateRow.appendChild(program);
      }
    }
  }
}

function filterProgramsByChannelId(programs, channelId)
{
  return programs.filter((item) => {
    return item.channel_id == channelId;
  })
}

function loadJsonFile(fileName, callback)
{
  return fetch(fileName)
    .then(response => response.json())
    .then(jsonResponse => callback(jsonResponse))
}