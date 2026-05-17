// This is where all real-time magic happens.
// Socket.IO lets the server "push" data to clients instantly
// without the client having to ask (poll) for it.

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Map of userId → socketId (to know which socket belongs to which user)
const onlineUsers = new Map();

const socketHandler = (io) => {
  // Middleware: authenticate socket connections using JWT cookie
  io.use(async (socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie || '';
      // Parse the jwt cookie manually
      const jwtMatch = cookie.match(/jwt=([^;]+)/);
      if (!jwtMatch) return next(new Error('Authentication error'));

      const decoded = jwt.verify(jwtMatch[1], process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = user; // Attach user to socket
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`User ${socket.user.name} connected`);

    // Track this user as online
    onlineUsers.set(userId, socket.id);
    await User.setOnlineStatus(userId, true);

    // Tell all clients this user is now online
    io.emit('user:online', { userId });

    // --- JOIN CONVERSATION ROOM ---
    // When a user opens a conversation, join that "room"
    // Rooms let us send messages only to participants
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // --- SEND MESSAGE ---
    socket.on('message:send', async (data) => {
      const { conversationId, messageText } = data;
      try {
        const msgId = await Message.create({
          conversationId,
          senderId: userId,
          messageType: 'text',
          messageText
        });
        const message = await Message.findById(msgId);

        // Emit to everyone in the conversation room (including sender)
        io.to(`conversation:${conversationId}`).emit('message:new', { message });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // --- TYPING INDICATOR ---
    socket.on('typing:start', ({ conversationId }) => {
      // Tell others in the room (not the sender) that this user is typing
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        userId,
        userName: socket.user.name
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', { userId });
    });

    // --- MARK MESSAGES AS READ ---
    socket.on('messages:read', async ({ conversationId }) => {
      await Message.markAsRead(conversationId, userId);
      socket.to(`conversation:${conversationId}`).emit('messages:read', {
        conversationId,
        userId
      });
    });

    // --- DISCONNECT ---
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.name} disconnected`);
      onlineUsers.delete(userId);
      await User.setOnlineStatus(userId, false);
      io.emit('user:offline', { userId });
    });
  });
};

module.exports = socketHandler;