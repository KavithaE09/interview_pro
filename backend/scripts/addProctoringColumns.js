const pool = require('../config/db');

async function migrate() {
  try {
    console.log('Running proctoring migration...');
    // Modify status enum to include 'terminated'
    await pool.query(`
      ALTER TABLE assessment_attempts 
      MODIFY COLUMN status ENUM('in_progress', 'submitted', 'auto_submitted', 'expired', 'terminated') DEFAULT 'in_progress'
    `);
    console.log('Updated status enum successfully.');

    // Add violation_reason if not exists
    try {
      await pool.query(`ALTER TABLE assessment_attempts ADD COLUMN violation_reason VARCHAR(255) NULL`);
      console.log('Added violation_reason column.');
    } catch (e) {
      if (!e.message.includes('Duplicate column')) {
        console.log('violation_reason column check:', e.message);
      }
    }

    // Add is_terminated if not exists
    try {
      await pool.query(`ALTER TABLE assessment_attempts ADD COLUMN is_terminated TINYINT(1) DEFAULT 0`);
      console.log('Added is_terminated column.');
    } catch (e) {
      if (!e.message.includes('Duplicate column')) {
        console.log('is_terminated column check:', e.message);
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
