-- =============================================
-- NEB Student Management System - Database Schema
-- For cPanel MySQL Import
-- =============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET FOREIGN_KEY_CHECKS = 0;

-- Use utf8mb4 charset (compatible with most MySQL versions)
/*!40101 SET NAMES utf8mb4 */;

-- =============================================
-- 1. USERS TABLE (No dependencies)
-- =============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','teacher') DEFAULT 'admin',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================
-- 2. ACADEMIC YEARS TABLE (No dependencies)
-- =============================================
DROP TABLE IF EXISTS `academic_years`;
CREATE TABLE `academic_years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year_name` varchar(50) NOT NULL,
  `start_date_bs` varchar(15) NOT NULL,
  `start_date_ad` date NOT NULL,
  `end_date_bs` varchar(15) NOT NULL,
  `end_date_ad` date NOT NULL,
  `is_current` tinyint(1) DEFAULT 0,
  `status` enum('upcoming','active','completed') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================
-- 3. SCHOOL SETTINGS TABLE (No dependencies)
-- =============================================
DROP TABLE IF EXISTS `school_settings`;
CREATE TABLE `school_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_name` varchar(200) NOT NULL,
  `school_address` varchar(200) DEFAULT NULL,
  `school_phone` varchar(20) DEFAULT NULL,
  `school_email` varchar(100) DEFAULT NULL,
  `school_website` varchar(100) DEFAULT NULL,
  `principal_name` varchar(100) DEFAULT NULL,
  `principal_signature_path` varchar(255) DEFAULT NULL,
  `school_logo_path` varchar(255) DEFAULT NULL,
  `school_seal_path` varchar(255) DEFAULT NULL,
  `neb_affiliation_no` varchar(50) DEFAULT NULL,
  `school_code` varchar(50) DEFAULT NULL,
  `academic_year_format` enum('BS','AD') DEFAULT 'BS',
  `timezone` varchar(50) DEFAULT 'Asia/Kathmandu',
  `grading_system` enum('NEB','Custom') DEFAULT 'NEB',
  `passing_percentage` decimal(5,2) DEFAULT 35.00,
  `fax_number` varchar(20) DEFAULT NULL,
  `secondary_phone` varchar(20) DEFAULT NULL,
  `secondary_email` varchar(100) DEFAULT NULL,
  `facebook_url` varchar(255) DEFAULT NULL,
  `twitter_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_school_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================
-- 4. SUBJECTS TABLE (No dependencies)
-- =============================================
DROP TABLE IF EXISTS `subjects`;
CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_name` varchar(100) NOT NULL,
  `theory_code` varchar(10) DEFAULT NULL,
  `practical_code` varchar(10) DEFAULT NULL,
  `theory_full_marks` decimal(5,2) DEFAULT 75.00,
  `practical_full_marks` decimal(5,2) DEFAULT 25.00,
  `theory_credit_hour` decimal(3,2) DEFAULT 3.00,
  `practical_credit_hour` decimal(3,2) DEFAULT 1.00,
  `total_credit_hour` decimal(3,2) GENERATED ALWAYS AS (`theory_credit_hour` + `practical_credit_hour`) STORED,
  `class_level` enum('11','12') NOT NULL,
  `faculty` varchar(50) DEFAULT NULL,
  `is_compulsory` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================
-- 5. STUDENTS TABLE (Depends on: academic_years)
-- =============================================
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `registration_no` varchar(20) DEFAULT NULL COMMENT 'NEB Registration No',
  `symbol_no` varchar(20) DEFAULT NULL COMMENT 'NEB Symbol No',
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `dob_ad` date NOT NULL,
  `dob_bs` varchar(15) NOT NULL,
  `father_name` varchar(100) DEFAULT NULL,
  `mother_name` varchar(100) DEFAULT NULL,
  `enrollment_year` int NOT NULL COMMENT 'e.g. 2080',
  `academic_year_id` int DEFAULT NULL,
  `class_level` enum('11','12') NOT NULL,
  `faculty` varchar(50) NOT NULL,
  `section` varchar(10) DEFAULT 'A',
  `address` text,
  `contact_no` varchar(20) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('active','alumni','dropped') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `registration_no` (`registration_no`),
  UNIQUE KEY `symbol_no` (`symbol_no`),
  KEY `idx_academic_year` (`academic_year_id`),
  CONSTRAINT `fk_students_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================
-- 6. EXAMS TABLE (Depends on: academic_years)
-- =============================================
DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exam_name` varchar(100) NOT NULL,
  `exam_date` date NOT NULL,
  `class_level` enum('11','12') DEFAULT NULL,
  `faculty` varchar(50) DEFAULT NULL,
  `is_final` tinyint(1) DEFAULT 0,
  `academic_year_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_academic_year` (`academic_year_id`),
  CONSTRAINT `fk_exams_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================
-- 7. ATTENDANCE TABLE (Depends on: students)
-- =============================================
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `date` date NOT NULL,
  `status` enum('Present','Absent','Late','Leave') DEFAULT 'Absent',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendance` (`student_id`,`date`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================
-- 8. CHARACTER CERTIFICATES TABLE (Depends on: students)
-- =============================================
DROP TABLE IF EXISTS `character_certificates`;
CREATE TABLE `character_certificates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `certificate_no` varchar(50) NOT NULL,
  `issue_date` date NOT NULL,
  `character_rating` varchar(50) DEFAULT 'Good',
  `conduct_rating` varchar(50) DEFAULT 'Satisfactory',
  `attendance_percentage` decimal(5,2) DEFAULT NULL,
  `total_school_days` int DEFAULT NULL,
  `days_present` int DEFAULT NULL,
  `remarks` text,
  `issued_by` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_no` (`certificate_no`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `character_certificates_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================
-- 9. STUDENT SUBJECTS TABLE (Depends on: students, subjects)
-- =============================================
DROP TABLE IF EXISTS `student_subjects`;
CREATE TABLE `student_subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `academic_year` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment` (`student_id`,`subject_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `student_subjects_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================
-- 10. MARKS TABLE (Depends on: exams, students, subjects)
-- =============================================
DROP TABLE IF EXISTS `marks`;
CREATE TABLE `marks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exam_id` int NOT NULL,
  `student_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `theory_obtained` decimal(5,2) DEFAULT NULL,
  `practical_obtained` decimal(5,2) DEFAULT NULL,
  `total_obtained` decimal(5,2) GENERATED ALWAYS AS (COALESCE(`theory_obtained`,0) + COALESCE(`practical_obtained`,0)) STORED,
  `grade_point` decimal(3,2) DEFAULT NULL,
  `final_grade` varchar(2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_exam_student_subject` (`exam_id`,`student_id`,`subject_id`),
  KEY `student_id` (`student_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `marks_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `marks_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `marks_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- =============================================
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- INSERT DEFAULT ADMIN USER
-- Password: admin123 (bcrypt hashed)
-- =============================================
INSERT INTO `users` (`username`, `password_hash`, `role`) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4HjYh/pEqKEqJME1xGkPbLqzT0sW', 'admin');

-- =============================================
-- INSERT DEFAULT SCHOOL SETTINGS
-- =============================================
INSERT INTO `school_settings` (`school_name`, `school_address`, `academic_year_format`, `grading_system`) VALUES
('Your School Name', 'Your School Address', 'BS', 'NEB');
