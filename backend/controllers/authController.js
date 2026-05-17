// Controllers handle the logic for each route.
// They receive the request, do the work, and send a response.

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    // Check if email already exists
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password (never save plain text passwords!)
    // bcrypt adds a "salt" (random data) to make each hash unique
    // 10 = salt rounds, higher = slower but more secure
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const userId = await User.create({ name, email, password: hashedPassword });

    // Set JWT cookie and return user info
    generateToken(res, userId);
    const user = await User.findById(userId);

    res.status(201).json({ user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare entered password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    generateToken(res, user.id);

    // Don't send the password back
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  // Clear the JWT cookie
  res.cookie('jwt', '', { httpOnly: true, maxAge: 0 });
  res.json({ message: 'Logged out successfully' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  // req.user is set by the authMiddleware
  res.json({ user: req.user });
};

module.exports = { register, login, logout, getMe };