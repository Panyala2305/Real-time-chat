const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, sendImageMessage, upload } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:conversationId', protect, getMessages);
router.post('/', protect, sendMessage);
router.post('/image', protect, upload.single('image'), sendImageMessage);

module.exports = router;