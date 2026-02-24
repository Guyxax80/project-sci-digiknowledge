// src/pages/MyDocuments.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Card, CardContent, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from "@mui/material";
import api from "../services/api";

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

const approvalStatusTH = {
  approved: "อนุมัติ",
  rejected: "ปฏิเสธ/ตีกลับ",
  pending: "รอตรวจ",
  draft: "ฉบับร่าง",
};

export default function MyDocuments() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [myDocs, setMyDocs] = useState([]);

  // timeline
  const [timelineByDoc, setTimelineByDoc] = useState({});

  // missing dialog
  const [missingDialog, setMissingDialog] = useState({
    open: false,
    documentId: null,
    title: "",
    missing: [],
    message: "",
  });

  const toast = useCallback((message, severity = "info") => {
    if (!message) return;
    try {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { severity, message } }));
    } catch (_) {
      alert(message);
    }
  }, []);

  const effectiveRole = useMemo(
    () => String((user && user.role) || localStorage.getItem("role") || "").trim().toLowerCase(),
    [user]
  );
  const isStudent = effectiveRole === "student";

  const fetchProfileMe = useCallback(async () => {
    const res = await api.get("/profile/me");
    return res.data;
  }, []);

  const loadMyDocs = useCallback(async (userId) => {
    const r = await api.get(`/documents/by-user/${userId}`);
    setMyDocs(Array.isArray(r.data) ? r.data : []);
  }, []);

  const ensureEmail = useCallback(() => {
    const email = String(user?.email || "").trim();
    if (email) return true;
    toast("ต้องเพิ่มอีเมลในโปรไฟล์ก่อน ถึงจะส่งให้อาจารย์ตรวจได้", "warning");
    navigate("/profile");
    return false;
  }, [navigate, toast, user?.email]);

  const pickErrMessage = useCallback((err, fallback = "เกิดข้อผิดพลาด") => {
    const data = err?.response?.data;
    return data?.message || data?.error || data?.detail || (typeof data === "string" ? data : "") || err?.message || fallback;
  }, []);

  const pickMissingSections = useCallback((err) => {
    const data = err?.response?.data;
    const missing = data?.missing_sections || data?.missingSections || data?.missing || null;
    return Array.isArray(missing) ? missing : [];
  }, []);

  // load user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    (async () => {
      try {
        const authRes = await api.get("/auth/me");
        const data = authRes.data;

        if (!data?.success || !data?.user) {
          setUser(null);
          return;
        }

        let profileMe = null;
        try {
          profileMe = await fetchProfileMe();
        } catch (_) {
          profileMe = null;
        }

        const mergedUser = {
          ...data.user,
          ...(profileMe || {}),
          email: String(profileMe?.email ?? data.user.email ?? "").trim(),
        };

        setUser(mergedUser);

        if (String(mergedUser.role).toLowerCase() === "student") {
          await loadMyDocs(mergedUser.user_id);
        }
      } catch (err) {
        console.error(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchProfileMe, loadMyDocs]);

  // timeline lazy load
  const toggleTimeline = useCallback(
    async (documentId) => {
      const current = timelineByDoc[documentId] || { open: false, loading: false, error: null, items: null };
      const nextOpen = !current.open;

      setTimelineByDoc((prev) => ({
        ...prev,
        [documentId]: { ...(prev[documentId] || current), open: nextOpen },
      }));

      if (!nextOpen || current.items) return;

      setTimelineByDoc((prev) => ({
        ...prev,
        [documentId]: { ...(prev[documentId] || current), open: true, loading: true, error: null, items: null },
      }));

      try {
        const res = await api.get(`/approvals/${documentId}/timeline`);
        const items = res.data?.timeline || [];
        setTimelineByDoc((prev) => ({
          ...prev,
          [documentId]: { ...(prev[documentId] || current), open: true, loading: false, error: null, items },
        }));
      } catch (err) {
        setTimelineByDoc((prev) => ({
          ...prev,
          [documentId]: { ...(prev[documentId] || current), open: true, loading: false, error: "โหลด Timeline ไม่สำเร็จ", items: [] },
        }));
        toast("โหลด Timeline ไม่สำเร็จ", "error");
      }
    },
    [timelineByDoc, toast]
  );

  const TimelineBlock = ({ documentId, docStatus }) => {
    const state = timelineByDoc[documentId] || { open: false, loading: false, error: null, items: null };
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

          <button type="button" onClick={() => toggleTimeline(documentId)} className="text-sm text-blue-600 hover:underline">
            {state.open ? "ซ่อน Timeline" : "ดู Timeline"}
          </button>
        </div>

        {state.open && (
          <div className="mt-3">
            {state.loading && <p className="text-sm text-gray-500">กำลังโหลด...</p>}
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}

            {!state.loading && !state.error && (
              <>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500">ยังไม่มีประวัติการอนุมัติ</p>
                ) : (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="font-semibold mb-4 text-lg">Timeline การอนุมัติ</h3>

                    <div className="relative border-l-2 border-gray-200 ml-2">
                      {items.map((item) => {
                        const status = (item.status || "").toLowerCase();
                        const statusStyles = {
                          approved: "bg-green-100 text-green-700 border-green-400",
                          rejected: "bg-red-100 text-red-700 border-red-400",
                          pending: "bg-yellow-100 text-yellow-700 border-yellow-400",
                          draft: "bg-gray-100 text-gray-600 border-gray-400",
                        };
                        const style = statusStyles[status] || "bg-gray-100 text-gray-600 border-gray-400";

                        return (
                          <div key={item.approval_id} className="mb-6 ml-6 relative">
                            <span className={`absolute -left-3 top-1 w-5 h-5 rounded-full border-2 ${style}`}></span>

                            <div className="bg-white shadow-sm rounded-lg p-4 border">
                              <div className="flex justify-between items-center mb-1">
                                <span className={`px-2 py-1 text-xs rounded-full border ${style}`}>
                                  {approvalStatusTH[status] || item.status}
                                </span>

                                <span className="text-xs text-gray-500">
                                  {item.approved_at ? new Date(item.approved_at).toLocaleString() : "-"}
                                </span>
                              </div>

                              <div className="text-sm">โดย {item.approver_name || "-"}</div>

                              {item.reason && <div className="text-sm text-red-500 mt-1">เหตุผล: {item.reason}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleSubmitDoc = useCallback(
    async (doc) => {
      if (!ensureEmail()) return;

      try {
        await api.post(`/documents/${doc.document_id}/submit`);
        toast("ส่งให้อาจารย์ตรวจเรียบร้อย", "success");
        await loadMyDocs(user.user_id);
      } catch (err) {
        const msg = pickErrMessage(err, "ส่งให้อาจารย์ตรวจไม่สำเร็จ");
        const missing = pickMissingSections(err);

        if (missing.length) {
          setMissingDialog({
            open: true,
            documentId: doc.document_id,
            title: doc.title || "",
            missing,
            message: msg,
          });
        } else {
          toast(msg, "warning");
        }
      }
    },
    [ensureEmail, loadMyDocs, pickErrMessage, pickMissingSections, toast, user?.user_id]
  );

  if (loading) return <p className="p-4">กำลังโหลด...</p>;
  if (!user) return <div className="p-4 text-center"><p>ยังไม่ได้เข้าสู่ระบบ</p></div>;
  if (!isStudent) return <div className="p-4"><Typography color="text.secondary">หน้านี้สำหรับนักศึกษาเท่านั้น</Typography></div>;

  return (
    <div className="max-w-5xl mx-auto mt-20 p-6 space-y-6">
      <Typography variant="h5" className="mb-2">ผลงานที่ฉันอัปโหลด</Typography>
      {myDocs.length === 0 && <Typography color="text.secondary">ยังไม่มีผลงานที่อัปโหลด</Typography>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myDocs.map((doc) => {
          const normalized = String(doc.status || "draft").toLowerCase();
          const canSubmit = normalized === "draft" || normalized === "rejected";

          return (
            <Card key={doc.document_id}>
              <CardContent>
                <Typography variant="subtitle1" className="font-semibold">{doc.title}</Typography>
                <Typography variant="body2" color="text.secondary">หมวดหมู่: {doc.category_names || "-"}</Typography>
                <Typography variant="body2" color="text.secondary">คำค้นหา: {doc.keywords || "-"}</Typography>
                <Typography variant="body2" color="text.secondary">ปีการศึกษา: {doc.academic_year || "-"}</Typography>

                <div className="mt-2">
                  <TimelineBlock documentId={doc.document_id} docStatus={doc.status} />
                </div>

                <div className="mt-3 flex gap-2 flex-wrap">
                  <Button size="small" variant="outlined" onClick={() => navigate(`/document-detail/${doc.document_id}`)}>
                    ดูรายละเอียด
                  </Button>

                  {canSubmit && (
                    <Button size="small" variant="contained" onClick={() => handleSubmitDoc(doc)}>
                      ส่งให้อาจารย์ตรวจ
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Missing Sections Dialog */}
      <Dialog
        open={missingDialog.open}
        onClose={() => setMissingDialog((p) => ({ ...p, open: false }))}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>ส่งให้อาจารย์ตรวจไม่ได้</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {missingDialog.message || "กรุณาแนบไฟล์ให้ครบก่อนส่งให้ที่ปรึกษา"}
          </Typography>

          {missingDialog.title ? (
            <Typography variant="body2" sx={{ mb: 2 }}>
              เอกสาร: <strong>{missingDialog.title}</strong> (ID: {missingDialog.documentId})
            </Typography>
          ) : null}

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            ส่วนที่ยังขาด ({missingDialog.missing.length})
          </Typography>

          <Stack direction="row" flexWrap="wrap" gap={1}>
            {missingDialog.missing.map((s) => (
              <Chip key={s} label={s} size="small" variant="outlined" />
            ))}
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
            แนะนำ: ไปหน้า “ดูรายละเอียด/อัปโหลด” แล้วอัปโหลดให้ครบทุกส่วน จากนั้นค่อยกดส่งอีกครั้ง
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMissingDialog((p) => ({ ...p, open: false }))}>ปิด</Button>
          <Button
            variant="contained"
            onClick={() => {
              const id = missingDialog.documentId;
              setMissingDialog((p) => ({ ...p, open: false }));
              if (id) navigate(`/document-detail/${id}`);
            }}
          >
            ไปหน้าอัปโหลด/ดูรายละเอียด
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}