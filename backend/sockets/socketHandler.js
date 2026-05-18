const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

const onlineUsers = new Map();

const socketHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie || '';
      const jwtMatch = cookie.match(/jwt=([^;]+)/);
      if (!jwtMatch) return next(new Error('Authentication error'));
      const decoded = jwt.verify(jwtMatch[1], process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`✅ User ${socket.user.name} connected | socket: ${socket.id}`);

    onlineUsers.set(userId, socket.id);
    await User.setOnlineStatus(userId, true);
    io.emit('user:online', { userId });

    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.user.name} joined room conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ✅ THE CRITICAL FIX
    socket.on('message:send', async (data) => {
      const { conversationId, messageText } = data;

      console.log(`📨 message:send from ${socket.user.name}:`, { conversationId, messageText });

      if (!conversationId || !messageText?.trim()) {
        console.log('❌ Invalid message data');
        return;
      }

      try {
        const msgId = await Message.create({
          conversationId: Number(conversationId),
          senderId: userId,
          messageType: 'text',
          messageText: messageText.trim()
        });

        const message = await Message.findById(msgId);
        console.log('✅ Message saved, broadcasting:', message);

        // Send to everyone else in the room (the other user)
        socket.to(`conversation:${conversationId}`).emit('message:new', { message });

        // Send back to the SENDER directly (this is what was missing)
        socket.emit('message:new', { message });

      } catch (err) {
        console.error('❌ message:send error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        userId,
        userName: socket.user.name,
        conversationId
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        userId,
        conversationId
      });
    });

    socket.on('messages:read', async ({ conversationId }) => {
      await Message.markAsRead(conversationId, userId);
      socket.to(`conversation:${conversationId}`).emit('messages:read', {
        conversationId,
        userId
      });
    });

    socket.on('disconnect', async () => {
      console.log(`❌ User ${socket.user.name} disconnected`);
      onlineUsers.delete(userId);
      await User.setOnlineStatus(userId, false);
      io.emit('user:offline', { userId });
    });
  });
};

module.exports = socketHandler;