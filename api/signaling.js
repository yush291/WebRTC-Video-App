const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));  // Your static files

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle signaling messages
  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer);  // Broadcast offer to other users
  });

  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);  // Broadcast answer to other users
  });

  socket.on('candidate', (candidate) => {
    socket.broadcast.emit('candidate', candidate);  // Broadcast ICE candidates
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
