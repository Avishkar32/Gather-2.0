// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');

// const app = express();
// app.use(cors());
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000", // Your frontend URL
//     methods: ["GET", "POST"]
//   }
// });

// const players = {};

// io.on('connection', (socket) => {
//   // console.log(`Player connected: ${socket.id}`);
  
//   // // Add new player to the game
//   // players[socket.id] = {
//   //   position: { x: 300, y: 300 }, // Default position
//   //   direction: 'down',
//   //   name: `Player-${socket.id.substr(0, 4)}`,
//   //   id: socket.id
//   // };

//   // // Send current players to new player
//   // socket.emit('currentPlayers', players);
  
//   // // Tell everyone else about new player
//   // socket.broadcast.emit('newPlayer', players[socket.id]);

//   // // Handle player movement
//   // socket.on('playerMovement', (movementData) => {
//   //   if (players[socket.id]) {
//   //     players[socket.id] = {
//   //       ...players[socket.id],
//   //       ...movementData
//   //     };
//   //     // Broadcast movement to all other players
//   //     socket.broadcast.emit('playerMoved', players[socket.id]);
//   //   }
//   // });

//   console.log(`Player connected: ${socket.id}`);
  
//   // Add new player to the game
//   players[socket.id] = {
//     position: { x: 300, y: 300 },
//     direction: 'down',
//     name: `Player-${socket.id.substr(0, 4)}`,
//     id: socket.id,
//     moving: false // Add initial moving state
//   };

//   // Send ALL players to the new connection
//   socket.emit('currentPlayers', players);
  
//   // Notify EVERYONE about the new player (including the new player)
//   io.emit('newPlayer', players[socket.id]); // Changed from socket.broadcast

//   // Handle player movement
//   socket.on('playerMovement', (movementData) => {
//     if (players[socket.id]) {
//       // Update server-side player state
//       players[socket.id] = {
//         ...players[socket.id],
//         ...movementData
//       };
      
//       // Broadcast full player data to everyone
//       io.emit('playerMoved', players[socket.id]); // Changed from socket.broadcast
//     }
//   });


//   // Handle disconnections
//   socket.on('disconnect', () => {
//     console.log(`Player disconnected: ${socket.id}`);
//     delete players[socket.id];
//     // Tell all clients to remove this player
//     io.emit('playerDisconnected', socket.id);
//   });
// });

// const PORT = 3001;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const players = {};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Add new player to the game
  const newPlayer = {
    position: { x: 300, y: 300 },
    direction: 'down',
    name: `Player-${socket.id.substr(0, 4)}`,
    id: socket.id,
    moving: false
  };
  players[socket.id] = newPlayer;

  // 1. Send existing players to NEW player (excluding self)
  const otherPlayers = Object.fromEntries(
    Object.entries(players).filter(([id]) => id !== socket.id)
  );
  socket.emit('currentPlayers', otherPlayers);

  // 2. Tell EXISTING players about the NEW player
  socket.broadcast.emit('newPlayer', newPlayer);

  // Handle player movement
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id] = {
        ...players[socket.id],
        ...movementData
      };
      // Broadcast to ALL players
      io.emit('playerMoved', players[socket.id]);
    }
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});