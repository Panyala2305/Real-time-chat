// This is the file you run to start everything.
// It creates the HTTP server, attaches Socket.IO to it, then listens.

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const socketHandler = require('./sockets/socketHandler');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Create HTTP server from Express app
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Initialize all socket event handlers
socketHandler(io);

// Start listening
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});