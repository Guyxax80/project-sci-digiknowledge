// routes/teacher.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

// ✅ ครูเห็นประวัติของ "เอกสารทุกชิ้นที่เป็นที่ปรึกษา"
// advisor_id อยู่ใน users (ของเจ้าของเอกสาร) ไม่ได้อยู่ใน documents
router.get("/approval-history", auth, requireRole("teacher"), async (req, res) => {
  try {
    const teacherId = req.user.user_id;

    const { rows } = await db.query(
      `
      SELECT
        ah.approval_id,
        ah.document_id,
        d.title AS document_title,

        -- คนกดอนุมัติ/ปฏิเสธ
        ah.approver_id,
        u_approver.username AS approver_name,

        -- สถานะ/เหตุผล/เวลา
        ah.status,
        ah.reason,
        ah.approved_at,

        -- เจ้าของเอกสาร (นักศึกษา) + ที่ปรึกษา
        u_owner.user_id AS owner_id,
        u_owner.username AS owner_name,
        u_owner.advisor_id AS advisor_id

      FROM public.approval_history ah
      JOIN public.documents d
        ON d.document_id = ah.document_id

      -- ✅ owner ของเอกสาร (นักศึกษา)
      LEFT JOIN public.users u_owner
        ON u_owner.user_id = d.user_id

      -- ✅ approver (คนที่กด)
      JOIN public.users u_approver
        ON u_approver.user_id = ah.approver_id

      WHERE u_owner.advisor_id = $1
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