const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save to the uploads/ folder
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp + original name
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

// Only allow image file types
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only image files are allowed'), false); // Reject
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET /api/messages/:conversationId
const getMessages = async (req, res) => {
  try {
    const messages = await Message.getByConversation(req.params.conversationId);
    // Mark messages as read when user opens the conversation
    await Message.markAsRead(req.params.conversationId, req.user.id);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/messages — Send a text message
const sendMessage = async (req, res) => {
  const { conversationId, messageText } = req.body;
  const senderId = req.user.id;

  if (!conversationId || !messageText) {
    return res.status(400).json({ message: 'conversationId and messageText required' });
  }

  try {
    const msgId = await Message.create({
      conversationId,
      senderId,
      messageType: 'text',
      messageText
    });
    const message = await Message.findById(msgId);
    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/messages/image — Send an image message
const sendImageMessage = async (req, res) => {
  const { conversationId } = req.body;
  const senderId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: 'Image file required' });
  }

  try {
    const imageUrl = `/uploads/${req.file.filename}`;
    const msgId = await Message.create({
      conversationId,
      senderId,
      messageType: 'image',
      imageUrl
    });
    const message = await Message.findById(msgId);
    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMessages, sendMessage, sendImageMessage, upload };