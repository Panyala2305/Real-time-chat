// JWT = JSON Web Token
// It's like a signed digital ID card.
// When a user logs in, we give them a token.
// On every request, they send this token so we know who they are.

const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
  // Create a token that contains the user's ID
  // It expires in 7 days
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  // Store the token in an HttpOnly Cookie
  // HttpOnly means JavaScript on the frontend CANNOT read this cookie
  // This protects against XSS (Cross-Site Scripting) attacks
  res.cookie('jwt', token, {
    httpOnly: true,               // JS can't access this
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',           // Prevents CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  });
};

module.exports = generateToken;