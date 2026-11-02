-- InterviewPro Database Schema
-- Database Name: interviewpro

CREATE DATABASE IF NOT EXISTS `interviewpro` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `interviewpro`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(25) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'candidate') DEFAULT 'candidate',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Assessments Table
CREATE TABLE IF NOT EXISTS `assessments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `duration_minutes` INT NOT NULL DEFAULT 30,
  `total_marks` INT NOT NULL DEFAULT 50,
  `passing_marks` INT NOT NULL DEFAULT 25,
  `available_from` DATETIME NULL,
  `available_until` DATETIME NULL,
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'published',
  `allow_view_answers` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_assessments_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_assessments_status` (`status`),
  INDEX `idx_assessments_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Assessment Assignments Table
CREATE TABLE IF NOT EXISTS `assessment_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assessment_id` INT NOT NULL,
  `candidate_id` INT NOT NULL,
  `status` ENUM('assigned', 'in_progress', 'completed', 'expired') DEFAULT 'assigned',
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_assignment_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignment_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uniq_assessment_candidate` (`assessment_id`, `candidate_id`),
  INDEX `idx_assignments_candidate` (`candidate_id`),
  INDEX `idx_assignments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Questions Table
CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assessment_id` INT NOT NULL,
  `question_text` TEXT NOT NULL,
  `marks` INT NOT NULL DEFAULT 10,
  `question_order` INT NOT NULL DEFAULT 1,
  `expected_keywords` TEXT NULL,
  `explanation` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_question_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE CASCADE,
  INDEX `idx_questions_assessment` (`assessment_id`),
  INDEX `idx_questions_order` (`assessment_id`, `question_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Question Options Table (Optional)
CREATE TABLE IF NOT EXISTS `question_options` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `option_text` TEXT NOT NULL,
  `is_correct` TINYINT(1) DEFAULT 0,
  CONSTRAINT `fk_options_question` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  INDEX `idx_options_question` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Assessment Attempts Table
CREATE TABLE IF NOT EXISTS `assessment_attempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assignment_id` INT NOT NULL,
  `started_at` DATETIME NOT NULL,
  `deadline_at` DATETIME NOT NULL,
  `submitted_at` DATETIME NULL,
  `score` DECIMAL(6,2) DEFAULT 0.00,
  `status` ENUM('in_progress', 'submitted', 'auto_submitted', 'expired') DEFAULT 'in_progress',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attempts_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assessment_assignments`(`id`) ON DELETE CASCADE,
  INDEX `idx_attempts_assignment` (`assignment_id`),
  INDEX `idx_attempts_status` (`status`),
  INDEX `idx_attempts_deadline` (`deadline_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Candidate Answers Table (Supports Open-Ended Text Space and Keyword Matching)
CREATE TABLE IF NOT EXISTS `candidate_answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `attempt_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `answer_text` LONGTEXT NULL,
  `score_awarded` DECIMAL(5,2) DEFAULT 0.00,
  `keywords_matched` TEXT NULL,
  `selected_option_id` INT NULL,
  `marked_for_review` TINYINT(1) DEFAULT 0,
  `answered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_answers_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `assessment_attempts`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uniq_attempt_question` (`attempt_id`, `question_id`),
  INDEX `idx_answers_attempt` (`attempt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
