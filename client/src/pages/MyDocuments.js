// src/pages/MyDocuments.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
} from "@mui/material";
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
    return (
      data?.message ||
      data?.error ||
      data?.detail ||
      (typeof data === "string" ? data : "") ||
      err?.message ||
      fallback
    );
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
      const current = timelineByDoc[documentId] || {
        open: false,
        loading: false,
        error: null,
        items: null,
      };
      const nextOpen = !current.open;

      setTimelineByDoc((prev) => ({
        ...prev,
        [documentId]: { ...(prev[documentId] || current), open: nextOpen },
      }));

      if (!nextOpen || current.items) return;

      setTimelineByDoc((prev) => ({
        ...prev,
        [documentId]: {
          ...(prev[documentId] || current),
          open: true,
          loading: true,
          error: null,
          items: null,
        },
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
          [documentId]: {
            ...(prev[documentId] || current),
            open: true,
            loading: false,
            error: "โหลด Timeline ไม่สำเร็จ",
            items: [],
          },
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
            variant="outlined"
          />

          <button
            type="button"
            onClick={() => toggleTimeline(documentId)}
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
              <>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500">ยังไม่มีประวัติการอนุมัติ</p>
                ) : (
                  <div className="mt-4 rounded-xl border bg-white p-4">
                    <h3 className="font-semibold mb-3 text-base">Timeline การอนุมัติ</h3>

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
                          <div key={item.approval_id} className="mb-5 ml-6 relative">
                            <span className={`absolute -left-3 top-1 w-5 h-5 rounded-full border-2 ${style}`} />

                            <div className="bg-white shadow-sm rounded-xl p-4 border">
                              <div className="flex justify-between items-center mb-1 gap-3">
                                <span className={`px-2 py-1 text-xs rounded-full border ${style}`}>
                                  {approvalStatusTH[status] || item.status}
                                </span>

                                <span className="text-xs text-gray-500">
                                  {item.approved_at ? new Date(item.approved_at).toLocaleString() : "-"}
                                </span>
                              </div>

                              <div className="text-sm text-gray-800">โดย {item.approver_name || "-"}</div>

                              {item.reason && (
                                <div className="text-sm text-red-600 mt-1">เหตุผล: {item.reason}</div>
                              )}
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

  // ===== UI-only summaries =====
  const summary = useMemo(() => {
    const counts = { draft: 0, pending: 0, approved: 0, rejected: 0 };
    (myDocs || []).forEach((d) => {
      const s = String(d.status || "draft").toLowerCase();
      if (counts[s] !== undefined) counts[s] += 1;
    });
    return {
      total: myDocs.length,
      ...counts,
    };
  }, [myDocs]);

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white border border-black/5 shadow-md rounded-2xl p-6 text-center w-full max-w-md">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-black/[0.04] flex items-center justify-center">
            ⏳
          </div>
          <div className="text-gray-700 font-semibold">กำลังโหลด...</div>
          <div className="text-sm text-gray-500 mt-1">โปรดรอสักครู่</div>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white border border-black/5 shadow-md rounded-2xl p-6 text-center w-full max-w-md">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-black/[0.04] flex items-center justify-center">
            🔒
          </div>
          <p className="text-gray-800 font-semibold">ยังไม่ได้เข้าสู่ระบบ</p>
        </div>
      </div>
    );

  if (!isStudent)
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Typography color="text.secondary">หน้านี้สำหรับนักศึกษาเท่านั้น</Typography>
      </div>
    );

  return (
    <div className="min-h-screen bg-black/[0.02] py-6">
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
        {/* ===== Hero header ===== */}
        <div className="rounded-3xl border border-black/5 shadow-lg overflow-hidden bg-white">
          <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-brand-50/60">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <Typography variant="h5" className="mb-1" sx={{ fontWeight: 800 }}>
                  ผลงานที่ฉันอัปโหลด
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ตรวจสอบสถานะ • ดู Timeline • ส่งให้อาจารย์ตรวจได้จากหน้านี้
                </Typography>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outlined" onClick={() => navigate("/upload")}>
                  อัปโหลดผลงานใหม่
                </Button>
                <Button variant="outlined" onClick={() => navigate("/profile")}>
                  ไปโปรไฟล์
                </Button>
              </div>
            </div>

            {/* summary chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip label={`ทั้งหมด: ${summary.total}`} variant="outlined" />
              <Chip label={`ฉบับร่าง: ${summary.draft}`} color="default" variant="outlined" />
              <Chip label={`รอตรวจ: ${summary.pending}`} color="warning" variant="outlined" />
              <Chip label={`อนุมัติ: ${summary.approved}`} color="success" variant="outlined" />
              <Chip label={`ตีกลับ: ${summary.rejected}`} color="error" variant="outlined" />
            </div>
          </div>
        </div>

        {myDocs.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-8 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-black/[0.04] flex items-center justify-center">
              📄
            </div>
            <Typography color="text.secondary">ยังไม่มีผลงานที่อัปโหลด</Typography>
            <div className="mt-3">
              <Button variant="contained" onClick={() => navigate("/upload")}>
                เริ่มอัปโหลด
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myDocs.map((doc) => {
              const normalized = String(doc.status || "draft").toLowerCase();
              const canSubmit = normalized === "draft" || normalized === "rejected";

              return (
                <Card
                  key={doc.document_id}
                  className="shadow-md hover:shadow-xl transition"
                  sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <CardContent>
                    <div className="flex items-start justify-between gap-2">
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }} className="line-clamp-2">
                        {doc.title}
                      </Typography>

                      <Chip
                        size="small"
                        label={statusTH[normalized] || normalized}
                        color={statusColor[normalized] || "default"}
                        variant="outlined"
                      />
                    </div>

                    <Divider sx={{ my: 1.5 }} />

                    <Typography variant="body2" color="text.secondary">
                      หมวดหมู่: {doc.category_names || "-"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      คำค้นหา: {doc.keywords || "-"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ปีการศึกษา: {doc.academic_year || "-"}
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
        )}

        {/* Missing Sections Dialog */}
        <Dialog
          open={missingDialog.open}
          onClose={() => setMissingDialog((p) => ({ ...p, open: false }))}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ fontWeight: 800 }}>ส่งให้อาจารย์ตรวจไม่ได้</DialogTitle>
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

        <div className="h-6" />
      </div>
    </div>
  );
}