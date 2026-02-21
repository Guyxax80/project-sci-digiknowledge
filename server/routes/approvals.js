const express = require('express');
const { z } = require('zod');
const db = require('../db');
const auth = require('../middleware/auth');
const { notifyByEmail } = require('../services/notificationService');

const router = express.Router();

const advisorRoles = new Set(['teacher', 'admin']);

const rejectSchema = z.object({ reason: z.string().trim().min(1, 'กรุณาระบุเหตุผล') });

function isAdvisor(req) {
  return advisorRoles.has(String(req.user?.role || '').toLowerCase());
}

router.get('/pending', auth, async (req, res) => {
  if (!isAdvisor(req)) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ใช้งาน' });

  try {
    const { rows } = await db.query(
      `SELECT d.document_id, d.title, d.status, d.uploaded_at, d.user_id,
              u.username AS student_name, u.student_id
       FROM public.documents d
       JOIN public.users u ON u.user_id = d.user_id
       WHERE d.status = 'pending'
       ORDER BY d.uploaded_at ASC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET /api/approvals/pending error', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

router.post('/:documentId/approve', auth, async (req, res) => {
  if (!isAdvisor(req)) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ใช้งาน' });

  const documentId = Number(req.params.documentId);
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const docQ = await client.query('SELECT document_id, title, user_id, status FROM public.documents WHERE document_id = $1 FOR UPDATE', [documentId]);
    if (!docQ.rows.length) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });
    const doc = docQ.rows[0];

    if (String(doc.status).toLowerCase() !== 'pending') {
      return res.status(400).json({ success: false, message: 'อนุมัติได้เฉพาะเอกสารรอตรวจ' });
    }

    await client.query(
      `INSERT INTO public.approval_history (document_id, approver_id, status, reason, approved_at)
       VALUES ($1, $2, 'approved', NULL, NOW())`,
      [documentId, req.user.user_id]
    );

    await client.query(`UPDATE public.documents SET status = 'published' WHERE document_id = $1`, [documentId]);

    await client.query('COMMIT');

    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/document-detail/${documentId}`;
    await notifyByEmail({
      userId: doc.user_id,
      documentId,
      subject: 'ผลงานของคุณได้รับการอนุมัติแล้ว',
      message: `ผลงาน "${doc.title}" ได้รับการอนุมัติแล้ว\nดูรายละเอียด: ${link}`,
    });

    return res.json({ success: true, message: 'อนุมัติสำเร็จ' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('approve error', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  } finally {
    client.release();
  }
});

router.post('/:documentId/reject', auth, async (req, res) => {
  if (!isAdvisor(req)) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ใช้งาน' });

  const parsed = rejectSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
  }

  const documentId = Number(req.params.documentId);
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const docQ = await client.query('SELECT document_id, title, user_id, status FROM public.documents WHERE document_id = $1 FOR UPDATE', [documentId]);
    if (!docQ.rows.length) return res.status(404).json({ success: false, message: 'ไม่พบเอกสาร' });
    const doc = docQ.rows[0];

    if (String(doc.status).toLowerCase() !== 'pending') {
      return res.status(400).json({ success: false, message: 'ปฏิเสธได้เฉพาะเอกสารรอตรวจ' });
    }

    await client.query(
      `INSERT INTO public.approval_history (document_id, approver_id, status, reason, approved_at)
       VALUES ($1, $2, 'rejected', $3, NOW())`,
      [documentId, req.user.user_id, parsed.data.reason]
    );

    await client.query(`UPDATE public.documents SET status = 'rejected' WHERE document_id = $1`, [documentId]);

    await client.query('COMMIT');

    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/document-detail/${documentId}`;
    await notifyByEmail({
      userId: doc.user_id,
      documentId,
      subject: 'ผลงานถูกส่งกลับให้แก้ไข',
      message: `ผลงาน "${doc.title}" ถูกส่งกลับให้แก้ไข\nเหตุผล: ${parsed.data.reason}\nดูรายละเอียด: ${link}`,
    });

    return res.json({ success: true, message: 'ส่งกลับแก้ไขแล้ว' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('reject error', err);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  } finally {
    client.release();
  }
});

module.exports = router;