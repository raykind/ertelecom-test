window.onload = function () {
  debugger;
  sendAjax({
    methodUrl: 'addSmth',
    type: 'POST'
  }).then( resp => resp.json())
    .then( data => {
      debugger;
    })
}

function sendAjax(obj)
{
  return fetch('http://localhost:8080/' + (obj.methodUrl ? obj.methodUrl : ''), {
    method: (obj.type ? obj.type : 'GET'),
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: (obj.data ? JSON.stringify(obj.data) : null),
  });
}