var express = require('express');
var app = express();
const cors =require('cors')
var server = require('http').Server(app);
var io = require('socket.io')
(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

const index = require("./routes/index");
app.use(index)
app.use(cors)

server.lastPlayderID = 0;

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
});

var players = {};

app.get('/currentPlayers', (req, res) => {
  res.send({players})
})

io.on('connection',function(socket){

    socket.on('newplayer',function(){

        players[socket.id] = {
          x: Math.floor(Math.random() * 10 +3),
          y: Math.floor(Math.random() * 10+3),
          id: socket.id,
          avatar:Math.floor(Math.random() * 8)
        };

        socket.emit('currentPlayers', players);
        socket.broadcast.emit('newPlayer', {data:players[socket.id], players:players});

        console.log("new player connected")

        console.log(players)
    });

    socket.on('disconnect',function(){
      console.log("player discon")
      delete players[socket.id]
      io.emit('playerDisconnect', socket.id);
    });

    socket.on('playerMove', (direction) => {
      io.emit('playerMove', {
        playerid: socket.id,
        position: {
          x: players[socket.id].x,
          y: players[socket.id].y
        }
      })
    })

    socket.on('newpos', (newPosData) => {
      console.log("newpos")
      console.log(players)
      if (newPosData.char !== 'player') {
        players[newPosData.char.slice(6)].x = newPosData.x
        players[newPosData.char.slice(6)].y = newPosData.y
      } else {
        players[socket.id].x = newPosData.x
        players[socket.id].y = newPosData.y
      }
    })

    socket.on('getPlayers', () => {
      console.log("getplayers on")
      socket.emit('positions', players)
    })
});
