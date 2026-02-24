// src/pages/TeacherApprovalHistory.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
} from "@mui/material";
import api from "../services/api";

function formatThaiDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ✅ ทำชื่อให้สวย + fallback ให้ดูดี
function prettifyName(name, studentId) {
  const cleaned = String(name || "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned) return cleaned;

  if (studentId) return `นักศึกษา รหัส ${studentId}`;
  return "นักศึกษาไม่ทราบชื่อ";
}

// ✅ document_status_enum: draft, pending, approved, rejected
const statusColor = {
  draft: "default",
  pending: "warning",
  approved: "success",
  rejected: "error",
};

const statusTH = {
  draft: "ฉบับร่าง",
  pending: "รอตรวจ",
  approved: "อนุมัติแล้ว",
  rejected: "ตีกลับแก้ไข",
};

// สำหรับ approval_history ที่มักเป็น Approved/Rejected (ตัวใหญ่)
const approvalStatusTH = {
  approved: "อนุมัติ",
  rejected: "ปฏิเสธ/ตีกลับ",
  pending: "รอตรวจ",
  draft: "ฉบับร่าง",
};

export default function TeacherApprovalHistory() {
  const navigate = useNavigate();

  // ===== Tabs =====
  const [tab, setTab] = useState(0); // 0 = pending, 1 = history

  // ===== toast =====
  const toast = useCallback((message, severity = "info") => {
    if (!message) return;
    try {
      window.dispatchEvent(
        new CustomEvent("app-toast", {
          detail: { severity, message },
        })
      );
    } catch (_) {
      alert(message);
    }
  }, []);

  const pickErrMessage = useCallback((err, fallback = "เกิดข้อผิดพลาด") => {
    const data = err?.response?.data;
    return (
      data?.message ||
      data?.error ||
      data?.detail ||
      (typeof data === "string" ? data : "") ||
      err?.message ||
      fallback
    );
  }, []);

  // =========================
  // TAB 0: PENDING
  // =========================
  const [pendingDocs, setPendingDocs] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState("");

  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // ✅ timeline ต่อเอกสาร (Teacher)
  const [timelineByDoc, setTimelineByDoc] = useState({});

  // ✅ ใช้เช็คว่า teacher มี email ไหม (ต้องมีเพื่อ approve/reject)
  const [myEmail, setMyEmail] = useState("");

  const loadMyEmail = useCallback(async () => {
    try {
      // ถ้าคุณมี /profile/me อยู่แล้ว ใช้อันนี้ได้เลย
      const res = await api.get("/profile/me");
      const email = String(res.data?.user?.email || "").trim();
      setMyEmail(email);
      return email;
    } catch (e) {
      // fallback ไป auth/me
      try {
        const r = await api.get("/auth/me");
        const email = String(r.data?.user?.email || "").trim();
        setMyEmail(email);
        return email;
      } catch (_) {
        setMyEmail("");
        return "";
      }
    }
  }, []);

  const ensureEmailOrGoProfile = useCallback(
    async (actionLabel) => {
      const email = String(myEmail || "").trim() || (await loadMyEmail());
      if (email) return true;

      toast(`ต้องเพิ่มอีเมลในโปรไฟล์ก่อน ถึงจะ${actionLabel}ได้`, "warning");
      navigate("/profile");
      return false;
    },
    [loadMyEmail, myEmail, navigate, toast]
  );

  const loadPendingDocs = useCallback(async () => {
    try {
      setPendingError("");
      setPendingLoading(true);
      const r = await api.get("/approvals/pending");
      setPendingDocs(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      const msg = e?.response?.data?.message || "โหลดรายการรอตรวจไม่สำเร็จ";
      setPendingDocs([]);
      setPendingError(msg);
      toast(msg, "error");
    } finally {
      setPendingLoading(false);
    }
  }, [toast]);

  // โหลด email + pending เมื่อเข้าหน้า
  useEffect(() => {
    loadMyEmail().catch(() => {});
    loadPendingDocs().catch(() => {});
  }, [loadMyEmail, loadPendingDocs]);

  // ===== Teacher: timeline (lazy) =====
  const toggleTimeline = async (documentId) => {
    const docKey = String(documentId);

    const current = timelineByDoc[docKey] || {
      open: false,
      loading: false,
      error: null,
      items: null,
    };

    const nextOpen = !current.open;

    setTimelineByDoc((prev) => ({
      ...prev,
      [docKey]: { ...(prev[docKey] || current), open: nextOpen },
    }));

    if (!nextOpen || current.items) return;

    setTimelineByDoc((prev) => ({
      ...prev,
      [docKey]: {
        ...(prev[docKey] || current),
        open: true,
        loading: true,
        error: null,
        items: null,
      },
    }));

    try {
      const res = await api.get(`/approvals/${docKey}/timeline`);
      const items = res.data?.timeline || [];
      setTimelineByDoc((prev) => ({
        ...prev,
        [docKey]: {
          ...(prev[docKey] || current),
          open: true,
          loading: false,
          error: null,
          items,
        },
      }));
    } catch (err) {
      console.error("load timeline error:", err?.response?.data || err.message);
      setTimelineByDoc((prev) => ({
        ...prev,
        [docKey]: {
          ...(prev[docKey] || current),
          open: true,
          loading: false,
          error: "โหลด Timeline ไม่สำเร็จ",
          items: [],
        },
      }));
      toast("โหลด Timeline ไม่สำเร็จ", "error");
    }
  };

  const TimelineBlock = ({ documentId, docStatus }) => {
    const docKey = String(documentId);

    const state =
      timelineByDoc[docKey] || { open: false, loading: false, error: null, items: null };
    const items = Array.isArray(state.items) ? state.items : [];
    const normalizedDocStatus = String(docStatus || "draft").toLowerCase();

    return (
      <div className="mt-2">
        <div className="flex items-center justify-between gap-2">
          <Chip
            size="small"
            label={`สถานะ: ${statusTH[normalizedDocStatus] || normalizedDocStatus}`}
            color={statusColor[normalizedDocStatus] || "default"}
          />
          <button
            type="button"
            onClick={() => toggleTimeline(docKey)}
            className="text-sm text-blue-600 hover:underline"
          >
            {state.open ? "ซ่อน Timeline" : "ดู Timeline"}
          </button>
        </div>

        {state.open && (
          <div className="mt-3">
            {state.loading && <p className="text-sm text-gray-500">กำลังโหลด...</p>}
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}

            {!state.loading && !state.error && (
              <React.Fragment>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500">ยังไม่มีประวัติการอนุมัติ</p>
                ) : (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="font-semibold mb-4 text-lg">Timeline การอนุมัติ</h3>

                    <div className="relative border-l-2 border-gray-200 ml-2">
                      {items.map((item, idx) => {
                        const status = (item.status || "").toLowerCase();
                        const statusStyles = {
                          approved: "bg-green-100 text-green-700 border-green-400",
                          rejected: "bg-red-100 text-red-700 border-red-400",
                          pending: "bg-yellow-100 text-yellow-700 border-yellow-400",
                          draft: "bg-gray-100 text-gray-600 border-gray-400",
                        };
                        const style =
                          statusStyles[status] || "bg-gray-100 text-gray-600 border-gray-400";

                        const rowKey =
                          item.approval_id != null
                            ? `tl-${item.approval_id}`
                            : `tl-${docKey}-${item.approved_at || "no-date"}-${idx}`;

                        return (
                          <div key={rowKey} className="mb-6 ml-6 relative">
                            <span
                              className={`absolute -left-3 top-1 w-5 h-5 rounded-full border-2 ${style}`}
                            ></span>

                            <div className="bg-white shadow-sm rounded-lg p-4 border">
                              <div className="flex justify-between items-center mb-1">
                                <span className={`px-2 py-1 text-xs rounded-full border ${style}`}>
                                  {approvalStatusTH[status] || item.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {item.approved_at
                                    ? new Date(item.approved_at).toLocaleString()
                                    : "-"}
                                </span>
                              </div>

                              <div className="text-sm">โดย {item.approver_name || "-"}</div>
                              {item.reason && (
                                <div className="text-sm text-red-500 mt-1">
                                  เหตุผล: {item.reason}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </React.Fragment>
            )}
          </div>
        )}
      </div>
    );
  };

  // ✅ Approve
  const handleApprove = useCallback(
    async (doc) => {
      const ok = await ensureEmailOrGoProfile("อนุมัติ");
      if (!ok) return;

      try {
        await api.post(`/approvals/${doc.document_id}/approve`);
        toast("อนุมัติเรียบร้อย", "success");
        await loadPendingDocs();
      } catch (err) {
        toast(pickErrMessage(err, "อนุมัติไม่สำเร็จ"), "error");
      }
    },
    [ensureEmailOrGoProfile, loadPendingDocs, pickErrMessage, toast]
  );

  // ✅ Confirm Reject
  const handleConfirmReject = useCallback(async () => {
    if (!rejectingDoc) return;

    const ok = await ensureEmailOrGoProfile("ตีกลับ");
    if (!ok) return;

    try {
      await api.post(`/approvals/${rejectingDoc.document_id}/reject`, { reason: rejectReason });
      toast("ตีกลับเรียบร้อย", "success");
      setRejectingDoc(null);
      setRejectReason("");
      await loadPendingDocs();
    } catch (err) {
      toast(pickErrMessage(err, "ตีกลับไม่สำเร็จ"), "error");
    }
  }, [ensureEmailOrGoProfile, loadPendingDocs, pickErrMessage, rejectReason, rejectingDoc, toast]);

  // =========================
  // TAB 1: HISTORY
  // =========================
  const [items, setItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/teacher/approval-history");
        setItems(res.data?.data || []);
      } catch (err) {
        console.error(err);
        toast("โหลดประวัติการอนุมัติไม่สำเร็จ", "error");
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [toast]);

  // 🔹 sort ล่าสุดก่อน
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.approved_at) - new Date(a.approved_at));
  }, [items]);

  // 🔹 group ตาม student
  // 🔹 group ตาม student
  const grouped = useMemo(() => {
    const map = new Map();

    for (const it of sorted) {
      // ✅ รองรับทั้ง student_* และ owner_* และ fallback
      const sid =
        it.student_user_id ??
        it.owner_id ??
        it.user_id ??
        it.student_id ??
        "unknown";

      if (!map.has(sid)) {
        map.set(sid, {
          student_id: it.student_id ?? it.owner_student_id ?? null,
          student_name: it.student_name ?? it.owner_name ?? null,
          class_group: it.class_group ?? it.owner_class_group ?? null,
          level: it.level ?? it.owner_level ?? null,
          documents: {},
        });
      }

      const cur = map.get(sid);

      if (!cur.student_name && (it.student_name || it.owner_name)) {
        cur.student_name = it.student_name || it.owner_name;
      }
      if (!cur.student_id && (it.student_id || it.owner_student_id)) {
        cur.student_id = it.student_id || it.owner_student_id;
      }
      if (!cur.class_group && (it.class_group || it.owner_class_group)) {
        cur.class_group = it.class_group || it.owner_class_group;
      }
      if (!cur.level && (it.level || it.owner_level)) {
        cur.level = it.level || it.owner_level;
      }

      const docId = it.document_id;
      if (!cur.documents[docId]) cur.documents[docId] = [];
      cur.documents[docId].push(it);
    }

    return Array.from(map.entries());
  }, [sorted]);

  const [openStudents, setOpenStudents] = useState(new Set());
  const [openDocs, setOpenDocs] = useState(new Set());

  const toggleStudent = (id) => {
    const key = String(id);
    setOpenStudents((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleDoc = (id) => {
    const key = String(id);
    setOpenDocs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <Typography variant="h4" className="!text-slate-900 !font-bold">
          งานอาจารย์ที่ปรึกษา
        </Typography>

        <div className="flex gap-2">
          <Button
            variant="outlined"
            onClick={() => {
              loadPendingDocs();
            }}
          >
            รีเฟรชรายการรออนุมัติ
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="รายการรออนุมัติ" />
            <Tab label="ประวัติการอนุมัติ" />
          </Tabs>
        </CardContent>
      </Card>

      <Box className="mt-6">
        {/* ================= TAB 0: Pending ================= */}
        {tab === 0 && (
          <React.Fragment>
            <Typography variant="h6" className="!text-slate-900 !font-bold mb-3">
              รายการรออนุมัติ (เฉพาะนักศึกษาที่คุณเป็นที่ปรึกษา)
            </Typography>

            {pendingLoading && <div className="text-slate-700">กำลังโหลด...</div>}
            {pendingError ? (
              <Typography color="error" sx={{ mb: 1 }}>
                {pendingError}
              </Typography>
            ) : null}

            {!pendingLoading && pendingDocs.length === 0 && !pendingError && (
              <Typography color="text.secondary">ไม่มีรายการรอตรวจ</Typography>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingDocs.map((doc) => (
                <Card
                  key={`pending-${doc.document_id ?? `${doc.title}-${doc.student_id}`}`}
                  className="rounded-xl border border-slate-200"
                >
                  <CardContent>
                    <Typography variant="subtitle1" className="!font-bold !text-slate-900">
                      {doc.title}
                    </Typography>
                    <Typography variant="body2" className="!text-slate-600">
                      ผู้ส่ง: {doc.student_name} ({doc.student_id || "-"})
                    </Typography>

                    <div className="mt-2">
                      <TimelineBlock documentId={doc.document_id} docStatus={doc.status} />
                    </div>

                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/document-detail/${doc.document_id}`)}
                      >
                        ดูรายละเอียด
                      </Button>

                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleApprove(doc)}
                      >
                        อนุมัติ
                      </Button>

                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={async () => {
                          const ok = await ensureEmailOrGoProfile("ตีกลับ");
                          if (!ok) return;
                          setRejectingDoc(doc);
                        }}
                      >
                        ตีกลับ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </React.Fragment>
        )}

        {/* ================= TAB 1: History ================= */}
        {tab === 1 && (
          <React.Fragment>
            <Typography variant="h6" className="!text-slate-900 !font-bold mb-3">
              ประวัติการอนุมัติ
            </Typography>

            {historyLoading && <div className="text-slate-700">กำลังโหลด...</div>}

            {!historyLoading &&
              grouped.map(([studentId, data], idx) => {
                const studentKey =
                  data?.student_id != null && String(data.student_id).trim() !== ""
                    ? `stu-${String(data.student_id).trim()}`
                    : `stu-unknown-${idx}`;

                const studentOpen = openStudents.has(String(studentId));
                const displayName = prettifyName(data.student_name, data.student_id);

                return (
                  <Card
                    key={studentKey}
                    className="mb-6 border border-slate-200 shadow-sm bg-white rounded-xl"
                  >
                    <CardContent>
                      {/* Student Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm">
                              {displayName?.[0] || "N"}
                            </div>
                            <div className="min-w-0">
                              <Typography variant="h6" className="!text-slate-900 !font-bold truncate">
                                {displayName}
                              </Typography>

                              <div className="text-xs text-slate-600 mt-0.5">
                                รหัสนักศึกษา: {data.student_id ?? "-"}
                              </div>
                            </div>
                          </div>

                          {/* chips */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {data.class_group && (
                              <Chip size="small" label={`กลุ่ม/ห้อง: ${data.class_group}`} />
                            )}
                            {data.level && <Chip size="small" label={`ระดับ: ${data.level}`} />}
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`เอกสารทั้งหมด: ${Object.keys(data.documents).length}`}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => toggleStudent(String(studentId))}
                          className="shrink-0 px-3 py-1 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          {studentOpen ? "ย่อ" : "ดูเอกสาร"}
                        </button>
                      </div>

                      {/* Documents */}
                      {studentOpen && (
                        <div className="mt-5 space-y-4">
                          {Object.entries(data.documents).map(([docId, events]) => {
                            const docKey = String(docId);
                            const docOpen = openDocs.has(docKey);
                            const latest = Array.isArray(events) ? events[0] : null;

                            return (
                              <div
                                key={`doc-${studentKey}-${docKey}`}
                                className="border border-slate-200 rounded-xl p-4 bg-slate-50"
                              >
                                <div className="flex justify-between items-center gap-3">
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 truncate">
                                      {latest.document_title || latest.title || "-"}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                      ล่าสุด: {formatThaiDateTime(latest?.approved_at)}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => toggleDoc(docKey)}
                                    className="shrink-0 px-3 py-1 text-sm rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800"
                                  >
                                    {docOpen ? "ซ่อนประวัติ" : "ดูประวัติ"}
                                  </button>
                                </div>

                                {docOpen && (
                                  <div className="mt-3 space-y-2">
                                    {(Array.isArray(events) ? events : []).map((it, eIdx) => {
                                      const rowKey =
                                        it?.approval_id != null
                                          ? `appr-${it.approval_id}`
                                          : `appr-${studentKey}-${docKey}-${it?.approved_at || "no-date"}-${eIdx}`;

                                      return (
                                        <div
                                          key={rowKey}
                                          className="p-3 bg-white border border-slate-200 rounded-lg"
                                        >
                                          <div className="text-sm text-slate-700">
                                            {formatThaiDateTime(it?.approved_at)} —{" "}
                                            <span className="font-medium">
                                              {approvalStatusTH[String(it?.status || "").toLowerCase()] ||
                                                it?.status ||
                                                "-"}
                                            </span>
                                          </div>
                                          {it?.reason && (
                                            <div className="text-sm text-red-600 mt-1">
                                              เหตุผล: {it.reason}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </React.Fragment>
        )}
      </Box>

      {/* ================= Reject Dialog ================= */}
      <Dialog open={!!rejectingDoc} onClose={() => setRejectingDoc(null)} fullWidth>
        <DialogTitle>ระบุเหตุผลการตีกลับ</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="เหตุผล"
            fullWidth
            multiline
            minRows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectingDoc(null);
              setRejectReason("");
            }}
          >
            ยกเลิก
          </Button>

          <Button
            color="error"
            variant="contained"
            disabled={!rejectReason.trim()}
            onClick={handleConfirmReject}
          >
            ยืนยันตีกลับ
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}