var express = require('express');
var app = express();
const cors =require('cors')
var server = require('http').Server(app);
var io = require('socket.io')
(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const index = require("./routes/index");
app.use(index)
app.use(cors)

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
});

var players = {};

app.get('/currentPlayers', (req, res) => {
  res.send({players})
})

io.on('connection',function(socket){

    socket.on('room', function({roomName}) {

      if (!players[roomName]) {
        players[roomName] = {}
      }

      socket.join(roomName)

      socket.on('newJoin',function({name}){

        socket.emit('initialiseConnection', players[roomName]);

        players[roomName][socket.id] = {
          x: Math.floor(Math.random() * 10 +3),
          y: Math.floor(Math.random() * 10+3),
          playerId: socket.id,
          avatar:Math.floor(Math.random() * 8),
          playerName: name,
          room: roomName
        };

        io.to(roomName).emit('newPlayerConnected', players[roomName][socket.id]);
      });

      socket.on('disconnect',function(){
        delete players[roomName][socket.id]
        io.to(roomName).emit('playerDisconnected', socket.id);
      });

      socket.on('playerMove', (data) => {
        players[roomName][socket.id].x = data.position.x + data.offset.x
        players[roomName][socket.id].y = data.position.y + data.offset.y
        console.log(data)
        io.to(roomName).emit('playerMove', {
          allPlayers: players[roomName],
          player: players[roomName][socket.id],
          direction: data.direction,
          position: {
            x: players[roomName][socket.id].x,
            y: players[roomName][socket.id].y
          }
        })
      })

      socket.on('getPlayers', () => {
        socket.emit('positions', players[roomName])
      })

      socket.on('fixPosition', (position) => {
        players[roomName][socket.id].x = position.x
        players[roomName][socket.id].y = position.y
        io.to(roomName).emit('playerMove', {
          allPlayers: players[roomName],
          player: players[roomName][socket.id],
          position
        })
      })
    })
});
