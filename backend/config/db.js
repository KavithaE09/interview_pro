const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Kavitha123456789@',
  database: process.env.DB_NAME || 'interviewpro',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  timezone: 'Z',
  dateStrings: true
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log(` Connected to MySQL Database: ${process.env.DB_NAME || 'interviewpro'}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL Connection Failed:', err.message);
  });

module.exports = pool;
