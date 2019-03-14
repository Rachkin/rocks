// Зависимости
var express  = require( 'express' );
var http     = require( 'http' );
var path     = require( 'path' );
//var mongoose = require( 'mongoose' );
var socketIO = require( 'socket.io' );
var app      = express();
var server   = http.Server(app);
var io       = socketIO(server);


//connection.connect();

app.set('port', 8081);

app.use('/static', express.static(__dirname + '/static'));
app.use('/fonts', express.static(__dirname + '/fonts'));
app.use('/styles', express.static(__dirname + '/styles'));
app.use('/images', express.static(__dirname + '/images'));

// Маршруты
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, '/views/index.html'));
});
app.get('/index.html', function(request, response) {
    response.sendFile(path.join(__dirname, '/views/index.html'));
});
app.get('/styles/main.css', function(request, response) {
    response.sendFile(path.join(__dirname, '/styles/main.css'));
});
app.get('/fonts/pixel.ttf', function(request, response) {
    response.sendFile(path.join(__dirname, '/fonts/pixel.ttf'));
});
app.get('/main.html', function(request, response) {
    response.sendFile(path.join(__dirname, '/views/main.html'));
});

app.get('/main', function(request, response) {
    response.sendFile(path.join(__dirname, '/views/main.html'));
});

// Запуск сервера
server.listen(8081, function() {
    console.log('Running server at port 8081');
});

// Обработчик веб-сокетов

var players = {};
var passes = {};
var last_connection = {};
var log = "";
var socket_by_id = {};

var room = {
  player1: -1,
  player2: -1,
  name1: "",
  name2: "",
  kount_of_rocks: 20,
  max: 2,
  min: 1,
  log: "",
  turn: -1
};

var allowedSymbols = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM_-1234567890"
var kount_of_players = 0;

var kount_of_rocks = 20;

var queue = [];

function playerConnected(sock){
  if(players[sock.id] == undefined){
    return false;
  }else{
    return true;
  }
}

function resetRoom(){

  room.kount_of_rocks = 20;
  room.log = "";

  if(room.player2 != -1){
    var tmp = room.player1;
    room.player1 = room.player2;
    room.player2 = tmp;
    tmp = room.name1;
    room.name1 = room.name2;
    room.name2 = tmp;
  }
  room.turn = room.player1;
}

function addToQueue(id){
  queue.push(id);
}

function addToGame(){

  if(queue.length > 0 && (room.player1 == -1 || room.player2 == -1)){
    var id = queue.shift();
    if(players[id] != undefined){
      if(room.player1 == -1){
        room.player1 = id;
        room.name1 = players[id].nickname;
        room.turn = id;
      }
      else if(room.player2 == -1){
        room.player2 = id;
        room.name2 = players[id].nickname;
      }
    }
  }
}

function checkNick(nick, id){

  for(var i in players){
    if(nick == players[i].nickname && players[i].id != id){
  //    socket.emit('errorIn', 1);
      console.log('Player ' + nick + ' alredy exist!');
      return 1;
    }
  }
  console.log('Nick is free');


  for(el in nick){
    var ex = 0;
    for(c in allowedSymbols){
      if(allowedSymbols[c] == nick[el]) ex = 1;
    //  console.log(el );
    }
    if(ex == 0){
  //    socket.emit('errorIn', 2);
      return 2;
    }
  }
  console.log('Letter are ok');

  if(nick.length < 4){
//    socket.emit('errorIn', 3);
    return 3;
  }
  console.log('Length >= 4');

//  socket.emit('errorIn', 0);
  return 0;
}


io.on('connection', function(socket) {
/////////////////////////////////////////////////////////
  socket.on('sing_in', function(nickname) {
    var error = checkNick(nickname, socket.id);
    socket.emit('errorIn', error);
  });
////////////////////////////////////////////////////////////
  socket.on('get', function(kount) {
    if(!playerConnected(socket)){
      socket.emit('logOut');
      return;
    }
    if(kount > room.max){
      socket.emit('errorGet', 1);
      return;
    }
    if(kount > room.kount_of_rocks){
      socket.emit('errorGet', 2);
      return;
    }
    if(kount < 1){
      socket.emit('errorGet', 3);
      return;
    }
    if(room.turn != socket.id){
      socket.emit('errorGet', 4);
      return;
    }

    if(room.player1 == -1 || room.player2 == -1){
      socket.emit('errorGet', 5);
      return;
    }

    if(kount%1 != 0){
      socket.emit('errorGet', 6);
      return;
    }

    if(room.kount_of_rocks - kount <= 0){
      resetRoom();
    }else{
      room.kount_of_rocks -=  kount;
      room.log = ("Player " + players[socket.id].nickname + " get " + kount + " rocks" +'<br>') + room.log;
    }
    if(room.player1 == room.turn)
      room.turn = room.player2;
    else if(room.player2 == room.turn)
        room.turn = room.player1;
  });
////////////////////////////////////////////////////
  socket.on('disconnect', function() {
    if(players[socket.id] != undefined)
      delete players[socket.id];
    if(last_connection[socket.id] != undefined)
      delete last_connection[socket.id];
    if(room.player1 == socket.id){
      room.player1 = -1;
      room.name1 = "";
      resetRoom();
    }
    else if(room.player2 == socket.id){
      room.player2 = -1;
      room.name2 = "";
      resetRoom();
    }
  });
////////////////////////////////////////////////////////
  socket.on('new_player', function(nick_name) {
    var error = checkNick(nick_name, socket.id)
    if(error){
      socket.emit('logOut');
      return;
    }

    players[socket.id] = {
      nickmane: nick_name,
      id: socket.id
    };
    players[socket.id].nickname = nick_name;
    socket_by_id[socket.id] = socket;

    addToQueue(socket.id);

  });
  /////////////////////////////////////////////////////////////////
  socket.on('iamhere', function() {
  //  last_connection[socket.id] = time();
  });
});
setInterval(function() {
  io.sockets.emit('state', room, queue, players);
  addToGame();
  queue.forEach(function(id){
    if(players[id] != undefined){
      delete id;
    }
  });
}, 1000 / 60);
