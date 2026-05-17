// This middleware runs BEFORE protected route handlers.
// It checks if the request has a valid JWT cookie.
// If yes → continue. If no → send 401 Unauthorized.

const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const protect = async (req, res, next) => {
  const token = req.cookies.jwt; // Read the cookie named 'jwt'

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify the token using our secret key
    // If tampered with or expired, this throws an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get the user from the database using the ID stored in the token
    const [rows] = await pool.query(
      'SELECT id, name, email, profile_pic, bio, is_online, last_seen FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = rows[0]; // Attach user to the request object
    next();             // Move on to the actual route handler
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

module.exports = { protect };