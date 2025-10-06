-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 03, 2025 at 02:56 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sci_digiknowledge`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `categorie_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `document_id` mediumint(8) UNSIGNED NOT NULL,
  `user_id` smallint(5) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `keywords` text DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected') DEFAULT 'draft',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `download_count` int(11) DEFAULT 0,
  `file_paths` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'เก็บ path, original_name, file_type, section ของไฟล์แต่ละบท' CHECK (json_valid(`file_paths`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`document_id`, `user_id`, `title`, `keywords`, `academic_year`, `status`, `uploaded_at`, `download_count`, `file_paths`) VALUES
(2, 1, 'ใบคำร้อง', 'ใบคำร้อง', '2568', 'draft', '2025-07-29 15:42:45', 0, NULL),
(3, 1, 'ระบบเว็บไซต์คลังผลงานโครงงาน SciDigiKnowledge', 'เว็บไซต์', '2568', 'draft', '2025-07-29 15:53:52', 0, NULL),
(4, 1, 'vdo ปริญญานิพนต์', 'vdo ปริญญานิพนต์', '2566', 'draft', '2025-07-29 16:01:23', 0, NULL),
(5, 1, 'สรุปคะแนน', 'คะแนน', '2568', 'draft', '2025-07-29 17:32:29', 0, NULL),
(6, 1, 'บทที่2', 'สไลด์สอน', '2568', 'draft', '2025-07-29 17:38:09', 0, NULL),
(7, 1, 'บทที่2', 'สไลด์', '2568', 'draft', '2025-07-29 17:40:44', 0, NULL),
(8, 1, 't commit', 'guy', '2568', 'draft', '2025-08-17 19:14:47', 0, NULL),
(11, 1, 'โครงงานวิจัยการใช้ถ่านชีวภาพ', 'biochar, environment', '2567', 'draft', '2025-08-27 18:12:48', 0, NULL),
(12, 1, 'บทความเทคโนโลยีสารสนเทศ', 'IT, digital', '2566', 'draft', '2025-08-27 18:12:48', 0, NULL),
(13, 9, '1', '2', '', 'draft', '2025-09-18 17:53:26', 0, NULL),
(14, 9, 'ชื่อเอกสารตัวอย่าง', NULL, NULL, '', '2025-09-18 19:21:48', 0, NULL),
(15, 9, 'ชื่อเอกสารตัวอย่าง', 'keyword1, keyword2', '2568', '', '2025-09-18 19:22:04', 0, NULL),
(16, 9, 'ชื่อเอกสารตัวอย่าง', 'keyword1, keyword2', '2568', '', '2025-09-18 19:26:44', 0, NULL),
(17, 9, 'ชื่อเอกสารตัวอย่าง', 'keyword1, keyword2', '2568', '', '2025-09-18 19:30:00', 0, NULL),
(18, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:08:58', 0, NULL),
(19, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:09:15', 0, NULL),
(20, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:10:36', 0, NULL),
(21, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:11:10', 0, NULL),
(22, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:12:13', 0, NULL),
(23, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:12:15', 0, NULL),
(24, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:12:19', 0, NULL),
(25, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:12:34', 0, NULL),
(26, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:13:59', 0, NULL),
(27, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:14:02', 0, NULL),
(28, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:18:08', 0, NULL),
(29, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:18:21', 0, NULL),
(30, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:24:28', 0, NULL),
(31, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:26:01', 0, NULL),
(32, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:27:23', 0, NULL),
(33, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:28:52', 0, NULL),
(34, 9, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:30:18', 0, NULL),
(36, 11, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:30:42', 0, NULL),
(37, 11, 'fgdg', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-18 22:31:12', 0, NULL),
(38, 9, '45', '', '', 'approved', '2025-09-25 21:05:06', 0, NULL),
(39, 9, '45', '', '', 'approved', '2025-09-25 21:07:47', 0, NULL),
(40, 9, '45', '', '', '', '2025-09-25 21:14:09', 0, NULL),
(41, 9, 'การจองห้อง', 'การจอง', '2568', '', '2025-09-25 21:19:49', 0, NULL),
(42, 9, 'การจองห้อง', 'การจอง', '2568', 'draft', '2025-09-25 21:23:17', 0, NULL),
(43, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:23:40', 0, NULL),
(44, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:24:54', 0, NULL),
(45, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:25:33', 0, NULL),
(46, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:29:48', 0, NULL),
(47, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:30:52', 0, NULL),
(48, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:31:41', 0, NULL),
(49, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:33:38', 0, NULL),
(50, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:33:39', 0, NULL),
(51, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:34:28', 0, NULL),
(52, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:35:45', 0, NULL),
(53, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:40:46', 0, NULL),
(54, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:41:19', 0, NULL),
(55, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:49:43', 0, NULL),
(56, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:52:15', 0, NULL),
(57, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:55:14', 0, NULL),
(58, 9, 'เ่้่้', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 21:56:45', 0, NULL),
(59, 9, 'dki0v\'', 'sfdsfs', 'sfdfd', '', '2025-09-25 22:00:23', 0, NULL),
(60, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:01:53', 0, NULL),
(61, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:02:58', 0, NULL),
(62, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:03:22', 0, NULL),
(63, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:03:52', 0, NULL),
(64, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:04:33', 0, NULL),
(65, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:04:56', 0, NULL),
(66, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:05:12', 0, NULL),
(67, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:06:54', 0, NULL),
(68, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:07:45', 0, NULL),
(69, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:08:11', 0, NULL),
(70, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:09:19', 0, NULL),
(71, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:09:55', 0, NULL),
(72, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:11:04', 0, NULL),
(73, 9, 'ดเ้เ้', 'เ้ด้ด', 'ด้ดเ้ดเ้', '', '2025-09-25 22:14:33', 0, NULL),
(74, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:18:47', 0, NULL),
(75, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:22:02', 0, NULL),
(76, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:22:52', 0, NULL),
(77, 9, 'การจองห้องประชุม', 'การจอง , เว็บไซต์', '2568', 'draft', '2025-09-25 22:23:16', 0, NULL),
(78, 1, 'เว็บไซต์', 'ดกเกดเ', '2568', 'draft', '2025-09-25 22:27:23', 0, NULL),
(79, 1, 'ด้เ้เ', 'ด้เด้ดเ', 'ด้เด้เด', '', '2025-09-25 22:38:29', 0, NULL),
(80, 1, 'จองห้องประชุม', 'เว็บจองห้องประชุม', '2568', '', '2025-09-30 19:46:52', 0, NULL),
(81, 1, 'จองห้องประชุม', 'เว็บจองห้องประชุม', '2568', '', '2025-09-30 19:48:01', 0, NULL),
(82, 1, 'จองห้องประชุม', 'เว็บจองห้องประชุม', '2568', '', '2025-09-30 20:03:39', 0, NULL),
(83, 1, 'จองห้อง', 'การจองห้องประชุม', '2568', '', '2025-09-30 20:15:19', 0, NULL),
(84, 1, 'ห้องประชุม', 'การจอง', '2568', '', '2025-09-30 20:18:20', 0, NULL),
(85, 9, 'พัฒนาเว็บ', 'การจองห้องประชุม', '2568', '', '2025-09-30 20:22:41', 0, NULL),
(86, 9, 'เว็บไซต์จองห้องประชุม', 'ห้องประชุม', '2568', '', '2025-09-30 20:42:53', 0, NULL),
(87, 9, 'เว็บคลังผลงาน', 'เอกสารดิจิทัล', '2568', '', '2025-09-30 21:02:47', 0, NULL),
(88, 9, 'ห้อง', 'ห้องงง', '2568', '', '2025-09-30 21:09:19', 0, NULL),
(89, 9, 'หกกด', 'หดกหด', '2568', '', '2025-09-30 21:17:43', 0, NULL),
(90, 9, 'กดหด', 'หดกดด', '2568', '', '2025-09-30 21:24:29', 0, NULL),
(91, 9, 'กดหกด', 'หดหกด', 'หดกห', '', '2025-09-30 21:25:59', 0, NULL),
(92, 9, 'การจอง', 'การจอง', '2568', '', '2025-09-30 21:35:04', 0, NULL),
(93, 9, 'dki0v\'', 'sfsf', '2568', '', '2025-09-30 21:49:54', 0, NULL),
(94, 9, 'ห้องประชุม', 'เว็บ', '2568', '', '2025-10-02 22:13:14', 0, NULL),
(95, 9, 'ดเกเ', 'กเดก', 'กเดก', '', '2025-10-02 22:35:21', 0, NULL),
(96, 9, 'กหดห', 'หกดห', 'หดหกด', '', '2025-10-02 22:42:40', 0, NULL),
(97, 9, 'จองห้องประชุม', 'เว็บไซต์', '2568', '', '2025-10-02 23:49:05', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `document_categories`
--

CREATE TABLE `document_categories` (
  `document_id` mediumint(8) UNSIGNED NOT NULL,
  `categorie_id` mediumint(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_categories`
--

INSERT INTO `document_categories` (`document_id`, `categorie_id`) VALUES
(15, 1),
(16, 1),
(17, 1),
(30, 1),
(31, 1),
(32, 1),
(33, 1),
(34, 1),
(36, 1),
(37, 1);

-- --------------------------------------------------------

--
-- Table structure for table `document_files`
--

CREATE TABLE `document_files` (
  `document_file_id` mediumint(8) UNSIGNED NOT NULL,
  `document_id` mediumint(8) UNSIGNED NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `file_type` varchar(20) DEFAULT NULL,
  `section` varchar(100) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `cover_path` varchar(255) DEFAULT NULL,
  `abstract_path` varchar(255) DEFAULT NULL,
  `acknowledgement_path` varchar(255) DEFAULT NULL,
  `toc_path` varchar(255) DEFAULT NULL,
  `chapter1_path` varchar(255) DEFAULT NULL,
  `chapter2_path` varchar(255) DEFAULT NULL,
  `chapter3_path` varchar(255) DEFAULT NULL,
  `chapter4_path` varchar(255) DEFAULT NULL,
  `chapter5_path` varchar(255) DEFAULT NULL,
  `reference_path` varchar(255) DEFAULT NULL,
  `appendix_path` varchar(255) DEFAULT NULL,
  `author_bio_path` varchar(255) DEFAULT NULL,
  `presentation_video_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_files`
--

INSERT INTO `document_files` (`document_file_id`, `document_id`, `file_path`, `original_name`, `file_type`, `section`, `uploaded_at`, `cover_path`, `abstract_path`, `acknowledgement_path`, `toc_path`, `chapter1_path`, `chapter2_path`, `chapter3_path`, `chapter4_path`, `chapter5_path`, `reference_path`, `appendix_path`, `author_bio_path`, `presentation_video_path`) VALUES
(1, 30, 'uploads\\1758234268668-StatisticsChapter4_Probability and Counting Rules (2).pdf', 'StatisticsChapter4_Probability and Counting Rules (2).pdf', 'application/pdf', 'main', '2025-09-18 22:24:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 31, 'uploads\\1758234361199-StatisticsChapter4_Probability and Counting Rules (2).pdf', 'StatisticsChapter4_Probability and Counting Rules (2).pdf', 'application/pdf', 'main', '2025-09-18 22:26:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 32, 'uploads\\1758234443571-StatisticsChapter4_Probability and Counting Rules (2).pdf', 'StatisticsChapter4_Probability and Counting Rules (2).pdf', 'application/pdf', 'main', '2025-09-18 22:27:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 33, 'uploads\\1758234532078-StatisticsChapter4_Probability and Counting Rules (2).pdf', 'StatisticsChapter4_Probability and Counting Rules (2).pdf', 'application/pdf', 'main', '2025-09-18 22:28:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 34, 'uploads\\1758234618213-StatisticsChapter4_Probability and Counting Rules (2).pdf', 'StatisticsChapter4_Probability and Counting Rules (2).pdf', 'application/pdf', 'main', '2025-09-18 22:30:18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 36, 'uploads\\1758234642805-StatisticsChapter4_Probability and Counting Rules (2).pdf', 'StatisticsChapter4_Probability and Counting Rules (2).pdf', 'application/pdf', 'main', '2025-09-18 22:30:42', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 37, 'uploads\\1758234672691-StatisticsChapter4_Probability and Counting Rules (2).pdf', 'StatisticsChapter4_Probability and Counting Rules (2).pdf', 'application/pdf', 'main', '2025-09-18 22:31:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 40, '1758834849289-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 21:14:09', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 41, '1758835189695-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'เว็บไซต์', '2025-09-25 21:19:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 42, '1758835397665-à¸à¸à¸à¸µà¹4(1).pdf', 'à¸à¸à¸à¸µà¹4(1).pdf', 'application/pdf', 'เว็บไซต์', '2025-09-25 21:23:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 43, '1758835420644-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'อื่นๆ', '2025-09-25 21:23:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 44, '1758835494747-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'อื่นๆ', '2025-09-25 21:24:54', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 45, '1758835533289-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'อื่นๆ', '2025-09-25 21:25:33', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 46, '1758835787903-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'อื่นๆ', '2025-09-25 21:29:48', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 47, '1758835852199-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'อื่นๆ', '2025-09-25 21:30:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 48, '1758835901672-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'อื่นๆ', '2025-09-25 21:31:41', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 49, '1758836018733-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'อื่นๆ', '2025-09-25 21:33:38', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 50, '1758836019822-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'อื่นๆ', '2025-09-25 21:33:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 51, '1758836068734-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'อื่นๆ', '2025-09-25 21:34:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 52, '1758836145159-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'อื่นๆ', '2025-09-25 21:35:45', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 53, '1758836446842-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'อื่นๆ', '2025-09-25 21:40:46', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 54, '1758836479722-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'อื่นๆ', '2025-09-25 21:41:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, 55, '1758836983730-Cloud w11.pdf', 'Cloud w11.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 21:49:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 56, '1758837135273-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 21:52:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 57, '1758837314058-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 21:55:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, 58, '1758837405525-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 21:56:45', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(27, 59, '1758837623436-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'dsfsf', '2025-09-25 22:00:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 60, '1758837713725-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:01:53', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(29, 61, '1758837778149-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:02:58', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 62, '1758837802947-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:03:22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, 63, '1758837832094-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:03:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, 64, '1758837873467-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:04:33', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, 65, '1758837896005-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:04:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(34, 66, '1758837912420-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:05:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(35, 67, '1758838014336-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:06:54', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(36, 68, '1758838065073-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:07:45', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(37, 69, '1758838091081-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:08:11', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(38, 70, '1758838159322-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:09:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(39, 71, '1758838195442-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:09:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(40, 72, '1758838264901-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:11:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(41, 73, '1758838472956-à¸à¸à¸à¸µà¹4.docx', 'à¸à¸à¸à¸µà¹4.docx', 'application/vnd.open', 'เด้ด้ด', '2025-09-25 22:14:33', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(42, 74, '1758838726958-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:18:47', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(43, 75, '1758838922918-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:22:02', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(44, 76, '1758838972804-à¸à¸à¸à¸µà¹4.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:22:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(45, 77, '1758838996906.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'อื่นๆ', '2025-09-25 22:23:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(46, 78, '1758839243324.pdf', 'à¸à¸à¸à¸µà¹4.pdf', 'application/pdf', 'เสร', '2025-09-25 22:27:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(47, 79, '1758839909489.pdf', 'à¸à¸à¸à¸µà¹4(1).pdf', 'application/pdf', 'ดเ้้เด', '2025-09-25 22:38:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(48, 80, '1759261612577.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'เว็บไซต์ , ห้องประชุม', '2025-09-30 19:46:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(49, 81, '1759261681241.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'เว็บไซต์ , ห้องประชุม', '2025-09-30 19:48:01', '1759261681633.jpg', '1759261681669.pdf', '1759261681703.pdf', '1759261681724.pdf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1759261681742.mp4'),
(50, 82, '1759262619369.jpg', 'messageImage_1758945335820.jpg', 'image/jpeg', 'เว็บไซต์ , ห้องประชุม', '2025-09-30 20:03:39', '1759262619461.jpg', '1759262619475.pdf', '1759262619493.pdf', '1759262619507.pdf', '1759262619517.pdf', '1759262619533.pdf', NULL, NULL, NULL, NULL, NULL, NULL, '1759262619544.mp4'),
(51, 83, '1759263319251.jpg', 'messageImage_1758945335820.jpg', 'image/jpeg', 'เว็บไซต์ , ห้องประชุม', '2025-09-30 20:15:19', '1759263319299.pdf', '1759263319315.pdf', '1759263319331.pdf', '1759263319342.pdf', '1759263319356.pdf', '1759263319369.pdf', '1759263319438.pdf', '1759263319454.pdf', '1759263319463.pdf', '1759263319474.pdf', '1759263319487.pdf', '1759263319496.pdf', '1759263319505.mp4'),
(52, 84, '1759263500806.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'เว็บไซต์', '2025-09-30 20:18:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(53, 85, '1759263761540.jpg', 'messageImage_1758945335820.jpg', 'image/jpeg', 'เว็บไซต์ ', '2025-09-30 20:22:41', '1759263761568.pdf', '1759263761580.pdf', '1759263761593.pdf', '1759263761602.pdf', '1759263761613.pdf', '1759263761623.pdf', '1759263761920.pdf', '1759263762739.pdf', '1759263763214.pdf', '1759263764040.pdf', '1759263764366.pdf', '1759263764368.pdf', '1759263764426.mp4'),
(54, 86, '1759264973649.pdf', 'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf', 'application/pdf', 'เว็บไซต์', '2025-09-30 20:42:53', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(55, 86, '1759264973754.jpg', 'messageImage_1758945335820.jpg', 'image/jpeg', 'cover', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(56, 86, '1759264973770.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'abstract', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(57, 86, '1759264973785.pdf', 'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf', 'application/pdf', 'acknowledgement', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(58, 86, '1759264973802.pdf', 'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf', 'application/pdf', 'toc', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(59, 86, '1759264973813.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'chapter1', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(60, 86, '1759264973832.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'chapter2', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(61, 86, '1759264973842.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'chapter3', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(62, 86, '1759264973853.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'chapter4', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(63, 86, '1759264973869.pdf', 'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf', 'application/pdf', 'chapter5', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(64, 86, '1759264973884.pdf', 'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf', 'application/pdf', 'reference', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(65, 86, '1759264973899.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'appendix', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(66, 86, '1759264973940.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'author_bio', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(67, 86, '1759264973955.mp4', '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4', 'video/mp4', 'presentation_video', '2025-09-30 20:42:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(68, 87, '1759266167924.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'เว็บไซต์', '2025-09-30 21:02:48', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(69, 87, '1759266168024.jpg', 'messageImage_1758945335820.jpg', 'image/jpeg', 'cover', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(70, 87, '1759266168032.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'abstract', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(71, 87, '1759266168045.pdf', 'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf', 'application/pdf', 'acknowledgement', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(72, 87, '1759266168057.pdf', 'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf', 'application/pdf', 'toc', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(73, 87, '1759266168066.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'chapter1', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(74, 87, '1759266168081.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'chapter2', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(75, 87, '1759266168091.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'chapter3', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(76, 87, '1759266168101.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'chapter4', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(77, 87, '1759266168114.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'chapter5', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(78, 87, '1759266168127.pdf', 'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf', 'application/pdf', 'reference', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(79, 87, '1759266168138.pdf', 'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf', 'application/pdf', 'appendix', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(80, 87, '1759266168146.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'author_bio', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(81, 87, '1759266168162.mp4', '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4', 'video/mp4', 'presentation_video', '2025-09-30 21:02:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(82, 88, '1759266559408.jpg', 'messageImage_1758945335820.jpg', 'image/jpeg', 'ห้องง', '2025-09-30 21:09:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(83, 88, '1759266559478.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'cover', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(84, 88, '1759266559495.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'abstract', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(85, 88, '1759266559508.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'acknowledgement', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(86, 88, '1759266559520.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'toc', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(87, 88, '1759266559531.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'chapter1', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(88, 88, '1759266559548.pdf', 'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf', 'application/pdf', 'chapter2', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(89, 88, '1759266559561.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'chapter3', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(90, 88, '1759266559574.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'chapter4', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(91, 88, '1759266559590.pdf', 'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf', 'application/pdf', 'chapter5', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(92, 88, '1759266559604.pdf', 'à¸à¸à¸à¸µà¹ 12 ok.pdf', 'application/pdf', 'reference', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(93, 88, '1759266559642.pdf', 'Exercise4052201_w14.pdf', 'application/pdf', 'appendix', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(94, 88, '1759266559644.pdf', 'Exercise4052201_w13.pdf', 'application/pdf', 'author_bio', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(95, 88, '1759266559651.mp4', '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4', 'video/mp4', 'presentation_video', '2025-09-30 21:09:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(96, 89, '1759267063513.jpg', 'messageImage_1758945335820.jpg', 'image/jpeg', 'กดหดห', '2025-09-30 21:17:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(97, 89, '1759267063591.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'cover', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(98, 89, '1759267063617.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'abstract', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(99, 89, '1759267063634.pdf', 'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf', 'application/pdf', 'acknowledgement', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(100, 89, '1759267063643.pdf', 'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf', 'application/pdf', 'toc', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(101, 89, '1759267063655.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'chapter1', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(102, 89, '1759267063665.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'chapter2', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(103, 89, '1759267063678.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'chapter3', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(104, 89, '1759267063688.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'chapter4', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(105, 89, '1759267063700.pdf', 'Cloud w12.pdf', 'application/pdf', 'chapter5', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(106, 89, '1759267063707.pdf', 'Cloud w12.pdf', 'application/pdf', 'reference', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(107, 89, '1759267063717.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'appendix', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(108, 89, '1759267063727.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'author_bio', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(109, 89, '1759267063738.mp4', '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4', 'video/mp4', 'presentation_video', '2025-09-30 21:17:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(110, 90, '1759267469009.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'หดหด', '2025-09-30 21:24:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(111, 90, '1759267469098.jpg', 'messageImage_1758945335820.jpg', 'image/jpeg', 'cover', '2025-09-30 21:24:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(112, 90, '1759267469111.pdf', 'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf', 'application/pdf', 'abstract', '2025-09-30 21:24:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(113, 90, '1759267469122.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'acknowledgement', '2025-09-30 21:24:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(114, 90, '1759267469135.mp4', '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4', 'video/mp4', 'presentation_video', '2025-09-30 21:24:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(115, 91, '1759267559666.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'หดหดหก', '2025-09-30 21:25:59', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(116, 91, '1759267559744.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'cover', '2025-09-30 21:26:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(117, 91, '1759267559761.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'abstract', '2025-09-30 21:26:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(118, 91, '1759267559772.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'acknowledgement', '2025-09-30 21:26:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(119, 91, '1759267559785.mp4', '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4', 'video/mp4', 'presentation_video', '2025-09-30 21:26:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(120, 92, '1759268104586.jpg', 'messageImage_1758945335820.jpg', 'image/jpeg', 'จอง', '2025-09-30 21:35:04', '1759268104666.pdf', '1759268104683.pdf', '1759268104697.pdf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1759268104710.mp4'),
(121, 93, '1759268994748.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'dfss', '2025-09-30 21:49:54', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(122, 93, '1759268994875.jpg', 'messageImage_1758945335820.jpg', 'image/jpeg', 'cover', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(123, 93, '1759268994887.pdf', 'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf', 'application/pdf', 'abstract', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(124, 93, '1759268994907.pdf', 'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf', 'application/pdf', 'acknowledgement', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(125, 93, '1759268994934.pdf', 'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf', 'application/pdf', 'toc', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(126, 93, '1759268994960.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'chapter1', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(127, 93, '1759268994990.pdf', 'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf', 'application/pdf', 'chapter2', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(128, 93, '1759268995007.pdf', 'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf', 'application/pdf', 'chapter3', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(129, 93, '1759268995035.pdf', 'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf', 'application/pdf', 'chapter4', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(130, 93, '1759268995051.pdf', 'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf', 'application/pdf', 'chapter5', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(131, 93, '1759268995071.pdf', 'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf', 'application/pdf', 'reference', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(132, 93, '1759268995092.pdf', 'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf', 'application/pdf', 'appendix', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(133, 93, '1759268995110.pdf', 'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf', 'application/pdf', 'author_bio', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(134, 93, '1759268995131.mp4', '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4', 'video/mp4', 'presentation_video', '2025-09-30 21:49:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(135, 94, '1759443194146.pdf', 'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf', 'application/pdf', 'เว็บไซต์', '2025-10-02 22:13:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(136, 94, '1759443194240.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'cover', '2025-10-02 22:13:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(137, 94, '1759443194261.mp4', '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4', 'video/mp4', 'presentation_video', '2025-10-02 22:13:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(138, 95, '1759444521622.pdf', 'à¸à¸à¸à¸µà¹ 4.pdf', 'application/pdf', 'กเดก', '2025-10-02 22:35:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(139, 95, '1759444521699.pdf', 'à¸à¸à¸à¸µà¹ 4.pdf', 'application/pdf', 'cover', '2025-10-02 22:35:22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(140, 95, '1759444521704.mp4', '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4', 'video/mp4', 'presentation_video', '2025-10-02 22:35:22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(141, 96, '/uploads/1759444960031.pdf', 'à¸à¸à¸à¸µà¹ 4.pdf', 'application/pdf', 'หกดห', '2025-10-02 22:42:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(142, 96, '1759444960073.pdf', 'à¸à¸à¸à¸µà¹ 4.pdf', 'application/pdf', 'cover', '2025-10-02 22:42:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(143, 96, '1759444960074.mp4', '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4', 'video/mp4', 'presentation_video', '2025-10-02 22:42:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(144, 97, '/uploads/1759448945456.pdf', 'à¸à¸à¸à¸µà¹4(2).pdf', 'application/pdf', 'Hardware(ฮาร์ดแวร์)', '2025-10-02 23:49:05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(145, 97, '1759448945625.pdf', 'à¸à¸à¸à¸µà¹ 13 ok.pdf', 'application/pdf', 'cover', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(146, 97, '1759448945688.pdf', 'à¸à¸à¸à¸µà¹ 4.pdf', 'application/pdf', 'abstract', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(147, 97, '1759448945694.jpg', 'messageImage_1758945335820.jpg', 'image/jpeg', 'acknowledgement', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(148, 97, '1759448945701.pdf', 'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf', 'application/pdf', 'toc', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(149, 97, '1759448945712.pdf', 'à¸à¸à¸à¸µà¹4(2).pdf', 'application/pdf', 'chapter1', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(150, 97, '1759448945751.pdf', 'à¸à¸à¸à¸µà¹ 4.pdf', 'application/pdf', 'chapter2', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(151, 97, '1759448945752.pdf', 'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf', 'application/pdf', 'chapter3', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(152, 97, '1759448945759.pdf', 'Exercise4052201_w13.pdf', 'application/pdf', 'chapter4', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(153, 97, '1759448945763.pdf', 'Exercise4052201_w14.pdf', 'application/pdf', 'chapter5', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(154, 97, '1759448945767.pdf', 'Cloud w12.pdf', 'application/pdf', 'reference', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(155, 97, '1759448945774.pdf', 'ch1_Practice1.pdf', 'application/pdf', 'appendix', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(156, 97, '1759448945778.pdf', 'ETE183-Computer Programming 1_68-week2.pdf', 'application/pdf', 'author_bio', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(157, 97, '1759448946000.mp4', '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4', 'video/mp4', 'presentation_video', '2025-10-02 23:49:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `downloads`
--

CREATE TABLE `downloads` (
  `dowload_id` mediumint(8) UNSIGNED NOT NULL,
  `user_id` smallint(5) UNSIGNED NOT NULL,
  `document_id` mediumint(8) UNSIGNED NOT NULL,
  `downloaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `downloads`
--
DELIMITER $$
CREATE TRIGGER `after_download_insert` AFTER INSERT ON `downloads` FOR EACH ROW UPDATE documents
SET download_count = download_count + 1
WHERE id = NEW.document_id
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `student_codes`
--

CREATE TABLE `student_codes` (
  `student_code_id` smallint(5) UNSIGNED NOT NULL,
  `student_id` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_codes`
--

INSERT INTO `student_codes` (`student_code_id`, `student_id`) VALUES
(1, '367409221001'),
(4, '367409221002');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` smallint(5) UNSIGNED NOT NULL,
  `username` varchar(100) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','teacher','admin') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `birthdate` date DEFAULT NULL,
  `class_group` varchar(50) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `student_id`, `password`, `role`, `created_at`, `birthdate`, `class_group`, `level`) VALUES
(1, 'guy', NULL, '$2b$10$ygfDa/inN1NcIQOfr2hSdOMEKbuKR5ItAaWRVq11OAPE/M7maEM3a', 'student', '2025-07-29 15:40:54', NULL, NULL, NULL),
(2, 'admin', NULL, '$2b$10$NiqKZWi9clXxTcyQtSGfgOtFMsLKmlUtfwDp/QORkh0r05oxySCKu', 'admin', '2025-08-17 19:21:39', NULL, NULL, NULL),
(3, '367409221015', NULL, '367409221015', 'student', '2025-08-21 09:33:19', NULL, NULL, NULL),
(4, 'taecher', NULL, 'taecher', 'teacher', '2025-08-21 09:33:47', NULL, NULL, NULL),
(6, '367409221010', NULL, '142536', 'student', '2025-09-17 14:32:03', NULL, NULL, NULL),
(9, 'Natchanon', '367409221001', '$2b$10$7gdA/SkQtNw3tiGEqMoud.LroP22FaHvfhsDppOx7dwzkKs5CnxfG', 'student', '2025-09-17 15:18:31', NULL, NULL, NULL),
(11, 'tanapat', '367409221002', '$2b$10$v/M9fEoBpd.GidxLBNSyYuIKqPSmk6gGW9N.yAmjUd8yFQmQV6R0e', 'student', '2025-09-17 15:30:04', NULL, NULL, NULL),
(12, 'sittikorn', NULL, '$2b$10$fyfClJIhTcECHCmGjKlr0.Ma/Y44Hr5F9nNBV6oJl4mapgqe1QWce', 'teacher', '2025-09-18 17:51:43', NULL, NULL, NULL),
(13, 'wanrada', NULL, '$2b$10$htOB9pzcCFM1sW2/MXWPHuF89IxoWB8CXeKTLFeqxdJem.PR4yTOW', 'teacher', '2025-09-19 05:40:29', NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`categorie_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`document_id`),
  ADD KEY `documents_ibfk_1` (`user_id`);

--
-- Indexes for table `document_categories`
--
ALTER TABLE `document_categories`
  ADD PRIMARY KEY (`document_id`) USING BTREE,
  ADD KEY `category_id` (`categorie_id`);

--
-- Indexes for table `document_files`
--
ALTER TABLE `document_files`
  ADD PRIMARY KEY (`document_file_id`),
  ADD KEY `document_files` (`document_id`);

--
-- Indexes for table `downloads`
--
ALTER TABLE `downloads`
  ADD PRIMARY KEY (`dowload_id`),
  ADD KEY `document_id` (`document_id`),
  ADD KEY `downloads` (`user_id`);

--
-- Indexes for table `student_codes`
--
ALTER TABLE `student_codes`
  ADD PRIMARY KEY (`student_code_id`),
  ADD UNIQUE KEY `student_id` (`student_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `fk_users_student_code` (`student_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `categorie_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `document_id` mediumint(8) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- AUTO_INCREMENT for table `document_files`
--
ALTER TABLE `document_files`
  MODIFY `document_file_id` mediumint(8) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=158;

--
-- AUTO_INCREMENT for table `downloads`
--
ALTER TABLE `downloads`
  MODIFY `dowload_id` mediumint(8) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_codes`
--
ALTER TABLE `student_codes`
  MODIFY `student_code_id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `document_categories`
--
ALTER TABLE `document_categories`
  ADD CONSTRAINT `document_categories` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `document_categories_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE CASCADE;

--
-- Constraints for table `document_files`
--
ALTER TABLE `document_files`
  ADD CONSTRAINT `document_files` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE CASCADE;

--
-- Constraints for table `downloads`
--
ALTER TABLE `downloads`
  ADD CONSTRAINT `downloads` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_student_code` FOREIGN KEY (`student_id`) REFERENCES `student_codes` (`student_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
