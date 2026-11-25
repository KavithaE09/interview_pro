const pool = require('../config/db');

async function migrate() {
  try {
    console.log('Starting migration...');

    // 1. Allow password_hash & phone to be nullable in users
    try {
      await pool.query('ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL');
      await pool.query("ALTER TABLE users MODIFY phone VARCHAR(25) NULL DEFAULT ''");
      console.log('✓ users table altered (password_hash & phone now nullable).');
    } catch (e) {
      console.warn('users table alter warning:', e.message);
    }

    // 2. Create modules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INT NULL,
        video_url VARCHAR(500) NOT NULL,
        resource_url VARCHAR(500) NULL,
        file_name VARCHAR(255) NULL,
        assessment_id INT NULL,
        order_index INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category_id),
        INDEX idx_assessment (assessment_id)
      )
    `);
    console.log('✓ modules table created/verified.');

    // 3. Create candidate_module_progress table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidate_module_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidate_id INT NOT NULL,
        module_id INT NOT NULL,
        is_completed TINYINT(1) DEFAULT 0,
        completed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_cand_mod (candidate_id, module_id),
        INDEX idx_cand (candidate_id),
        INDEX idx_mod (module_id)
      )
    `);
    console.log('✓ candidate_module_progress table created/verified.');

    // 4. Ensure an Excel category exists
    const [cats] = await pool.query('SELECT id, category_name FROM categories WHERE category_name LIKE ?', ['%Excel%']);
    let excelCatId = null;
    if (cats.length > 0) {
      excelCatId = cats[0].id;
      console.log('Found existing Excel category ID:', excelCatId);
    } else {
      const [newCat] = await pool.query('INSERT INTO categories (category_name, description) VALUES (?, ?)', [
        'Microsoft Excel',
        'Fundamental and advanced spreadsheet skills, formulas, and data analysis.'
      ]);
      excelCatId = newCat.insertId;
      console.log('✓ Created Microsoft Excel category ID:', excelCatId);
    }

    // 5. Check if an Excel assessment exists, if not create one for Excel
    const [existingAsm] = await pool.query('SELECT id FROM assessments WHERE category_id = ? OR title LIKE ?', [excelCatId, '%Excel%']);
    let excelAssessmentId = null;
    if (existingAsm.length > 0) {
      excelAssessmentId = existingAsm[0].id;
      console.log('Found existing Excel assessment ID:', excelAssessmentId);
    } else {
      const [newAsm] = await pool.query(`
        INSERT INTO assessments (category_id, title, description, duration_minutes, total_marks, passing_marks, status, allow_view_answers)
        VALUES (?, ?, ?, 30, 50, 25, 'published', 1)
      `, [
        excelCatId,
        'Excel Fundamentals & Practical Assessment',
        'Test your proficiency with basic spreadsheet operations, SUM/AVERAGE/IF formulas, and table formatting.'
      ]);
      excelAssessmentId = newAsm.insertId;
      console.log('✓ Created default Excel Assessment ID:', excelAssessmentId);

      // Add a couple sample questions
      await pool.query(`
        INSERT INTO questions (assessment_id, question_text, marks, question_order, expected_keywords, explanation)
        VALUES 
        (?, 'Explain what the VLOOKUP formula does in Excel and what arguments it requires.', 15, 1, 'lookup_value, table_array, col_index_num, range_lookup, vertical search', 'VLOOKUP searches for a value in the first column of a table and returns a value in the same row from a specified column.'),
        (?, 'What is the difference between relative and absolute cell references in Excel (e.g., A1 vs $A$1)?', 15, 2, 'dollar sign, absolute, relative, lock, formula copy', 'Relative references change when copied across cells; absolute references lock the row and/or column with a dollar sign ($).'),
        (?, 'How do you create a pivot table in Excel and what is it used for?', 20, 3, 'insert, pivot table, summarize, aggregate, group data', 'Go to Insert > PivotTable to summarize, sort, reorganize, and analyze large datasets without altering raw data.')
      `, [excelAssessmentId, excelAssessmentId, excelAssessmentId]);
      console.log('✓ Added questions for Excel assessment.');
    }

    // 6. Seed default Excel module
    const [existingMods] = await pool.query('SELECT id FROM modules');
    if (existingMods.length === 0) {
      await pool.query(`
        INSERT INTO modules (title, description, category_id, assessment_id, video_url, resource_url, file_name, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        'Basics of Excel - Complete Beginner Guide',
        'Master the fundamental concepts of Microsoft Excel: Workbook structure, Cells & Ranges, Essential Formulas (SUM, AVERAGE, IF, VLOOKUP), Data Formatting, and Shortcuts.',
        excelCatId,
        excelAssessmentId,
        'https://www.youtube.com/watch?v=Vl0H-qTclOg',
        'https://support.microsoft.com/en-us/excel',
        'Excel_Formulas_CheatSheet.pdf'
      ]);
      console.log('✓ Seeded default Excel learning module.');
    }

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
