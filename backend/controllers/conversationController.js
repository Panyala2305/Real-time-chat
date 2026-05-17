const Conversation = require('../models/Conversation');

// POST /api/conversations — Create or get existing conversation
const createOrGetConversation = async (req, res) => {
  const { participantId } = req.body; // The other user's ID
  const currentUserId = req.user.id;

  if (!participantId) {
    return res.status(400).json({ message: 'Participant ID required' });
  }

  try {
    // Check if a conversation already exists between these two users
    let conversation = await Conversation.findBetweenUsers(currentUserId, participantId);

    if (!conversation) {
      // Create a new one
      const id = await Conversation.createBetweenUsers(currentUserId, participantId);
      conversation = { id };
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/conversations — Get all conversations for current user (sidebar)
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.getAllForUser(req.user.id);
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createOrGetConversation, getConversations };