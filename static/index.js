var socket = io();

function setCookie(name, value, options) {
  options = options || {};

  var expires = options.expires;

  if (typeof expires == "number" && expires) {
    var d = new Date();
    d.setTime(d.getTime() + expires * 1000);
    expires = options.expires = d;
  }
  if (expires && expires.toUTCString) {
    options.expires = expires.toUTCString();
  }

  value = encodeURIComponent(value);

  var updatedCookie = name + "=" + value;

  for (var propName in options) {
    updatedCookie += "; " + propName;
    var propValue = options[propName];
    if (propValue !== true) {
      updatedCookie += "=" + propValue;
    }
  }

  document.cookie = updatedCookie;
}
function getCookie(name) {
  var matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}
function deleteCookie(name) {
  setCookie(name, "", {
    expires: -1
  })
}

socket.on('message', function(data) {
    console.log(data);
});

socket.on('errorIn', function(error){
  if(error==0){
    if( getCookie("user") != undefined){
      deleteCookie('user');
    }
    document.cookie = "user="+document.getElementById("nickname").value+";";
    window.location.href = "main.html";
  }
  if(error==1){
    document.getElementById("ErrorSignIn").innerHTML = "Nickname is already exist!";
    return;
  }
  if(error==2){
    document.getElementById("ErrorSignIn").innerHTML = "Nickname should use ONLY english letters!";
    return;
  }
  if(error==3){
    document.getElementById("ErrorSignIn").innerHTML = "Nickname can't be shorter then 4!";
    return;
  }
});

document.getElementById("btn").onclick = function(){
  socket.emit('sing_in', document.getElementById("nickname").value);
};


setInterval(function() {
  document.getElementById("version").innerHTML = "Version: 1.0.1";

}, 1000 / 60);
