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
  dateStrings: true,
  ssl: (process.env.DB_SSL === 'true' || Number(process.env.DB_PORT) === 4000 || (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com'))) ? {
    rejectUnauthorized: false
  } : undefined
});

async function ensureColumn(conn, table, column, definition) {
  const [cols] = await conn.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  if (cols.length === 0) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`✅ Added missing column ${table}.${column}`);
  }
}

async function ensureSchema(conn) {
  try {
    await ensureColumn(conn, 'users', 'category_id', 'INT NULL');
    await ensureColumn(conn, 'questions', 'question_type', "VARCHAR(20) DEFAULT 'mcq'");
    await ensureColumn(conn, 'candidate_answers', 'selected_option_id', 'INT NULL');
    await ensureColumn(conn, 'candidate_answers', 'marked_for_review', 'TINYINT(1) DEFAULT 0');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`question_options\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`question_id\` INT NOT NULL,
        \`option_text\` TEXT NOT NULL,
        \`is_correct\` TINYINT(1) DEFAULT 0,
        CONSTRAINT \`fk_options_question\` FOREIGN KEY (\`question_id\`) REFERENCES \`questions\`(\`id\`) ON DELETE CASCADE,
        INDEX \`idx_options_question\` (\`question_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    // Ensure any questions without options are marked as 'text' rather than empty 'mcq'
    await conn.query(`
      UPDATE \`questions\` q
      LEFT JOIN \`question_options\` o ON o.question_id = q.id
      SET q.question_type = 'text'
      WHERE o.id IS NULL AND (q.question_type IS NULL OR q.question_type = 'mcq')
    `);
  } catch (err) {
    console.error('⚠️ Schema auto-migration warning:', err.message);
  }
}

// Test connection on startup & ensure required columns exist
pool.getConnection()
  .then(async conn => {
    console.log(` Connected to MySQL Database: ${process.env.DB_NAME || 'interviewpro'}`);
    await ensureSchema(conn);
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL Connection Failed:', err.message);
  });

module.exports = pool;
