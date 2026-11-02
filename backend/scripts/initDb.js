const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'Kavitha123456789@';
const DB_NAME = process.env.DB_NAME || 'interviewpro';

async function initDatabase() {
  console.log(`Connecting to MySQL host: ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true
    });

    console.log(`Setting up database \`${DB_NAME}\`...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\`;`);
    await connection.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${DB_NAME}\`;`);

    console.log('Applying database schema from schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf-8');
    await connection.query(schemaSql);
    console.log('Schema tables created successfully.');

    // 1. Seed Admin & Demo Candidate
    console.log('Seeding administrative and candidate accounts...');
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const candidatePasswordHash = await bcrypt.hash('Candidate@123', 10);

    const [adminRes] = await connection.query(`
      INSERT INTO users (name, email, phone, password_hash, role) VALUES 
      ('System Administrator', 'admin@interviewpro.com', '+1-555-0100', ?, 'admin')
    `, [adminPasswordHash]);

    const [candRes] = await connection.query(`
      INSERT INTO users (name, email, phone, password_hash, role) VALUES 
      ('Priya Sharma', 'priya.candidate@example.com', '+91-9876543210', ?, 'candidate')
    `, [candidatePasswordHash]);
    const candidateId = candRes.insertId;

    // 2. Seed Category
    console.log('Seeding Category...');
    const [catRes] = await connection.query(`
      INSERT INTO categories (category_name, description) VALUES
      ('Digital Marketing', 'Meta Ads, Facebook Pixel, Campaign Optimization, Cost Per Result, CPA, CPL, CTR, CPM, Custom Audiences, and Performance Strategy.')
    `);
    const categoryId = catRes.insertId;

    // 3. Seed Single Assessment Round 1
    console.log('Seeding Round 1: Digital Marketing Technical Assessment (5 Open-Ended Questions)...');
    const [asmRes] = await connection.query(`
      INSERT INTO assessments (category_id, title, description, duration_minutes, total_marks, passing_marks, status, allow_view_answers)
      VALUES (?, ?, ?, 25, 50, 25, 'published', 1)
    `, [
      categoryId,
      'Round 1: Digital Marketing & Meta Ads Interview Assessment',
      'Evaluation on Meta Ads campaign optimization, Facebook Pixel, CTR/CPM/CR% metrics, custom audiences, and CPA reduction.'
    ]);
    const assessmentId = asmRes.insertId;

    // 4. Seed the 5 Selected Questions with Expected Keywords
    const questions = [
      {
        text: 'How do you optimise when the cost per result goes up for the campaign?',
        marks: 10,
        order: 1,
        expected_keywords: 'fatigue,frequency,creative,audience,targeting,a/b,placement,budget,bid,lookalike,copy,hook',
        explanation: 'When cost per result increases, first inspect Ad Frequency to check for ad fatigue. Solutions include refreshing creative assets (images/videos/hooks), testing new audiences or lookalikes, optimizing placements, revising ad copy, testing different bid strategies, or refining conversion funnel/landing page experience.'
      },
      {
        text: 'What is Facebook pixel?',
        marks: 10,
        order: 2,
        expected_keywords: 'tracking,code,javascript,website,events,conversion,audience,retargeting,roas,meta,measure,optimize',
        explanation: 'Meta (Facebook) Pixel is a snippet of JavaScript tracking code placed on a website that tracks visitor actions and conversion events. It helps measure campaign performance, build custom retargeting audiences, and optimize ad delivery for higher ROAS.'
      },
      {
        text: 'What is CTR, CPM, CR% ? Give an example & calculate the metrics',
        marks: 10,
        order: 3,
        expected_keywords: 'ctr,click through,cpm,cost per mille,impression,cr,conversion rate,click,conversion,spend,formula,percent',
        explanation: 'CTR (Click-Through Rate) = (Clicks / Impressions) * 100%. CPM (Cost Per Mille) = (Spend / Impressions) * 1000. CR% (Conversion Rate) = (Conversions / Clicks) * 100%. Example: If a campaign gets 10,000 impressions, 200 clicks, 10 purchases with $100 spend: CTR = 2%, CPM = $10, CR = 5%.'
      },
      {
        text: 'What are the type of custom audiences? Do you know to create it',
        marks: 10,
        order: 4,
        expected_keywords: 'website,customer list,email,phone,video,lead form,engagement,instagram,facebook,page,app,catalog,lookalike,pixel',
        explanation: 'Types of Custom Audiences in Meta include Website Visitors (via Pixel), Customer List (CRM email/phone upload), Video Viewers, Lead Form submitters, Instagram/Facebook page engagement, and App Activity. Created in Ads Manager > Audiences > Create Audience > Custom Audience by selecting the respective data source.'
      },
      {
        text: 'How do we calculate CPA/CPS, CPL? how can we reduce it or on what CPS can be controlled ?',
        marks: 10,
        order: 5,
        expected_keywords: 'cost per acquisition,cost per lead,cost per sale,spend,conversion,lead,purchase,landing page,creative,offer,targeting,ctr,funnel,a/b',
        explanation: 'CPA (Cost Per Acquisition) / CPS (Cost Per Sale) = Total Ad Spend / Total Purchases. CPL (Cost Per Lead) = Total Ad Spend / Total Leads. To reduce costs: improve ad creative and CTR, refine audience targeting, optimize landing page conversion rate (CRO), test compelling offers, and remove underperforming ad sets.'
      }
    ];

    for (const q of questions) {
      await connection.query(`
        INSERT INTO questions (assessment_id, question_text, marks, question_order, expected_keywords, explanation)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [assessmentId, q.text, q.marks, q.order, q.expected_keywords, q.explanation]);
    }

    console.log('====================================================');
    console.log('✅ InterviewPro Database Initialized & Seeded Successfully!');
    console.log(`   Round 1 Assessment ID: ${assessmentId} (5 Open-ended questions with keyword auto-evaluation)`);
    console.log('   Admin Login: admin@interviewpro.com / Admin@123');
    console.log('====================================================');

  } catch (error) {
    console.error('❌ Database Initialization Failed:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
