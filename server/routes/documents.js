const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /documents - ดึงเอกสารทั้งหมด
router.get('/', (req, res) => {
  db.query('SELECT * FROM documents', (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาด:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
    }
    res.json(results);
  });
});

// GET /documents/test - ทดสอบการเชื่อมต่อ
router.get('/test', (req, res) => {
  console.log("=== TEST API CALLED ===");
  res.json({ message: "API is working", timestamp: new Date().toISOString() });
});

// GET /documents/recommended - ดึงเอกสารแนะนำ (ล่าสุด 6 รายการ)
router.get('/recommended', (req, res) => {
  console.log("=== RECOMMENDED DOCUMENTS API ===");
  
  // ดึงข้อมูลจากตาราง documents เท่านั้น (ไม่ JOIN document_files)
  const sql = `
    SELECT 
      document_id,
      title,
      keywords,
      academic_year,
      uploaded_at,
      status,
      user_id
    FROM documents
    ORDER BY uploaded_at DESC
    LIMIT 6
  `;
  
  console.log("SQL Query:", sql);
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาด:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
    }
    
    console.log("Query results:", results);
    console.log("Number of results:", results.length);
    console.log("===============================");
    
    res.json(results);
  });
});

// GET /documents/:id - ดึงรายละเอียดเอกสารพร้อมไฟล์
router.get('/:id', (req, res) => {
  const documentId = req.params.id;
  console.log("=== DOCUMENT DETAIL API ===");
  console.log("Document ID:", documentId);

  // ดึงรายละเอียดเอกสาร
  db.query(
    `SELECT d.*
     FROM documents d
     WHERE d.document_id = ?`,
    [documentId],
    (err, docs) => {
      if (err) {
        console.error("Error fetching document:", err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
      }
      if (!docs.length) {
        console.log("Document not found");
        return res.status(404).json({ message: 'ไม่พบเอกสาร' });
      }

      console.log("Document found:", docs[0].title);

      // Helper: ดึงหมวดหมู่ของเอกสาร โดยรองรับได้หลายแบบของชื่อตาราง/คอลัมน์
      const fetchCategories = (cb) => {
        const categoryQueries = [
          // categories table
          `SELECT c.categorie_id AS categorie_id, c.name
             FROM document_categories dc
             JOIN categories c ON c.categorie_id = dc.categorie_id
            WHERE dc.document_id = ?
            ORDER BY c.name ASC`,
          `SELECT c.category_id AS categorie_id, c.name
             FROM document_categories dc
             JOIN categories c ON c.category_id = dc.category_id
            WHERE dc.document_id = ?
            ORDER BY c.name ASC`,
          `SELECT c.categorie_id AS categorie_id, c.name
             FROM document_categories dc
             JOIN categories c ON c.categorie_id = dc.category_id
            WHERE dc.document_id = ?
            ORDER BY c.name ASC`,
          `SELECT c.category_id AS categorie_id, c.name
             FROM document_categories dc
             JOIN categories c ON c.category_id = dc.categorie_id
            WHERE dc.document_id = ?
            ORDER BY c.name ASC`,
          // categorie table (fallback)
          `SELECT c.categorie_id AS categorie_id, c.name
             FROM document_categories dc
             JOIN categorie c ON c.categorie_id = dc.categorie_id
            WHERE dc.document_id = ?
            ORDER BY c.name ASC`,
          `SELECT c.category_id AS categorie_id, c.name
             FROM document_categories dc
             JOIN categorie c ON c.category_id = dc.category_id
            WHERE dc.document_id = ?
            ORDER BY c.name ASC`,
          `SELECT c.categorie_id AS categorie_id, c.name
             FROM document_categories dc
             JOIN categorie c ON c.categorie_id = dc.category_id
            WHERE dc.document_id = ?
            ORDER BY c.name ASC`,
          `SELECT c.category_id AS categorie_id, c.name
             FROM document_categories dc
             JOIN categorie c ON c.category_id = dc.categorie_id
            WHERE dc.document_id = ?
            ORDER BY c.name ASC`
        ];

        const tryQuery = (i = 0) => {
          if (i >= categoryQueries.length) return cb([]);
          db.query(categoryQueries[i], [documentId], (qErr, rows) => {
            if (qErr) {
              // ลอง query ต่อไป
              return tryQuery(i + 1);
            }
            return cb(rows || []);
          });
        };

        tryQuery(0);
      };

      // ดึงไฟล์ทั้งหมดของเอกสาร (รองรับทั้งหลายแถวและแถวเดียว)
      db.query(
        'SELECT * FROM document_files WHERE document_id = ? ORDER BY document_file_id ASC',
        [documentId],
        (err, files) => {
          if (err) {
            console.error("Error fetching files:", err);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
          }

          console.log("Files found:", files.length);

          // แยกไฟล์วิดีโอและไฟล์ดาวน์โหลด
          const downloadFiles = [];
          let videoFile = null;

          files.forEach(file => {
            console.log("Processing file:", file.file_path, file.file_type);
            
            // ตรวจสอบว่าเป็นโครงสร้างแถวเดียว (มีคอลัมน์ cover_path, abstract_path, etc.)
            if (file.cover_path || file.abstract_path || file.presentation_video_path) {
              console.log("Found single-row structure with multiple columns");
              console.log("cover_path:", file.cover_path);
              console.log("abstract_path:", file.abstract_path);
              console.log("presentation_video_path:", file.presentation_video_path);
              
              // ตรวจสอบไฟล์วิดีโอ
              if (file.presentation_video_path) {
                videoFile = {
                  document_file_id: file.document_file_id,
                  file_path: file.presentation_video_path.replace(/^uploads\//, ''),
                  section: 'presentation_video'
                };
                console.log("Video file found:", videoFile);
              }

              // สร้างรายการไฟล์จากคอลัมน์ต่างๆ
              const fileColumns = [
                { column: 'cover_path', section: 'cover' },
                { column: 'abstract_path', section: 'abstract' },
                { column: 'acknowledgement_path', section: 'acknowledgement' },
                { column: 'toc_path', section: 'toc' },
                { column: 'chapter1_path', section: 'chapter1' },
                { column: 'chapter2_path', section: 'chapter2' },
                { column: 'chapter3_path', section: 'chapter3' },
                { column: 'chapter4_path', section: 'chapter4' },
                { column: 'chapter5_path', section: 'chapter5' },
                { column: 'reference_path', section: 'reference' },
                { column: 'appendix_path', section: 'appendix' },
                { column: 'author_bio_path', section: 'author_bio' },
                { column: 'file_path', section: 'main' } // ไฟล์หลัก
              ];

              fileColumns.forEach(({ column, section }) => {
                if (file[column]) {
                  downloadFiles.push({
                    document_file_id: file.document_file_id,
                    file_path: file[column].replace(/^uploads\//, ''),
                    section: section,
                    original_name: file.original_name || `${section}.pdf`
                  });
                }
              });
            } else {
              // โครงสร้างหลายแถว (แต่ละไฟล์เป็นแถวแยก)
              if (file.file_type && file.file_type.startsWith('video/')) {
                videoFile = {
                  document_file_id: file.document_file_id,
                  file_path: file.file_path,
                  section: file.section || 'presentation_video'
                };
                console.log("Video file found:", videoFile);
              } else {
                downloadFiles.push({
                  document_file_id: file.document_file_id,
                  file_path: file.file_path,
                  section: file.section || 'main',
                  original_name: file.original_name || 'file'
                });
              }
            }
          });

          console.log("Final result - Video:", videoFile, "Download files:", downloadFiles.length);
          console.log("Fetching categories for document...");

          fetchCategories((categories) => {
            console.log("Categories found:", categories.length);
            console.log("===============================");
            res.json({ document: docs[0], categories, videoFile, downloadFiles });
          });
        }
      );
    }
  );
});

module.exports = router;
