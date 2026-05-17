const express = require('express');
const router = express.Router();
const { createOrGetConversation, getConversations } = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createOrGetConversation);
router.get('/', protect, getConversations);

module.exports = router;