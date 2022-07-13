var express = require('express');
var app = express();
const cors =require('cors')
var server = require('http').Server(app);
var io = require('socket.io')
(server, {
  cors: {
    origin: ["http://localhost:3001", "https://metaverserpg.netlify.app"],
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
    socket.on('newJoin',function({name}){

        socket.emit('initialiseConnection', players);

        players[socket.id] = {
          x: Math.floor(Math.random() * 10 +3),
          y: Math.floor(Math.random() * 10+3),
          playerId: socket.id,
          avatar:Math.floor(Math.random() * 8),
          playerName: name,
        };

        io.emit('newPlayerConnected', players[socket.id]);

        console.log("new player connected")

        console.log(players)
    });

    socket.on('disconnect',function(){
      console.log("player discon")
      delete players[socket.id]
      io.emit('playerDisconnected', socket.id);
    });

    socket.on('playerMove', (data) => {
      players[socket.id].x = data.position.x + data.offset.x
      players[socket.id].y = data.position.y + data.offset.y
      console.log(data)
      io.emit('playerMove', {
        allPlayers: players,
        player: players[socket.id],
        direction: data.direction,
        position: {
          x: players[socket.id].x,
          y: players[socket.id].y
        }
      })
      console.log(players[socket.id])
    })

    socket.on('getPlayers', () => {
      console.log("getplayers on")
      io.emit('positions', players)
    })
});
