const User = require('../models/User');

// GET /api/users/search?q=john
const searchUsers = async (req, res) => {
  const { q } = req.query; // Get the search term from URL query string
  if (!q) return res.json({ users: [] });

  try {
    const users = await User.search(q, req.user.id);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { searchUsers, getUserById };