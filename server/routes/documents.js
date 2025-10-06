const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /documents - ดึงเอกสารทั้งหมด
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      d.document_id,
      d.title,
      d.keywords,
      d.academic_year,
      d.uploaded_at,
      d.status,
      d.user_id,
      COALESCE(d.download_count, 0) AS download_count
    FROM documents d
    WHERE COALESCE(LOWER(d.status), '') <> 'draft'
    ORDER BY d.uploaded_at DESC
  `;
  db.query(sql, (err, results) => {
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
  
  // ดึงเอกสารยอดนิยมตามจำนวนดาวน์โหลด (fallback: เรียงล่าสุดเมื่อ download_count เท่ากัน)
  const sql = `
    SELECT 
      d.document_id,
      d.title,
      d.keywords,
      d.academic_year,
      d.uploaded_at,
      d.status,
      d.user_id,
      COALESCE(d.download_count, 0) AS download_count,
      COALESCE(cat.category_names, '') AS category_names
    FROM documents d
    LEFT JOIN (
      SELECT dc.document_id, GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS category_names
      FROM document_categories dc
      JOIN categories c ON c.categorie_id = dc.categorie_id
      GROUP BY dc.document_id
    ) cat ON cat.document_id = d.document_id
    WHERE COALESCE(LOWER(d.status), '') <> 'draft'
    ORDER BY download_count DESC, d.uploaded_at DESC
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

// GET /documents/by-user/:userId - เอกสารทั้งหมดที่ผู้ใช้อัปโหลด
router.get('/by-user/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT 
      d.document_id,
      d.title,
      d.keywords,
      d.academic_year,
      d.uploaded_at,
      d.status,
      COALESCE(d.download_count, 0) AS download_count,
      COALESCE(cat.category_names, '') AS category_names
    FROM documents d
    LEFT JOIN (
      SELECT dc.document_id, GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS category_names
      FROM document_categories dc
      JOIN categories c ON c.categorie_id = dc.categorie_id
      GROUP BY dc.document_id
    ) cat ON cat.document_id = d.document_id
    WHERE d.user_id = ?
    ORDER BY d.uploaded_at DESC
  `;
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching documents by user:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
    res.json(rows || []);
  });
});

// POST /documents/:id/publish - เผยแพร่เอกสาร (เปลี่ยนสถานะ draft -> published)
router.post('/:id/publish', (req, res) => {
  const documentId = req.params.id;
  const requesterUserId = req.body?.user_id; // ควรยืนยันตัวตนจริงจังด้วย token ในภายหลัง

  // ตรวจสิทธิ์แบบง่าย: ต้องเป็นเจ้าของเอกสาร
  db.query('SELECT user_id, status FROM documents WHERE document_id = ? LIMIT 1', [documentId], (selErr, rows) => {
    if (selErr) {
      console.error('Error selecting document for publish:', selErr);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
    if (!rows || !rows.length) return res.status(404).json({ message: 'ไม่พบเอกสาร' });
    const doc = rows[0];
    if (requesterUserId && Number(requesterUserId) !== Number(doc.user_id)) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เผยแพร่เอกสารนี้' });
    }
    if (doc.status === 'published') {
      return res.json({ success: true, message: 'เอกสารถูกเผยแพร่แล้ว' });
    }
    db.query('UPDATE documents SET status = ? WHERE document_id = ?', ['published', documentId], (updErr) => {
      if (updErr) {
        console.error('Error publishing document:', updErr);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
      }
      return res.json({ success: true, message: 'เผยแพร่สำเร็จ' });
    });
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

      // Helper: ดึงหมวดหมู่ของเอกสาร (สคีมาตามที่แจ้ง: categories.categorie_id)
      const fetchCategories = (cb) => {
        const sql = `
          SELECT c.categorie_id AS categorie_id, c.name
          FROM document_categories dc
          JOIN categories c ON c.categorie_id = dc.categorie_id
          WHERE dc.document_id = ?
          ORDER BY c.name ASC
        `;
        db.query(sql, [documentId], (errCats, rows) => {
          if (errCats) {
            console.error('Error fetching categories:', errCats);
            return cb([]);
          }
          return cb(rows || []);
        });
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

// GET /documents/:id/categories - ดึงเฉพาะหมวดหมู่ของเอกสาร
router.get('/:id/categories', (req, res) => {
  const documentId = req.params.id;

  const queries = [
    // document_categories.categorie_id
    `SELECT c.categorie_id AS categorie_id, c.name
       FROM document_categories dc
       JOIN categories c ON c.categorie_id = dc.categorie_id
      WHERE dc.document_id = ?
      ORDER BY c.name ASC`,
    `SELECT c.category_id AS categorie_id, c.name
       FROM document_categories dc
       JOIN categories c ON c.category_id = dc.categorie_id
      WHERE dc.document_id = ?
      ORDER BY c.name ASC`,
    `SELECT c.categorie_id AS categorie_id, c.name
       FROM document_categories dc
       JOIN categorie c ON c.categorie_id = dc.categorie_id
      WHERE dc.document_id = ?
      ORDER BY c.name ASC`,
    `SELECT c.category_id AS categorie_id, c.name
       FROM document_categories dc
       JOIN categorie c ON c.category_id = dc.categorie_id
      WHERE dc.document_id = ?
      ORDER BY c.name ASC`,
    // document_categories.category_id
    `SELECT c.categorie_id AS categorie_id, c.name
       FROM document_categories dc
       JOIN categories c ON c.categorie_id = dc.category_id
      WHERE dc.document_id = ?
      ORDER BY c.name ASC`,
    `SELECT c.category_id AS categorie_id, c.name
       FROM document_categories dc
       JOIN categories c ON c.category_id = dc.category_id
      WHERE dc.document_id = ?
      ORDER BY c.name ASC`,
    `SELECT c.categorie_id AS categorie_id, c.name
       FROM document_categories dc
       JOIN categorie c ON c.categorie_id = dc.category_id
      WHERE dc.document_id = ?
      ORDER BY c.name ASC`,
    `SELECT c.category_id AS categorie_id, c.name
       FROM document_categories dc
       JOIN categorie c ON c.category_id = dc.category_id
      WHERE dc.document_id = ?
      ORDER BY c.name ASC`
  ];

  const tryQuery = (i = 0) => {
    if (i >= queries.length) return res.json([]);
    db.query(queries[i], [documentId], (err, rows) => {
      if (err) return tryQuery(i + 1);
      return res.json(rows || []);
    });
  };

  tryQuery(0);
});

module.exports = router;
