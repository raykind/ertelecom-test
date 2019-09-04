window.onload = function () {
  loadChannels();
  loadPrograms();
}

function loadChannels()
{
  loadJsonFile('src/channels.json', (data) => {
    console.log(data);
  });
}

function loadPrograms()
{
  loadJsonFile('src/programs.json', (data) => {
    console.log(data);
  });
}

function loadJsonFile(fileName, callback)
{
  fetch(fileName)
    .then(response => response.json())
    .then(jsonResponse => callback(jsonResponse))
}