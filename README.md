# InterviewPro – Online MCQ Interview Assessment Platform

**InterviewPro** is a modern, responsive, full-stack web application designed specifically for conducting **Round 1 Multiple-Choice Question (MCQ) technical interviews**.

Candidates attend assigned timed assessments, navigate interactive color-coded question palettes, autosave answers to the server, and receive instant score evaluations with performance analytics upon submission.

---

## 🚀 Key Features

- **Strictly MCQ Platform**: Focused exclusively on multiple-choice interview rounds with no coding sandbox or job board overhead.
- **Role-Based Authentication**:
  - **Candidates**: Attend assigned assessments, autosave responses, and review scores and history.
  - **Administrators**: Create categories, configure assessment durations, author 4-option MCQs with explanations, allocate candidates, and analyze results.
- **Server-Enforced Countdown Timer**:
  - Displays remaining time in `HH:MM:SS` format, updating dynamically every second.
  - 5-minute warning indicator and 1-minute critical warning alert.
  - Browser refresh or navigation does not reset the timer (deadline tracked on MySQL server using `UTC_TIMESTAMP()`).
  - Automatic test submission and scoring when the countdown reaches zero.
  - Rejects late answers or duplicate submissions after expiration.
- **Dynamic Category Management**:
  - Seeded with **Digital Marketing** (Meta Ads, Pixel, CPA, CTR, CPM, A/B Testing), **Google Analytics** (GA4 events, traffic acquisition, funnel reports), and **Microsoft Excel** (XLOOKUP, VLOOKUP, Pivot Tables, SUMIFS).
  - Administrators can create additional categories and questions directly through the UI without code changes.
- **Interactive MCQ Assessment Interface**:
  - One question displayed at a time with 4 selectable radio cards.
  - Color-coded question navigation palette (Answered, Unanswered, Marked for Review, Current).
  - "Clear Answer" and "Mark for Review" toggles.
  - Real-time progress bar.
  - Submission confirmation popup displaying answered, unanswered, and review counts.
- **Comprehensive Results & Analytics**:
  - Marks obtained, total marks, percentage, and Pass/Fail status.
  - Time taken (minutes & seconds).
  - Administrator toggle to allow or restrict candidate review of correct answers and question explanations.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), React Router v7, Axios, Lucide Icons, Canvas-Confetti, Modern Vanilla CSS Design System.
- **Backend**: Node.js, Express.js, JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), CORS.
- **Database**: MySQL 8.0+ (`mysql2/promise`).

---

## 🗄️ Database Schema (`interviewpro`)

The application uses an optimized relational schema with foreign key constraints, indexes, and cascades:

1. `users`: Stores candidate and administrator credentials (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `created_at`).
2. `categories`: Interview domains (`id`, `category_name`, `description`, `created_at`).
3. `assessments`: Timed MCQ assessments (`id`, `category_id`, `title`, `description`, `duration_minutes`, `total_marks`, `passing_marks`, `status`, `allow_view_answers`, `created_at`).
4. `assessment_assignments`: Links candidates to assigned assessments (`id`, `assessment_id`, `candidate_id`, `status`, `assigned_at`).
5. `questions`: MCQ questions with explanations (`id`, `assessment_id`, `question_text`, `marks`, `question_order`, `explanation`, `created_at`).
6. `question_options`: 4 options per question (`id`, `question_id`, `option_text`, `is_correct`).
7. `assessment_attempts`: Server-recorded timer and scores (`id`, `assignment_id`, `started_at`, `deadline_at`, `submitted_at`, `score`, `status`, `created_at`).
8. `candidate_answers`: Real-time saved answers and review flags (`id`, `attempt_id`, `question_id`, `selected_option_id`, `marked_for_review`, `answered_at`).

---

## 🔑 Pre-Seeded Demo Credentials

The database comes pre-populated with admin and candidate accounts:

| Role | Email | Password | Pre-Assigned Assessments |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@interviewpro.com` | `Admin@123` | Full administrative control |
| **Candidate** | `candidate@interviewpro.com` | `Candidate@123` | Digital Marketing (Completed), GA4 (Ready), Excel (Ready) |

---

## 📋 Visual Studio Code Setup & Run Instructions

### Step 1: Clone / Open Project
Open the project root folder `interviewpro` in Visual Studio Code.

### Step 2: Configure Environment Variables
Verify or edit `backend/.env` with your local MySQL credentials:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YourMySQLPassword
DB_NAME=interviewpro

JWT_SECRET=interviewpro_super_secure_jwt_secret_key_2026_xYz!#
JWT_EXPIRES_IN=7d
```

### Step 3: Install Dependencies
Open a terminal in Visual Studio Code:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Initialize and Seed MySQL Database
From the `backend` folder, run the automated database setup and seeding script:

```bash
cd backend
npm run init-db
```
*This creates the `interviewpro` database, runs `schema.sql`, and seeds sample categories, assessments, and MCQ questions.*

### Step 5: Run Backend API Server
In Visual Studio Code Terminal 1:

```bash
cd backend
npm run dev
```
*The backend API will run at `http://localhost:5000`.*

### Step 6: Run Frontend Web Application
In Visual Studio Code Terminal 2:

```bash
cd frontend
npm run dev
```
*The frontend will run at `http://localhost:3000` (or the port specified by Vite).*

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🌐 Application Page Map (14 Pages)

### Candidate Portal
1. **Login Page** (`/login`): Role-aware authentication with quick-fill demo buttons.
2. **Candidate Registration Page** (`/register`): Self-registration with email duplication prevention.
3. **Candidate Dashboard** (`/dashboard`): Welcome banner, stats, available assessments, and previous test history.
4. **Available Assessments Page** (`/assessments`): Category filtering, search, and "Start / Resume Interview" buttons.
5. **MCQ Interview Page** (`/interview/:attemptId`): 1-question display, 4 radio options, color-coded palette, clear answer, mark for review, and countdown timer.
6. **Assessment Submission Confirmation Page** (`/assessment/:attemptId/confirm-submit`): Pre-submission summary of answered, unanswered, and review counts.
7. **Assessment Results Page** (`/results/:attemptId`): Score calculation, Pass/Fail status, time taken, and question-by-question review with explanations.
8. **Candidate Profile Page** (`/profile`): Candidate contact details, test statistics, and official transcripts.

### Administrator Portal
9. **Admin Dashboard** (`/admin/dashboard`): Metrics overview, quick management shortcuts, and recent candidate submissions.
10. **Category Management Page** (`/admin/categories`): CRUD interface for interview domains (Digital Marketing, GA4, Excel, etc.).
11. **Assessment Management Page** (`/admin/assessments`): Duration configuration, pass marks, publish toggles, candidate assignment.
12. **Question Management Page** (`/admin/assessments/:assessmentId/questions`): Add/edit/delete 4-choice questions with correct answer selection and explanations.
13. **Candidate Management Page** (`/admin/candidates`): Candidate search, assignment modal, and historical attempt inspections.
14. **Results Management Page** (`/admin/results`): Comprehensive audit table with correct/incorrect answer breakdowns and filtering.
