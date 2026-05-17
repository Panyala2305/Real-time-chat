const pool = require('../config/db');

const Conversation = {
  // Find existing conversation between two users
  async findBetweenUsers(userId1, userId2) {
    const [rows] = await pool.query(
      `SELECT c.* FROM conversations c
       JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
       JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?`,
      [userId1, userId2]
    );
    return rows[0];
  },

  // Create a new conversation between two users
  async createBetweenUsers(userId1, userId2) {
    const conn = await pool.getConnection(); // Get a dedicated connection for transaction
    try {
      await conn.beginTransaction(); // Start a transaction (all-or-nothing)

      const [result] = await conn.query('INSERT INTO conversations () VALUES ()');
      const conversationId = result.insertId;

      // Add both users as participants
      await conn.query(
        'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)',
        [conversationId, userId1, conversationId, userId2]
      );

      await conn.commit(); // Save all changes
      return conversationId;
    } catch (err) {
      await conn.rollback(); // Undo all changes if anything failed
      throw err;
    } finally {
      conn.release(); // Return connection to pool
    }
  },

  // Get all conversations for a user (the sidebar list)
  async getAllForUser(userId) {
    const [rows] = await pool.query(
      `SELECT 
        c.id,
        c.updated_at,
        u.id AS other_user_id,
        u.name AS other_user_name,
        u.profile_pic AS other_user_pic,
        u.is_online,
        u.last_seen,
        m.message_text AS last_message,
        m.message_type AS last_message_type,
        m.created_at AS last_message_time,
        (SELECT COUNT(*) FROM messages 
         WHERE conversation_id = c.id AND is_read = 0 AND sender_id != ?) AS unread_count
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.user_id = ?
       JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != ?
       JOIN users u ON u.id = cp2.user_id
       LEFT JOIN messages m ON m.id = (
         SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
       )
       ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
      [userId, userId, userId]
    );
    return rows;
  }
};

module.exports = Conversation;