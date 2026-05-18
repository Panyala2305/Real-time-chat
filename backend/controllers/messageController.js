const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');

// ✅ Allowed file types
const ALLOWED_TYPES = {
  // Images
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  // Documents
  'application/pdf': 'document',
  'application/msword': 'document',                                                      // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document', // .docx
  'application/vnd.ms-excel': 'document',                                                // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',       // .xlsx
  'application/vnd.ms-powerpoint': 'document',                                           // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document', // .pptx
  'text/plain': 'document',                                                               // .txt
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// GET /api/messages/:conversationId
const getMessages = async (req, res) => {
  try {
    const messages = await Message.getByConversation(req.params.conversationId);
    await Message.markAsRead(req.params.conversationId, req.user.id);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/messages — text message
const sendMessage = async (req, res) => {
  const { conversationId, messageText } = req.body;
  if (!conversationId || !messageText) {
    return res.status(400).json({ message: 'conversationId and messageText required' });
  }
  try {
    const msgId = await Message.create({
      conversationId,
      senderId: req.user.id,
      messageType: 'text',
      messageText
    });
    const message = await Message.findById(msgId);
    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/messages/file — image OR document
const sendFileMessage = async (req, res) => {
  // Log everything so we can debug
  console.log('📁 sendFileMessage called');
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);

  const { conversationId } = req.body;

  if (!req.file) {
    console.log('❌ No file in request');
    return res.status(400).json({ message: 'File required' });
  }

  if (!conversationId) {
    console.log('❌ No conversationId in request');
    return res.status(400).json({ message: 'conversationId required' });
  }

  try {
    const messageType = ALLOWED_TYPES[req.file.mimetype];
    console.log('📄 File type detected:', messageType, '| mimetype:', req.file.mimetype);

    if (!messageType) {
      return res.status(400).json({ message: 'File type not allowed' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const msgId = await Message.create({
      conversationId: Number(conversationId),
      senderId: req.user.id,
      messageType,
      imageUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

    console.log('✅ Message created with ID:', msgId);

    const message = await Message.findById(msgId);
    res.status(201).json({ message });

  } catch (error) {
    // ✅ This prints the REAL error to your server terminal
    console.error('❌ sendFileMessage error:', error.message);
    console.error(error.stack);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMessages, sendMessage, sendFileMessage, upload };