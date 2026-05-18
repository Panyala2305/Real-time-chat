const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, sendFileMessage, upload } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// ✅ IMPORTANT: /file must be defined BEFORE /:conversationId
// Otherwise Express matches "file" as a conversationId param
router.post('/file', protect, upload.single('file'), sendFileMessage);

router.get('/:conversationId', protect, getMessages);
router.post('/', protect, sendMessage);

module.exports = router;