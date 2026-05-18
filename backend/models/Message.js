const pool = require('../config/db');

const Message = {
  async create({ conversationId, senderId, messageType, messageText, imageUrl, fileName, fileSize }) {
    const [result] = await pool.query(
      `INSERT INTO messages 
        (conversation_id, sender_id, message_type, message_text, image_url, file_name, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [conversationId, senderId, messageType, messageText || null, imageUrl || null, fileName || null, fileSize || null]
    );
    await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [conversationId]);
    return result.insertId;
  },

  async getByConversation(conversationId) {
    const [rows] = await pool.query(
      `SELECT m.*, u.name AS sender_name, u.profile_pic AS sender_pic
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );
    return rows;
  },

  async markAsRead(conversationId, userId) {
    await pool.query(
      'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0',
      [conversationId, userId]
    );
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT m.*, u.name AS sender_name, u.profile_pic AS sender_pic
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [id]
    );
    return rows[0];
  }
};

module.exports = Message;