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

app.set('port', 5000);

app.use('/static', express.static(__dirname + '/static'));

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
app.get('/main.html', function(request, response) {
    response.sendFile(path.join(__dirname, '/views/main.html'));
});

app.get('/main', function(request, response) {
    response.sendFile(path.join(__dirname, '/views/main.html'));
});

// Запуск сервера
server.listen(5000, function() {
    console.log('Запускаю сервер на порте 5000');
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
  max: 4,
  min: 1,
  log: "",
  turn: -1
};

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


io.on('connection', function(socket) {
/////////////////////////////////////////////////////////
  socket.on('sing_in', function(nickname) {
    socket.emit('errorIn', 0);
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
    delete players[socket.id];
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



    players[socket.id] = {
      nickmane: nick_name
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
