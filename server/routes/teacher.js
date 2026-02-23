// routes/teacher.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

// ✅ ครูเห็นประวัติของ "เอกสารทุกชิ้นที่เป็นที่ปรึกษา"
router.get("/approval-history", auth, requireRole("teacher"), async (req, res) => {
  try {
    const teacherId = req.user.user_id;

    const { rows } = await db.query(
      `
      SELECT
        ah.approval_id,
        ah.document_id,
        d.title AS document_title,

        -- ใครเป็นคนกดอนุมัติ/ปฏิเสธ
        ah.approver_id,
        u.username AS approver_name,

        -- สถานะ/เหตุผล/เวลา
        ah.status,
        ah.reason,
        ah.approved_at,

        -- ใครเป็นอาจารย์ที่ปรึกษาของเอกสารนี้
        d.advisor_id
      FROM public.approval_history ah
      JOIN public.documents d ON d.document_id = ah.document_id
      JOIN public.users u ON u.user_id = ah.approver_id
      WHERE d.advisor_id = $1
      ORDER BY ah.approved_at DESC, ah.approval_id DESC
      LIMIT 500
      `,
      [teacherId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("approval-history error:", err);
    res.status(500).json({ success: false, message: "DB error" });
  }
});

module.exports = router;