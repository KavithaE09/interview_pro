-- InterviewPro Complete Database Schema for Deployment (TiDB / MySQL / phpMyAdmin)
-- Run this script in your TiDB Cloud SQL Editor or phpMyAdmin

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(25) NULL DEFAULT '',
  `password_hash` VARCHAR(255) NULL,
  `role` ENUM('admin', 'candidate') DEFAULT 'candidate',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  INDEX `idx_assessments_status` (`status`),
  INDEX `idx_assessments_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `assessment_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assessment_id` INT NOT NULL,
  `candidate_id` INT NOT NULL,
  `status` ENUM('assigned', 'in_progress', 'completed', 'expired') DEFAULT 'assigned',
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_assessment_candidate` (`assessment_id`, `candidate_id`),
  INDEX `idx_assignments_candidate` (`candidate_id`),
  INDEX `idx_assignments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assessment_id` INT NOT NULL,
  `question_text` TEXT NOT NULL,
  `marks` INT NOT NULL DEFAULT 10,
  `question_order` INT NOT NULL DEFAULT 1,
  `expected_keywords` TEXT NULL,
  `explanation` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_questions_assessment` (`assessment_id`),
  INDEX `idx_questions_order` (`assessment_id`, `question_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `question_options` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `option_text` TEXT NOT NULL,
  `is_correct` TINYINT(1) DEFAULT 0,
  INDEX `idx_options_question` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `assessment_attempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assignment_id` INT NOT NULL,
  `started_at` DATETIME NOT NULL,
  `deadline_at` DATETIME NOT NULL,
  `submitted_at` DATETIME NULL,
  `score` DECIMAL(6,2) DEFAULT 0.00,
  `status` ENUM('in_progress', 'submitted', 'auto_submitted', 'expired', 'terminated') DEFAULT 'in_progress',
  `violation_reason` VARCHAR(255) NULL,
  `is_terminated` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_attempts_assignment` (`assignment_id`),
  INDEX `idx_attempts_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  UNIQUE KEY `uniq_attempt_question` (`attempt_id`, `question_id`),
  INDEX `idx_answers_attempt` (`attempt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `modules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category_id` INT NULL,
  `video_url` VARCHAR(500) NOT NULL,
  `resource_url` VARCHAR(500) NULL,
  `file_name` VARCHAR(255) NULL,
  `assessment_id` INT NULL,
  `order_index` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category_id`),
  INDEX `idx_assessment` (`assessment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `candidate_module_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidate_id` INT NOT NULL,
  `module_id` INT NOT NULL,
  `is_completed` TINYINT(1) DEFAULT 0,
  `completed_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_cand_mod` (`candidate_id`, `module_id`),
  INDEX `idx_cand` (`candidate_id`),
  INDEX `idx_mod` (`module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Admin Account (Email: admin@interviewpro.com / Password: Admin@123)
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`) VALUES
(1, 'System Administrator', 'admin@interviewpro.com', '9876543210', '$2a$10$wK1FmZ7jG6W2mXh3QpUaEOl2N3I8q6zV7W6v0iZ3BqR6c6x5iXp3S', 'admin');
