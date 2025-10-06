/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: categories
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `categories` (
  `categorie_id` mediumint(10) unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`categorie_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: document_categories
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `document_categories` (
  `document_id` mediumint(8) unsigned NOT NULL,
  `categorie_id` mediumint(10) unsigned NOT NULL,
  PRIMARY KEY (`document_id`, `categorie_id`),
  KEY `category_id` (`categorie_id`),
  CONSTRAINT `document_categories` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE CASCADE,
  CONSTRAINT `document_categories_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doc_cat_category` FOREIGN KEY (`categorie_id`) REFERENCES `categories` (`categorie_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: document_files
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `document_files` (
  `document_file_id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `document_id` mediumint(8) unsigned NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `file_type` varchar(20) DEFAULT NULL,
  `section` varchar(100) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `download_count` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`document_file_id`),
  KEY `document_files` (`document_id`),
  CONSTRAINT `document_files` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 231 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: documents
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `documents` (
  `document_id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` smallint(5) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `keywords` text DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `status` enum('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `download_count` int(11) DEFAULT 0,
  `file_paths` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'เก็บ path, original_name, file_type, section ของไฟล์แต่ละบท' CHECK (json_valid(`file_paths`)),
  PRIMARY KEY (`document_id`),
  KEY `documents_ibfk_1` (`user_id`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 104 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: downloads
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `downloads` (
  `dowload_id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` smallint(5) unsigned NOT NULL,
  `document_id` mediumint(8) unsigned NOT NULL,
  `document_file_id` int(11) DEFAULT NULL,
  `downloaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`dowload_id`),
  KEY `document_id` (`document_id`),
  KEY `downloads` (`user_id`),
  KEY `idx_downloads_user_id` (`user_id`),
  KEY `idx_downloads_document_id` (`document_id`),
  KEY `idx_downloads_document_file_id` (`document_file_id`),
  CONSTRAINT `downloads` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_downloads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 27 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: file_downloads
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `file_downloads` (
  `document_file_id` int(11) NOT NULL,
  `download_count` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`document_file_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: student_codes
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `student_codes` (
  `student_code_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` varchar(20) NOT NULL,
  PRIMARY KEY (`student_code_id`),
  UNIQUE KEY `student_id` (`student_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: users
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student', 'teacher', 'admin') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `birthdate` date DEFAULT NULL,
  `class_group` varchar(50) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  KEY `fk_users_student_code` (`student_id`),
  CONSTRAINT `fk_users_student_code` FOREIGN KEY (`student_id`) REFERENCES `student_codes` (`student_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 16 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: categories
# ------------------------------------------------------------

INSERT INTO
  `categories` (`categorie_id`, `name`)
VALUES
  (1, 'Hardware (ฮาร์ดแวร์)');
INSERT INTO
  `categories` (`categorie_id`, `name`)
VALUES
  (2, 'Software (ซอฟต์แวร์)');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: document_categories
# ------------------------------------------------------------

INSERT INTO
  `document_categories` (`document_id`, `categorie_id`)
VALUES
  (98, 1);
INSERT INTO
  `document_categories` (`document_id`, `categorie_id`)
VALUES
  (99, 2);
INSERT INTO
  `document_categories` (`document_id`, `categorie_id`)
VALUES
  (100, 1);
INSERT INTO
  `document_categories` (`document_id`, `categorie_id`)
VALUES
  (100, 2);
INSERT INTO
  `document_categories` (`document_id`, `categorie_id`)
VALUES
  (101, 1);
INSERT INTO
  `document_categories` (`document_id`, `categorie_id`)
VALUES
  (101, 2);
INSERT INTO
  `document_categories` (`document_id`, `categorie_id`)
VALUES
  (102, 1);
INSERT INTO
  `document_categories` (`document_id`, `categorie_id`)
VALUES
  (102, 2);
INSERT INTO
  `document_categories` (`document_id`, `categorie_id`)
VALUES
  (103, 1);
INSERT INTO
  `document_categories` (`document_id`, `categorie_id`)
VALUES
  (103, 2);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: document_files
# ------------------------------------------------------------

INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    1,
    30,
    'uploads\\1758234268668-StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'application/pdf',
    'main',
    '2025-09-19 05:24:28',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    2,
    31,
    'uploads\\1758234361199-StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'application/pdf',
    'main',
    '2025-09-19 05:26:01',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    3,
    32,
    'uploads\\1758234443571-StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'application/pdf',
    'main',
    '2025-09-19 05:27:23',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    4,
    33,
    'uploads\\1758234532078-StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'application/pdf',
    'main',
    '2025-09-19 05:28:52',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    5,
    34,
    'uploads\\1758234618213-StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'application/pdf',
    'main',
    '2025-09-19 05:30:18',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    6,
    36,
    'uploads\\1758234642805-StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'application/pdf',
    'main',
    '2025-09-19 05:30:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    7,
    37,
    'uploads\\1758234672691-StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'StatisticsChapter4_Probability and Counting Rules (2).pdf',
    'application/pdf',
    'main',
    '2025-09-19 05:31:12',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    8,
    40,
    '1758834849289-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 04:14:09',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    9,
    41,
    '1758835189695-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'เว็บไซต์',
    '2025-09-26 04:19:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    10,
    42,
    '1758835397665-à¸à¸à¸à¸µà¹4(1).pdf',
    'à¸à¸à¸à¸µà¹4(1).pdf',
    'application/pdf',
    'เว็บไซต์',
    '2025-09-26 04:23:17',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    11,
    43,
    '1758835420644-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'อื่นๆ',
    '2025-09-26 04:23:40',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    12,
    44,
    '1758835494747-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'อื่นๆ',
    '2025-09-26 04:24:54',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    13,
    45,
    '1758835533289-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'อื่นๆ',
    '2025-09-26 04:25:33',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    14,
    46,
    '1758835787903-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'อื่นๆ',
    '2025-09-26 04:29:48',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    15,
    47,
    '1758835852199-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'อื่นๆ',
    '2025-09-26 04:30:52',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    16,
    48,
    '1758835901672-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'อื่นๆ',
    '2025-09-26 04:31:41',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    17,
    49,
    '1758836018733-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'อื่นๆ',
    '2025-09-26 04:33:38',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    18,
    50,
    '1758836019822-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'อื่นๆ',
    '2025-09-26 04:33:39',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    19,
    51,
    '1758836068734-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'อื่นๆ',
    '2025-09-26 04:34:28',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    20,
    52,
    '1758836145159-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'อื่นๆ',
    '2025-09-26 04:35:45',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    21,
    53,
    '1758836446842-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'อื่นๆ',
    '2025-09-26 04:40:46',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    22,
    54,
    '1758836479722-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'อื่นๆ',
    '2025-09-26 04:41:19',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    23,
    55,
    '1758836983730-Cloud w11.pdf',
    'Cloud w11.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 04:49:43',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    24,
    56,
    '1758837135273-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 04:52:15',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    25,
    57,
    '1758837314058-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 04:55:14',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    26,
    58,
    '1758837405525-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 04:56:45',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    27,
    59,
    '1758837623436-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'dsfsf',
    '2025-09-26 05:00:23',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    28,
    60,
    '1758837713725-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:01:53',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    29,
    61,
    '1758837778149-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:02:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    30,
    62,
    '1758837802947-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:03:22',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    31,
    63,
    '1758837832094-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:03:52',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    32,
    64,
    '1758837873467-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:04:33',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    33,
    65,
    '1758837896005-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:04:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    34,
    66,
    '1758837912420-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:05:12',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    35,
    67,
    '1758838014336-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:06:54',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    36,
    68,
    '1758838065073-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:07:45',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    37,
    69,
    '1758838091081-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:08:11',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    38,
    70,
    '1758838159322-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:09:19',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    39,
    71,
    '1758838195442-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:09:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    40,
    72,
    '1758838264901-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:11:04',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    41,
    73,
    '1758838472956-à¸à¸à¸à¸µà¹4.docx',
    'à¸à¸à¸à¸µà¹4.docx',
    'application/vnd.open',
    'เด้ด้ด',
    '2025-09-26 05:14:33',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    42,
    74,
    '1758838726958-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:18:47',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    43,
    75,
    '1758838922918-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:22:02',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    44,
    76,
    '1758838972804-à¸à¸à¸à¸µà¹4.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:22:52',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    45,
    77,
    '1758838996906.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'อื่นๆ',
    '2025-09-26 05:23:16',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    46,
    78,
    '1758839243324.pdf',
    'à¸à¸à¸à¸µà¹4.pdf',
    'application/pdf',
    'เสร',
    '2025-09-26 05:27:23',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    47,
    79,
    '1758839909489.pdf',
    'à¸à¸à¸à¸µà¹4(1).pdf',
    'application/pdf',
    'ดเ้้เด',
    '2025-09-26 05:38:29',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    48,
    80,
    '1759261612577.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'เว็บไซต์ , ห้องประชุม',
    '2025-10-01 02:46:52',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    49,
    81,
    '1759261681241.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'เว็บไซต์ , ห้องประชุม',
    '2025-10-01 02:48:01',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    50,
    82,
    '1759262619369.jpg',
    'messageImage_1758945335820.jpg',
    'image/jpeg',
    'เว็บไซต์ , ห้องประชุม',
    '2025-10-01 03:03:39',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    51,
    83,
    '1759263319251.jpg',
    'messageImage_1758945335820.jpg',
    'image/jpeg',
    'เว็บไซต์ , ห้องประชุม',
    '2025-10-01 03:15:19',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    52,
    84,
    '1759263500806.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'เว็บไซต์',
    '2025-10-01 03:18:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    53,
    85,
    '1759263761540.jpg',
    'messageImage_1758945335820.jpg',
    'image/jpeg',
    'เว็บไซต์ ',
    '2025-10-01 03:22:41',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    54,
    86,
    '1759264973649.pdf',
    'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf',
    'application/pdf',
    'เว็บไซต์',
    '2025-10-01 03:42:53',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    55,
    86,
    '1759264973754.jpg',
    'messageImage_1758945335820.jpg',
    'image/jpeg',
    'cover',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    56,
    86,
    '1759264973770.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'abstract',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    57,
    86,
    '1759264973785.pdf',
    'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf',
    'application/pdf',
    'acknowledgement',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    58,
    86,
    '1759264973802.pdf',
    'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf',
    'application/pdf',
    'toc',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    59,
    86,
    '1759264973813.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'chapter1',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    60,
    86,
    '1759264973832.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'chapter2',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    61,
    86,
    '1759264973842.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'chapter3',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    62,
    86,
    '1759264973853.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'chapter4',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    63,
    86,
    '1759264973869.pdf',
    'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf',
    'application/pdf',
    'chapter5',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    64,
    86,
    '1759264973884.pdf',
    'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf',
    'application/pdf',
    'reference',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    65,
    86,
    '1759264973899.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'appendix',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    66,
    86,
    '1759264973940.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'author_bio',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    67,
    86,
    '1759264973955.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-01 03:42:55',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    68,
    87,
    '1759266167924.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'เว็บไซต์',
    '2025-10-01 04:02:48',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    69,
    87,
    '1759266168024.jpg',
    'messageImage_1758945335820.jpg',
    'image/jpeg',
    'cover',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    70,
    87,
    '1759266168032.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'abstract',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    71,
    87,
    '1759266168045.pdf',
    'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf',
    'application/pdf',
    'acknowledgement',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    72,
    87,
    '1759266168057.pdf',
    'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf',
    'application/pdf',
    'toc',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    73,
    87,
    '1759266168066.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'chapter1',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    74,
    87,
    '1759266168081.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'chapter2',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    75,
    87,
    '1759266168091.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'chapter3',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    76,
    87,
    '1759266168101.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'chapter4',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    77,
    87,
    '1759266168114.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'chapter5',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    78,
    87,
    '1759266168127.pdf',
    'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf',
    'application/pdf',
    'reference',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    79,
    87,
    '1759266168138.pdf',
    'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf',
    'application/pdf',
    'appendix',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    80,
    87,
    '1759266168146.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'author_bio',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    81,
    87,
    '1759266168162.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-01 04:02:49',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    82,
    88,
    '1759266559408.jpg',
    'messageImage_1758945335820.jpg',
    'image/jpeg',
    'ห้องง',
    '2025-10-01 04:09:19',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    83,
    88,
    '1759266559478.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'cover',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    84,
    88,
    '1759266559495.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'abstract',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    85,
    88,
    '1759266559508.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'acknowledgement',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    86,
    88,
    '1759266559520.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'toc',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    87,
    88,
    '1759266559531.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'chapter1',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    88,
    88,
    '1759266559548.pdf',
    'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf',
    'application/pdf',
    'chapter2',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    89,
    88,
    '1759266559561.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'chapter3',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    90,
    88,
    '1759266559574.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'chapter4',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    91,
    88,
    '1759266559590.pdf',
    'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf',
    'application/pdf',
    'chapter5',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    92,
    88,
    '1759266559604.pdf',
    'à¸à¸à¸à¸µà¹ 12 ok.pdf',
    'application/pdf',
    'reference',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    93,
    88,
    '1759266559642.pdf',
    'Exercise4052201_w14.pdf',
    'application/pdf',
    'appendix',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    94,
    88,
    '1759266559644.pdf',
    'Exercise4052201_w13.pdf',
    'application/pdf',
    'author_bio',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    95,
    88,
    '1759266559651.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-01 04:09:20',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    96,
    89,
    '1759267063513.jpg',
    'messageImage_1758945335820.jpg',
    'image/jpeg',
    'กดหดห',
    '2025-10-01 04:17:43',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    97,
    89,
    '1759267063591.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'cover',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    98,
    89,
    '1759267063617.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'abstract',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    99,
    89,
    '1759267063634.pdf',
    'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf',
    'application/pdf',
    'acknowledgement',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    100,
    89,
    '1759267063643.pdf',
    'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf',
    'application/pdf',
    'toc',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    101,
    89,
    '1759267063655.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'chapter1',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    102,
    89,
    '1759267063665.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'chapter2',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    103,
    89,
    '1759267063678.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'chapter3',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    104,
    89,
    '1759267063688.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'chapter4',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    105,
    89,
    '1759267063700.pdf',
    'Cloud w12.pdf',
    'application/pdf',
    'chapter5',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    106,
    89,
    '1759267063707.pdf',
    'Cloud w12.pdf',
    'application/pdf',
    'reference',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    107,
    89,
    '1759267063717.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'appendix',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    108,
    89,
    '1759267063727.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'author_bio',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    109,
    89,
    '1759267063738.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-01 04:17:44',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    110,
    90,
    '1759267469009.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'หดหด',
    '2025-10-01 04:24:29',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    111,
    90,
    '1759267469098.jpg',
    'messageImage_1758945335820.jpg',
    'image/jpeg',
    'cover',
    '2025-10-01 04:24:30',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    112,
    90,
    '1759267469111.pdf',
    'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf',
    'application/pdf',
    'abstract',
    '2025-10-01 04:24:30',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    113,
    90,
    '1759267469122.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'acknowledgement',
    '2025-10-01 04:24:30',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    114,
    90,
    '1759267469135.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-01 04:24:30',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    115,
    91,
    '1759267559666.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'หดหดหก',
    '2025-10-01 04:25:59',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    116,
    91,
    '1759267559744.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'cover',
    '2025-10-01 04:26:00',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    117,
    91,
    '1759267559761.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'abstract',
    '2025-10-01 04:26:00',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    118,
    91,
    '1759267559772.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'acknowledgement',
    '2025-10-01 04:26:00',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    119,
    91,
    '1759267559785.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-01 04:26:00',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    120,
    92,
    '1759268104586.jpg',
    'messageImage_1758945335820.jpg',
    'image/jpeg',
    'จอง',
    '2025-10-01 04:35:04',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    121,
    93,
    '1759268994748.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'dfss',
    '2025-10-01 04:49:54',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    122,
    93,
    '1759268994875.jpg',
    'messageImage_1758945335820.jpg',
    'image/jpeg',
    'cover',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    123,
    93,
    '1759268994887.pdf',
    'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf',
    'application/pdf',
    'abstract',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    124,
    93,
    '1759268994907.pdf',
    'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf',
    'application/pdf',
    'acknowledgement',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    125,
    93,
    '1759268994934.pdf',
    'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf',
    'application/pdf',
    'toc',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    126,
    93,
    '1759268994960.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'chapter1',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    127,
    93,
    '1759268994990.pdf',
    'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf',
    'application/pdf',
    'chapter2',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    128,
    93,
    '1759268995007.pdf',
    'à¸à¸à¸à¸µà¹ 7 à¸ªà¸«à¸ªà¸±à¸¡à¸à¸±à¸à¸à¹à¹à¸¥à¸°à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸£à¸à¸­à¸à¸­à¸¢.pdf',
    'application/pdf',
    'chapter3',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    129,
    93,
    '1759268995035.pdf',
    'à¸à¸à¸à¸µà¹ 4 à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸²à¸à¸à¹à¸².pdf',
    'application/pdf',
    'chapter4',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    130,
    93,
    '1759268995051.pdf',
    'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf',
    'application/pdf',
    'chapter5',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    131,
    93,
    '1759268995071.pdf',
    'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf',
    'application/pdf',
    'reference',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    132,
    93,
    '1759268995092.pdf',
    'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf',
    'application/pdf',
    'appendix',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    133,
    93,
    '1759268995110.pdf',
    'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf',
    'application/pdf',
    'author_bio',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    134,
    93,
    '1759268995131.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-01 04:49:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    135,
    94,
    '1759443194146.pdf',
    'à¸à¸à¸à¸µà¹ 6 à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸§à¸²à¸¡à¹à¸à¸£à¸à¸£à¸§à¸.pdf',
    'application/pdf',
    'เว็บไซต์',
    '2025-10-03 05:13:14',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    136,
    94,
    '1759443194240.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'cover',
    '2025-10-03 05:13:15',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    137,
    94,
    '1759443194261.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-03 05:13:15',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    138,
    95,
    '1759444521622.pdf',
    'à¸à¸à¸à¸µà¹ 4.pdf',
    'application/pdf',
    'กเดก',
    '2025-10-03 05:35:21',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    139,
    95,
    '1759444521699.pdf',
    'à¸à¸à¸à¸µà¹ 4.pdf',
    'application/pdf',
    'cover',
    '2025-10-03 05:35:22',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    140,
    95,
    '1759444521704.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-03 05:35:22',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    141,
    96,
    '/uploads/1759444960031.pdf',
    'à¸à¸à¸à¸µà¹ 4.pdf',
    'application/pdf',
    'หกดห',
    '2025-10-03 05:42:40',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    142,
    96,
    '1759444960073.pdf',
    'à¸à¸à¸à¸µà¹ 4.pdf',
    'application/pdf',
    'cover',
    '2025-10-03 05:42:40',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    143,
    96,
    '1759444960074.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-03 05:42:40',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    144,
    97,
    '/uploads/1759448945456.pdf',
    'à¸à¸à¸à¸µà¹4(2).pdf',
    'application/pdf',
    'Hardware(ฮาร์ดแวร์)',
    '2025-10-03 06:49:05',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    145,
    97,
    '1759448945625.pdf',
    'à¸à¸à¸à¸µà¹ 13 ok.pdf',
    'application/pdf',
    'cover',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    146,
    97,
    '1759448945688.pdf',
    'à¸à¸à¸à¸µà¹ 4.pdf',
    'application/pdf',
    'abstract',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    147,
    97,
    '1759448945694.jpg',
    'messageImage_1758945335820.jpg',
    'image/jpeg',
    'acknowledgement',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    148,
    97,
    '1759448945701.pdf',
    'à¸à¸à¸à¸µà¹ 3 à¸à¸²à¸£à¹à¸à¸à¹à¸à¸à¹à¸à¸à¸à¸à¸à¸´.pdf',
    'application/pdf',
    'toc',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    149,
    97,
    '1759448945712.pdf',
    'à¸à¸à¸à¸µà¹4(2).pdf',
    'application/pdf',
    'chapter1',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    150,
    97,
    '1759448945751.pdf',
    'à¸à¸à¸à¸µà¹ 4.pdf',
    'application/pdf',
    'chapter2',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    151,
    97,
    '1759448945752.pdf',
    'à¸à¸à¸à¸µà¹ 5  à¸à¸²à¸£à¸à¸à¸ªà¸­à¸à¸ªà¸¡à¸¡à¸à¸´à¸à¸²à¸.pdf',
    'application/pdf',
    'chapter3',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    152,
    97,
    '1759448945759.pdf',
    'Exercise4052201_w13.pdf',
    'application/pdf',
    'chapter4',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    153,
    97,
    '1759448945763.pdf',
    'Exercise4052201_w14.pdf',
    'application/pdf',
    'chapter5',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    154,
    97,
    '1759448945767.pdf',
    'Cloud w12.pdf',
    'application/pdf',
    'reference',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    155,
    97,
    '1759448945774.pdf',
    'ch1_Practice1.pdf',
    'application/pdf',
    'appendix',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    156,
    97,
    '1759448945778.pdf',
    'ETE183-Computer Programming 1_68-week2.pdf',
    'application/pdf',
    'author_bio',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    157,
    97,
    '1759448946000.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-03 06:49:06',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    158,
    98,
    '/uploads/1759698056945.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'main',
    '2025-10-06 04:00:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    159,
    98,
    '1759698057060.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'cover',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    160,
    98,
    '1759698057066.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'abstract',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    161,
    98,
    '1759698057073.pdf',
    'ETE183-Computer Programming 1_68-week2 (1).pdf',
    'application/pdf',
    'acknowledgement',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    162,
    98,
    '1759698057296.pdf',
    'Cloud w12.pdf',
    'application/pdf',
    'toc',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    163,
    98,
    '1759698057302.pdf',
    'Cloud w11.pdf',
    'application/pdf',
    'chapter1',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    164,
    98,
    '1759698057311.sql',
    'users.sql',
    'application/octet-st',
    'chapter2',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    165,
    98,
    '1759698057311.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'chapter3',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    166,
    98,
    '1759698057312.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'chapter4',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    167,
    98,
    '1759698057314.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'chapter5',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    168,
    98,
    '1759698057316.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'reference',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    169,
    98,
    '1759698057318.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'appendix',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    170,
    98,
    '1759698057318.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'author_bio',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    171,
    98,
    '1759698057319.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-06 04:00:58',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    172,
    99,
    '/uploads/1759698493588.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'main',
    '2025-10-06 04:08:13',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    173,
    99,
    '1759698493654.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'cover',
    '2025-10-06 04:08:14',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    174,
    99,
    '1759698493655.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'abstract',
    '2025-10-06 04:08:14',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    175,
    99,
    '1759698493660.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'acknowledgement',
    '2025-10-06 04:08:14',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    176,
    99,
    '1759698493661.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'toc',
    '2025-10-06 04:08:14',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    177,
    99,
    '1759698493663.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'chapter1',
    '2025-10-06 04:08:14',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    178,
    99,
    '1759698493666.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'chapter2',
    '2025-10-06 04:08:14',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    179,
    99,
    '1759698493668.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'chapter3',
    '2025-10-06 04:08:14',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    180,
    99,
    '1759698493669.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'chapter4',
    '2025-10-06 04:08:14',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    181,
    99,
    '1759698493671.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'chapter5',
    '2025-10-06 04:08:14',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    182,
    99,
    '1759698493672.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'reference',
    '2025-10-06 04:08:15',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    183,
    99,
    '1759698493693.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'appendix',
    '2025-10-06 04:08:15',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    184,
    99,
    '1759698493695.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'author_bio',
    '2025-10-06 04:08:15',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    185,
    99,
    '1759698493700.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-06 04:08:15',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    186,
    100,
    '/uploads/1759699017157.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'main',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    187,
    100,
    '1759699017195.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'cover',
    '2025-10-06 04:16:57',
    1
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    188,
    100,
    '1759699017196.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'abstract',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    189,
    100,
    '1759699017199.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'acknowledgement',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    190,
    100,
    '1759699017202.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'toc',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    191,
    100,
    '1759699017203.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'chapter1',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    192,
    100,
    '1759699017206.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'chapter2',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    193,
    100,
    '1759699017209.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'chapter3',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    194,
    100,
    '1759699017213.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'chapter4',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    195,
    100,
    '1759699017218.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'chapter5',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    196,
    100,
    '1759699017224.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'reference',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    197,
    100,
    '1759699017227.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'appendix',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    198,
    100,
    '1759699017228.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'author_bio',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    199,
    100,
    '1759699017231.mp4',
    '1_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed (2).mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-06 04:16:57',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    200,
    101,
    '/uploads/1759703314068.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'main',
    '2025-10-06 05:28:34',
    2
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    201,
    101,
    '1759703314146.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'cover',
    '2025-10-06 05:28:35',
    1
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    202,
    101,
    '1759703314149.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-06 05:28:35',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    203,
    102,
    '/uploads/1759724081272.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'main',
    '2025-10-06 11:14:41',
    2
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    204,
    102,
    '1759724081343.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'cover',
    '2025-10-06 11:14:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    205,
    102,
    '1759724081351.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'abstract',
    '2025-10-06 11:14:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    206,
    102,
    '1759724081352.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'acknowledgement',
    '2025-10-06 11:14:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    207,
    102,
    '1759724081359.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'toc',
    '2025-10-06 11:14:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    208,
    102,
    '1759724081363.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'chapter1',
    '2025-10-06 11:14:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    209,
    102,
    '1759724081368.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'chapter2',
    '2025-10-06 11:14:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    210,
    102,
    '1759724081369.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'chapter3',
    '2025-10-06 11:14:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    211,
    102,
    '1759724081371.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'chapter4',
    '2025-10-06 11:14:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    212,
    102,
    '1759724081375.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'chapter5',
    '2025-10-06 11:14:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    213,
    102,
    '1759724081378.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'reference',
    '2025-10-06 11:14:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    214,
    102,
    '1759724081383.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'appendix',
    '2025-10-06 11:14:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    215,
    102,
    '1759725797121.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'author_bio',
    '2025-10-06 11:43:17',
    1
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    216,
    102,
    '1759724081389.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-06 11:14:42',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    217,
    103,
    '/uploads/1759724454615.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'main',
    '2025-10-06 11:20:54',
    1
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    218,
    103,
    '1759724454706.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'cover',
    '2025-10-06 11:20:56',
    1
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    219,
    103,
    '1759724454712.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'abstract',
    '2025-10-06 11:20:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    220,
    103,
    '1759724454719.pdf',
    'Exercise4052201_w13 (1).pdf',
    'application/pdf',
    'acknowledgement',
    '2025-10-06 11:20:56',
    1
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    221,
    103,
    '1759724454737.pdf',
    'ETE183-Computer Programming 1_68-week2 (1).pdf',
    'application/pdf',
    'toc',
    '2025-10-06 11:20:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    222,
    103,
    '1759724454983.sql',
    'sci_digiknowledge (13).sql',
    'application/octet-st',
    'chapter1',
    '2025-10-06 11:20:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    223,
    103,
    '1759724454983.pdf',
    'Exercise4052201_w14 (1).pdf',
    'application/pdf',
    'chapter2',
    '2025-10-06 11:20:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    224,
    103,
    '1759724454985.pdf',
    'ETE183-Computer Programming 1_68-week2 (1).pdf',
    'application/pdf',
    'chapter3',
    '2025-10-06 11:20:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    225,
    103,
    '1759724455049.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'chapter4',
    '2025-10-06 11:20:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    226,
    103,
    '1759724455051.pdf',
    'ETE183-Computer Programming 1_68-week2 (1).pdf',
    'application/pdf',
    'chapter5',
    '2025-10-06 11:20:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    227,
    103,
    '1759724455106.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'reference',
    '2025-10-06 11:20:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    228,
    103,
    '1759724455107.pdf',
    'ETE183-Computer Programming 1_68-week2 (1).pdf',
    'application/pdf',
    'appendix',
    '2025-10-06 11:20:56',
    0
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    229,
    103,
    '1759724455162.sql',
    'sci_digiknowledge (14).sql',
    'application/octet-st',
    'author_bio',
    '2025-10-06 11:20:56',
    1
  );
INSERT INTO
  `document_files` (
    `document_file_id`,
    `document_id`,
    `file_path`,
    `original_name`,
    `file_type`,
    `section`,
    `uploaded_at`,
    `download_count`
  )
VALUES
  (
    230,
    103,
    '1759724455164.mp4',
    '2_à¸§à¸£à¸£à¸à¸£à¸à¸²_Lab_6_completed.mp4',
    'video/mp4',
    'presentation_video',
    '2025-10-06 11:20:56',
    0
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: documents
# ------------------------------------------------------------

INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    2,
    1,
    'ใบคำร้อง',
    'ใบคำร้อง',
    '2568',
    'draft',
    '2025-07-29 22:42:45',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    3,
    1,
    'ระบบเว็บไซต์คลังผลงานโครงงาน SciDigiKnowledge',
    'เว็บไซต์',
    '2568',
    'draft',
    '2025-07-29 22:53:52',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    4,
    1,
    'vdo ปริญญานิพนต์',
    'vdo ปริญญานิพนต์',
    '2566',
    'draft',
    '2025-07-29 23:01:23',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    5,
    1,
    'สรุปคะแนน',
    'คะแนน',
    '2568',
    'draft',
    '2025-07-30 00:32:29',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    6,
    1,
    'บทที่2',
    'สไลด์สอน',
    '2568',
    'draft',
    '2025-07-30 00:38:09',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    7,
    1,
    'บทที่2',
    'สไลด์',
    '2568',
    'draft',
    '2025-07-30 00:40:44',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    8,
    1,
    't commit',
    'guy',
    '2568',
    'draft',
    '2025-08-18 02:14:47',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    11,
    1,
    'โครงงานวิจัยการใช้ถ่านชีวภาพ',
    'biochar, environment',
    '2567',
    'draft',
    '2025-08-28 01:12:48',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    12,
    1,
    'บทความเทคโนโลยีสารสนเทศ',
    'IT, digital',
    '2566',
    'draft',
    '2025-08-28 01:12:48',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    13,
    9,
    '1',
    '2',
    '',
    'draft',
    '2025-09-19 00:53:26',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    14,
    9,
    'ชื่อเอกสารตัวอย่าง',
    NULL,
    NULL,
    '',
    '2025-09-19 02:21:48',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    15,
    9,
    'ชื่อเอกสารตัวอย่าง',
    'keyword1, keyword2',
    '2568',
    '',
    '2025-09-19 02:22:04',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    16,
    9,
    'ชื่อเอกสารตัวอย่าง',
    'keyword1, keyword2',
    '2568',
    '',
    '2025-09-19 02:26:44',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    17,
    9,
    'ชื่อเอกสารตัวอย่าง',
    'keyword1, keyword2',
    '2568',
    '',
    '2025-09-19 02:30:00',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    18,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:08:58',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    19,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:09:15',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    20,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:10:36',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    21,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:11:10',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    22,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:12:13',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    23,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:12:15',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    24,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:12:19',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    25,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:12:34',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    26,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:13:59',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    27,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:14:02',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    28,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:18:08',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    29,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:18:21',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    30,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:24:28',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    31,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:26:01',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    32,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:27:23',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    33,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:28:52',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    34,
    9,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:30:18',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    36,
    11,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:30:42',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    37,
    11,
    'fgdg',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-19 05:31:12',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    38,
    9,
    '45',
    '',
    '',
    'approved',
    '2025-09-26 04:05:06',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    39,
    9,
    '45',
    '',
    '',
    'approved',
    '2025-09-26 04:07:47',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (40, 9, '45', '', '', '', '2025-09-26 04:14:09', 0, NULL);
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    41,
    9,
    'การจองห้อง',
    'การจอง',
    '2568',
    '',
    '2025-09-26 04:19:49',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    42,
    9,
    'การจองห้อง',
    'การจอง',
    '2568',
    'draft',
    '2025-09-26 04:23:17',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    43,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:23:40',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    44,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:24:54',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    45,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:25:33',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    46,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:29:48',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    47,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:30:52',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    48,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:31:41',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    49,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:33:38',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    50,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:33:39',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    51,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:34:28',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    52,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:35:45',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    53,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:40:46',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    54,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:41:19',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    55,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:49:43',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    56,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:52:15',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    57,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:55:14',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    58,
    9,
    'เ่้่้',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 04:56:45',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    59,
    9,
    'dki0v\'',
    'sfdsfs',
    'sfdfd',
    '',
    '2025-09-26 05:00:23',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    60,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:01:53',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    61,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:02:58',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    62,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:03:22',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    63,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:03:52',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    64,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:04:33',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    65,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:04:56',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    66,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:05:12',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    67,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:06:54',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    68,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:07:45',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    69,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:08:11',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    70,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:09:19',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    71,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:09:55',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    72,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:11:04',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    73,
    9,
    'ดเ้เ้',
    'เ้ด้ด',
    'ด้ดเ้ดเ้',
    '',
    '2025-09-26 05:14:33',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    74,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:18:47',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    75,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:22:02',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    76,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:22:52',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    77,
    9,
    'การจองห้องประชุม',
    'การจอง , เว็บไซต์',
    '2568',
    'draft',
    '2025-09-26 05:23:16',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    78,
    1,
    'เว็บไซต์',
    'ดกเกดเ',
    '2568',
    'draft',
    '2025-09-26 05:27:23',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    79,
    1,
    'ด้เ้เ',
    'ด้เด้ดเ',
    'ด้เด้เด',
    '',
    '2025-09-26 05:38:29',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    80,
    1,
    'จองห้องประชุม',
    'เว็บจองห้องประชุม',
    '2568',
    '',
    '2025-10-01 02:46:52',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    81,
    1,
    'จองห้องประชุม',
    'เว็บจองห้องประชุม',
    '2568',
    '',
    '2025-10-01 02:48:01',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    82,
    1,
    'จองห้องประชุม',
    'เว็บจองห้องประชุม',
    '2568',
    '',
    '2025-10-01 03:03:39',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    83,
    1,
    'จองห้อง',
    'การจองห้องประชุม',
    '2568',
    '',
    '2025-10-01 03:15:19',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    84,
    1,
    'ห้องประชุม',
    'การจอง',
    '2568',
    '',
    '2025-10-01 03:18:20',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    85,
    9,
    'พัฒนาเว็บ',
    'การจองห้องประชุม',
    '2568',
    '',
    '2025-10-01 03:22:41',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    86,
    9,
    'เว็บไซต์จองห้องประชุม',
    'ห้องประชุม',
    '2568',
    '',
    '2025-10-01 03:42:53',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    87,
    9,
    'เว็บคลังผลงาน',
    'เอกสารดิจิทัล',
    '2568',
    '',
    '2025-10-01 04:02:47',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    88,
    9,
    'ห้อง',
    'ห้องงง',
    '2568',
    '',
    '2025-10-01 04:09:19',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    89,
    9,
    'หกกด',
    'หดกหด',
    '2568',
    '',
    '2025-10-01 04:17:43',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    90,
    9,
    'กดหด',
    'หดกดด',
    '2568',
    '',
    '2025-10-01 04:24:29',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    91,
    9,
    'กดหกด',
    'หดหกด',
    'หดกห',
    '',
    '2025-10-01 04:25:59',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    92,
    9,
    'การจอง',
    'การจอง',
    '2568',
    '',
    '2025-10-01 04:35:04',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    93,
    9,
    'dki0v\'',
    'sfsf',
    '2568',
    '',
    '2025-10-01 04:49:54',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    94,
    9,
    'ห้องประชุม',
    'เว็บ',
    '2568',
    '',
    '2025-10-03 05:13:14',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    95,
    9,
    'ดเกเ',
    'กเดก',
    'กเดก',
    '',
    '2025-10-03 05:35:21',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    96,
    9,
    'กหดห',
    'หกดห',
    'หดหกด',
    '',
    '2025-10-03 05:42:40',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    97,
    9,
    'จองห้องประชุม',
    'เว็บไซต์',
    '2568',
    '',
    '2025-10-03 06:49:05',
    0,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    98,
    9,
    'การจองห้อง',
    'เว็บไซต์',
    '2568',
    '',
    '2025-10-06 04:00:56',
    3,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    99,
    9,
    'เว็บไซต์',
    'เว็บไซต์',
    '2568',
    '',
    '2025-10-06 04:08:13',
    6,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    100,
    9,
    'เว็บไซต์',
    'การจองห้อง',
    '2568',
    '',
    '2025-10-06 04:16:57',
    9,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    101,
    9,
    'ห้องประชุม',
    'จองห้อง',
    '2568',
    '',
    '2025-10-06 05:28:34',
    16,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    102,
    9,
    'ห้องพัก',
    'ระบบ',
    '2568',
    '',
    '2025-10-06 11:14:41',
    3,
    NULL
  );
INSERT INTO
  `documents` (
    `document_id`,
    `user_id`,
    `title`,
    `keywords`,
    `academic_year`,
    `status`,
    `uploaded_at`,
    `download_count`,
    `file_paths`
  )
VALUES
  (
    103,
    9,
    'จองห้องประชุม',
    'เว็บไซต์',
    '2568',
    '',
    '2025-10-06 11:20:54',
    4,
    NULL
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: downloads
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: file_downloads
# ------------------------------------------------------------

INSERT INTO
  `file_downloads` (`document_file_id`, `download_count`)
VALUES
  (158, 1);
INSERT INTO
  `file_downloads` (`document_file_id`, `download_count`)
VALUES
  (169, 1);
INSERT INTO
  `file_downloads` (`document_file_id`, `download_count`)
VALUES
  (170, 1);
INSERT INTO
  `file_downloads` (`document_file_id`, `download_count`)
VALUES
  (172, 2);
INSERT INTO
  `file_downloads` (`document_file_id`, `download_count`)
VALUES
  (173, 2);
INSERT INTO
  `file_downloads` (`document_file_id`, `download_count`)
VALUES
  (180, 1);
INSERT INTO
  `file_downloads` (`document_file_id`, `download_count`)
VALUES
  (181, 1);
INSERT INTO
  `file_downloads` (`document_file_id`, `download_count`)
VALUES
  (190, 1);
INSERT INTO
  `file_downloads` (`document_file_id`, `download_count`)
VALUES
  (191, 1);
INSERT INTO
  `file_downloads` (`document_file_id`, `download_count`)
VALUES
  (193, 1);
INSERT INTO
  `file_downloads` (`document_file_id`, `download_count`)
VALUES
  (200, 3);
INSERT INTO
  `file_downloads` (`document_file_id`, `download_count`)
VALUES
  (201, 3);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: student_codes
# ------------------------------------------------------------

INSERT INTO
  `student_codes` (`student_code_id`, `student_id`)
VALUES
  (1, '367409221001');
INSERT INTO
  `student_codes` (`student_code_id`, `student_id`)
VALUES
  (4, '367409221002');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: users
# ------------------------------------------------------------

INSERT INTO
  `users` (
    `user_id`,
    `username`,
    `student_id`,
    `password`,
    `role`,
    `created_at`,
    `birthdate`,
    `class_group`,
    `level`
  )
VALUES
  (
    1,
    'guy',
    NULL,
    '$2b$10$ygfDa/inN1NcIQOfr2hSdOMEKbuKR5ItAaWRVq11OAPE/M7maEM3a',
    'teacher',
    '2025-07-29 22:40:54',
    NULL,
    NULL,
    NULL
  );
INSERT INTO
  `users` (
    `user_id`,
    `username`,
    `student_id`,
    `password`,
    `role`,
    `created_at`,
    `birthdate`,
    `class_group`,
    `level`
  )
VALUES
  (
    2,
    'admin',
    NULL,
    '$2b$10$NiqKZWi9clXxTcyQtSGfgOtFMsLKmlUtfwDp/QORkh0r05oxySCKu',
    'admin',
    '2025-08-18 02:21:39',
    NULL,
    NULL,
    NULL
  );
INSERT INTO
  `users` (
    `user_id`,
    `username`,
    `student_id`,
    `password`,
    `role`,
    `created_at`,
    `birthdate`,
    `class_group`,
    `level`
  )
VALUES
  (
    3,
    '367409221015',
    NULL,
    '367409221015',
    'student',
    '2025-08-21 16:33:19',
    NULL,
    NULL,
    NULL
  );
INSERT INTO
  `users` (
    `user_id`,
    `username`,
    `student_id`,
    `password`,
    `role`,
    `created_at`,
    `birthdate`,
    `class_group`,
    `level`
  )
VALUES
  (
    4,
    'taecher',
    NULL,
    'taecher',
    'teacher',
    '2025-08-21 16:33:47',
    NULL,
    NULL,
    NULL
  );
INSERT INTO
  `users` (
    `user_id`,
    `username`,
    `student_id`,
    `password`,
    `role`,
    `created_at`,
    `birthdate`,
    `class_group`,
    `level`
  )
VALUES
  (
    6,
    '367409221010',
    NULL,
    '142536',
    'student',
    '2025-09-17 21:32:03',
    NULL,
    NULL,
    NULL
  );
INSERT INTO
  `users` (
    `user_id`,
    `username`,
    `student_id`,
    `password`,
    `role`,
    `created_at`,
    `birthdate`,
    `class_group`,
    `level`
  )
VALUES
  (
    9,
    'Natchanon',
    '367409221001',
    '$2b$10$7gdA/SkQtNw3tiGEqMoud.LroP22FaHvfhsDppOx7dwzkKs5CnxfG',
    'student',
    '2025-09-17 22:18:31',
    NULL,
    NULL,
    NULL
  );
INSERT INTO
  `users` (
    `user_id`,
    `username`,
    `student_id`,
    `password`,
    `role`,
    `created_at`,
    `birthdate`,
    `class_group`,
    `level`
  )
VALUES
  (
    11,
    'tanapat',
    '367409221002',
    '$2b$10$v/M9fEoBpd.GidxLBNSyYuIKqPSmk6gGW9N.yAmjUd8yFQmQV6R0e',
    'student',
    '2025-09-17 22:30:04',
    NULL,
    NULL,
    NULL
  );
INSERT INTO
  `users` (
    `user_id`,
    `username`,
    `student_id`,
    `password`,
    `role`,
    `created_at`,
    `birthdate`,
    `class_group`,
    `level`
  )
VALUES
  (
    12,
    'sittikorn',
    NULL,
    '$2b$10$fyfClJIhTcECHCmGjKlr0.Ma/Y44Hr5F9nNBV6oJl4mapgqe1QWce',
    'teacher',
    '2025-09-19 00:51:43',
    NULL,
    NULL,
    NULL
  );
INSERT INTO
  `users` (
    `user_id`,
    `username`,
    `student_id`,
    `password`,
    `role`,
    `created_at`,
    `birthdate`,
    `class_group`,
    `level`
  )
VALUES
  (
    13,
    'wanrada',
    NULL,
    '$2b$10$htOB9pzcCFM1sW2/MXWPHuF89IxoWB8CXeKTLFeqxdJem.PR4yTOW',
    'teacher',
    '2025-09-19 12:40:29',
    NULL,
    NULL,
    NULL
  );
INSERT INTO
  `users` (
    `user_id`,
    `username`,
    `student_id`,
    `password`,
    `role`,
    `created_at`,
    `birthdate`,
    `class_group`,
    `level`
  )
VALUES
  (
    15,
    'wanrada',
    NULL,
    '367409221015',
    'student',
    '2025-10-06 22:42:48',
    NULL,
    NULL,
    NULL
  );

# ------------------------------------------------------------
# TRIGGER DUMP FOR: after_download_insert
# ------------------------------------------------------------

DROP TRIGGER IF EXISTS after_download_insert;
DELIMITER ;;
CREATE TRIGGER `after_download_insert` AFTER INSERT ON `downloads` FOR EACH ROW UPDATE documents
SET download_count = download_count + 1
WHERE id = NEW.document_id;;
DELIMITER ;

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
