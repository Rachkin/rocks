var socket  = io();


socket.on('message', function(data) {
    console.log(data);
});


function getCookie(name) {
  var matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}


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

function deleteCookie(name) {
  setCookie(name, "", {
    expires: -1
  })
}




document.getElementById("disconnect").onclick = function(){
  socket.emit('disconect');
  deleteCookie('user');
  window.location.href = "index.html";
};

if( getCookie("user") != undefined){
  socket.emit('disconnect');
  socket.emit('new_player', getCookie('user'));
}else{
  socket.emit('disconect');
  deleteCookie('user');
  window.location.href = "index.html";
}

document.getElementById("btn").onclick = function(){
  socket.emit('get', document.getElementById('count').value);

}


setInterval(function() {
  socket.emit('iamhere', 1);

}, 1000 / 60);


socket.on('state', function(room, queue, players) {              // draw
  document.getElementById('kount_of_rocks').innerHTML = room.kount_of_rocks;
  document.getElementById('log').innerHTML = "LOG <br> <hr>" + room.log;
  document.getElementById('vs').innerHTML = room.name1 + " vs " + room.name2;
  var s = "";
  queue.forEach(function(id){
    s += players[id].nickname + "<br>";
  });
  document.getElementById('debug').innerHTML = s;
  if(room.player1 == room.turn)
    document.getElementById('turn').innerHTML = "Now " +room.name1+"'s turn";
  else if(room.player2 == room.turn){
    document.getElementById('turn').innerHTML = "Now " +room.name2+"'s turn";
  }
  document.getElementById('txt').innerHTML = "How many rocks do you want to get? <br> Max - " + room.max + ", Min - " + room.min;
});

socket.on('logOut', function(room) {              // draw
  socket.emit('disconect');
  deleteCookie('user');
  window.location.href = "index.html";
});

socket.on('errorGet', function(error) {              // draw
  if(error == 1){
    document.getElementById('error').innerHTML = "You can't get more, then 4!";
  }else if(error == 2){
    document.getElementById('error').innerHTML = "You cn't get more, then you have!";
  }else if(error == 3){
    document.getElementById('error').innerHTML = "You can't get less, then 1 rock!";
  }else if(error == 4){
    document.getElementById('error').innerHTML = "You can't get in foreign turn!";
  }else if(error == 5){
    document.getElementById('error').innerHTML = "You can't get, you're alone!";
  }
});
