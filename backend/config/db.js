// This file creates a connection pool to MySQL.
// A "pool" means it maintains multiple reusable connections
// instead of opening/closing one every time — much faster.

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,       // Usually 'localhost'
  user: process.env.DB_USER,       // Your MySQL username
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,   // 'realchat'
  waitForConnections: true,
  connectionLimit: 10,             // Max 10 simultaneous connections
  queueLimit: 0
});

module.exports = pool;