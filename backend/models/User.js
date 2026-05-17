// Models contain all database queries related to a resource.
// This keeps your controllers clean — they just call model functions.

const pool = require('../config/db');

const User = {
  // Create a new user
  async create({ name, email, password }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );
    return result.insertId; // Returns the new user's ID
  },

  // Find user by email (used during login)
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0]; // Returns first match or undefined
  },

  // Find user by ID
  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, profile_pic, bio, is_online, last_seen FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // Search users by name or email (for the search feature)
  async search(query, currentUserId) {
    const [rows] = await pool.query(
      `SELECT id, name, email, profile_pic, is_online, last_seen 
       FROM users 
       WHERE (name LIKE ? OR email LIKE ?) AND id != ?
       LIMIT 20`,
      [`%${query}%`, `%${query}%`, currentUserId]
    );
    return rows;
  },

  // Update online status
  async setOnlineStatus(id, isOnline) {
    await pool.query(
      'UPDATE users SET is_online = ?, last_seen = NOW() WHERE id = ?',
      [isOnline, id]
    );
  },

  // Update profile picture
  async updateProfilePic(id, picUrl) {
    await pool.query('UPDATE users SET profile_pic = ? WHERE id = ?', [picUrl, id]);
  }
};

module.exports = User;