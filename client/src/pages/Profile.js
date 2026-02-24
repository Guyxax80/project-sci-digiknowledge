// src/pages/Profile.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Chip,
} from '@mui/material';
import api from '../services/api';

// ✅ document_status_enum: draft, pending, approved, rejected
const statusColor = {
  draft: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

const statusTH = {
  draft: 'ฉบับร่าง',
  pending: 'รอตรวจ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ตีกลับแก้ไข',
};

// สำหรับ approval_history ที่มักเป็น Approved/Rejected (ตัวใหญ่)
const approvalStatusTH = {
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ/ตีกลับ',
  pending: 'รอตรวจ',
  draft: 'ฉบับร่าง',
};

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===== Teacher pending =====
  const [pendingDocs, setPendingDocs] = useState([]);
  const [pendingError, setPendingError] = useState('');

  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // ✅ timeline ต่อเอกสาร (เฉพาะ Teacher ใช้ดู timeline)
  const [timelineByDoc, setTimelineByDoc] = useState({});

  // ✅ โหมดแก้ไขโปรไฟล์
  const [editProfile, setEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    student_id: '',
    class_group: '',
    level: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  const effectiveRole = useMemo(
    () => String((user && user.role) || localStorage.getItem('role') || '').trim().toLowerCase(),
    [user]
  );

  const isTeacher = effectiveRole === 'teacher';
  const isStudent = effectiveRole === 'student';
  const isAdmin = effectiveRole === 'admin';

  // ===== Helpers =====
  const toast = useCallback((message, severity = 'info') => {
    if (!message) return;
    try {
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { severity, message },
        })
      );
    } catch (_) {
      alert(message);
    }
  }, []);

  const pickErrMessage = useCallback((err, fallback = 'เกิดข้อผิดพลาด') => {
    const data = err?.response?.data;
    return (
      data?.message ||
      data?.error ||
      data?.detail ||
      (typeof data === 'string' ? data : '') ||
      err?.message ||
      fallback
    );
  }, []);

  // ✅ ดึง profile จาก route ที่ “ชัวร์ว่ามี email”
  const fetchProfileMe = useCallback(async () => {
    const res = await api.get('/profile/me');
    return res.data;
  }, []);

  // ✅ โหลด user จาก /auth/me แล้ว merge email จาก /profile/me
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const authRes = await api.get('/auth/me');
        const data = authRes.data;

        if (!data?.success || !data?.user) {
          setUser(null);
          return;
        }

        let profileMe = null;
        try {
          profileMe = await fetchProfileMe();
        } catch (e) {
          console.error('profile/me error:', e?.response?.data || e.message);
          profileMe = null;
        }

        const mergedUser = {
          ...data.user,
          ...(profileMe || {}),
          email: String(profileMe?.email ?? data.user.email ?? '').trim(),
        };

        setUser(mergedUser);

        setProfileForm({
          username: mergedUser.username || '',
          student_id: mergedUser.student_id || '',
          class_group: mergedUser.class_group || '',
          level: mergedUser.level || '',
          email: mergedUser.email || '',
          password: '',
        });
      } catch (err) {
        console.error('Error fetching profile:', err?.response?.data || err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchProfileMe]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  // ✅ เช็ค email ก่อนทำ action สำคัญ (Teacher approve/reject)
  const ensureEmailOrOpenEdit = useCallback(
    (actionLabel) => {
      const email = String(user?.email || '').trim();
      if (email) return true;

      toast(`ต้องเพิ่มอีเมลในโปรไฟล์ก่อน ถึงจะ${actionLabel}ได้`, 'warning');
      setEditProfile(true);
      return false;
    },
    [user?.email, toast]
  );

  // ✅ บันทึกแก้ไขโปรไฟล์ (PATCH /profile/me)
  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);

      const payload = {
        username: profileForm.username,
        email: profileForm.email,
      };

      if (isStudent) {
        payload.student_id = profileForm.student_id;
        payload.class_group = profileForm.class_group;
        payload.level = profileForm.level;
      }

      if (String(profileForm.password || '').trim()) {
        payload.password = profileForm.password;
      }

      const res = await api.patch('/profile/me', payload);
      const updatedUser = res.data?.user;

      if (!res.data?.success || !updatedUser) {
        toast(res.data?.message || 'บันทึกไม่สำเร็จ', 'error');
        return;
      }

      setUser((prev) => ({
        ...(prev || {}),
        ...updatedUser,
        email: String(updatedUser.email || '').trim(),
      }));

      setProfileForm((prev) => ({
        ...prev,
        username: updatedUser.username || '',
        student_id: updatedUser.student_id || '',
        class_group: updatedUser.class_group || '',
        level: updatedUser.level || '',
        email: updatedUser.email || '',
        password: '',
      }));

      setEditProfile(false);
      toast('บันทึกโปรไฟล์สำเร็จ', 'success');
    } catch (err) {
      console.error('save profile error:', err?.response?.data || err.message);
      toast(err?.response?.data?.message || 'บันทึกไม่สำเร็จ', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // ===== Teacher: pending list =====
  const loadPendingDocs = useCallback(async () => {
    if (!isTeacher) {
      setPendingDocs([]);
      setPendingError('');
      return;
    }

    try {
      setPendingError('');
      const r = await api.get('/approvals/pending');
      setPendingDocs(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      const msg = e?.response?.data?.message || 'โหลดรายการรอตรวจไม่สำเร็จ';
      setPendingDocs([]);
      setPendingError(msg);
      toast(msg, 'error');
    }
  }, [isTeacher, toast]);

  useEffect(() => {
    loadPendingDocs().catch((e) => console.error(e));
  }, [loadPendingDocs]);

  // ===== Teacher: timeline (lazy) =====
  const toggleTimeline = async (documentId) => {
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
      console.error('load timeline error:', err?.response?.data || err.message);
      setTimelineByDoc((prev) => ({
        ...prev,
        [documentId]: {
          ...(prev[documentId] || current),
          open: true,
          loading: false,
          error: 'โหลด Timeline ไม่สำเร็จ',
          items: [],
        },
      }));
      toast('โหลด Timeline ไม่สำเร็จ', 'error');
    }
  };

  const TimelineBlock = ({ documentId, docStatus }) => {
    const state = timelineByDoc[documentId] || { open: false, loading: false, error: null, items: null };
    const items = Array.isArray(state.items) ? state.items : [];
    const normalizedDocStatus = String(docStatus || 'draft').toLowerCase();

    return (
      <div className="mt-2">
        <div className="flex items-center justify-between gap-2">
          <Chip
            size="small"
            label={`สถานะ: ${statusTH[normalizedDocStatus] || normalizedDocStatus}`}
            color={statusColor[normalizedDocStatus] || 'default'}
          />
          <button
            type="button"
            onClick={() => toggleTimeline(documentId)}
            className="text-sm text-blue-600 hover:underline"
          >
            {state.open ? 'ซ่อน Timeline' : 'ดู Timeline'}
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
                        const status = (item.status || '').toLowerCase();
                        const statusStyles = {
                          approved: 'bg-green-100 text-green-700 border-green-400',
                          rejected: 'bg-red-100 text-red-700 border-red-400',
                          pending: 'bg-yellow-100 text-yellow-700 border-yellow-400',
                          draft: 'bg-gray-100 text-gray-600 border-gray-400',
                        };
                        const style = statusStyles[status] || 'bg-gray-100 text-gray-600 border-gray-400';

                        return (
                          <div key={item.approval_id} className="mb-6 ml-6 relative">
                            <span className={`absolute -left-3 top-1 w-5 h-5 rounded-full border-2 ${style}`}></span>

                            <div className="bg-white shadow-sm rounded-lg p-4 border">
                              <div className="flex justify-between items-center mb-1">
                                <span className={`px-2 py-1 text-xs rounded-full border ${style}`}>
                                  {approvalStatusTH[status] || item.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {item.approved_at ? new Date(item.approved_at).toLocaleString() : '-'}
                                </span>
                              </div>

                              <div className="text-sm">โดย {item.approver_name || '-'}</div>
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

  // ✅ Approve
  const handleApprove = useCallback(
    async (doc) => {
      if (!ensureEmailOrOpenEdit('อนุมัติ')) return;

      try {
        await api.post(`/approvals/${doc.document_id}/approve`);
        toast('อนุมัติเรียบร้อย', 'success');
        await loadPendingDocs();
      } catch (err) {
        toast(pickErrMessage(err, 'อนุมัติไม่สำเร็จ'), 'error');
      }
    },
    [ensureEmailOrOpenEdit, loadPendingDocs, pickErrMessage, toast]
  );

  // ✅ Confirm Reject
  const handleConfirmReject = useCallback(async () => {
    if (!rejectingDoc) return;
    if (!ensureEmailOrOpenEdit('ตีกลับ')) return;

    try {
      await api.post(`/approvals/${rejectingDoc.document_id}/reject`, { reason: rejectReason });
      toast('ตีกลับเรียบร้อย', 'success');
      setRejectingDoc(null);
      setRejectReason('');
      await loadPendingDocs();
    } catch (err) {
      toast(pickErrMessage(err, 'ตีกลับไม่สำเร็จ'), 'error');
    }
  }, [ensureEmailOrOpenEdit, loadPendingDocs, pickErrMessage, rejectReason, rejectingDoc, toast]);

  if (loading) return <p className="p-4">กำลังโหลด...</p>;
  if (!user) return <div className="p-4 text-center"><p>ยังไม่ได้เข้าสู่ระบบ</p></div>;

  return (
    <div className="max-w-5xl mx-auto mt-20 p-6 space-y-6">
      <Card>
        <CardContent>
          <Typography variant="h5" className="mb-2">โปรไฟล์ผู้ใช้งาน</Typography>

          {!editProfile ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>Username: <strong>{user.username}</strong></div>
                <div>Role: <strong>{user.role}</strong></div>
                <div>Student ID: <strong>{user.student_id || '-'}</strong></div>
                <div>Class Group: <strong>{user.class_group || '-'}</strong></div>
                <div>Level: <strong>{user.level || '-'}</strong></div>
                <div>Email: <strong>{user.email || '-'}</strong></div>
              </div>

              <div className="mt-4 flex gap-2 flex-wrap">
                {!isAdmin && (
                  <Button variant="contained" onClick={() => setEditProfile(true)}>
                    แก้ไขโปรไฟล์
                  </Button>
                )}

                <Button variant="outlined" color="error" onClick={handleLogout}>
                  Logout
                </Button>
              </div>

              {isAdmin ? (
                <Typography sx={{ mt: 2 }} color="text.secondary">
                  คุณเป็นผู้ดูแลระบบ (Admin) — หน้านี้แสดงข้อมูลโปรไฟล์เท่านั้น
                </Typography>
              ) : null}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <TextField
                  label="Username"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />

                {isStudent && (
                  <>
                    <TextField
                      label="Student ID"
                      value={profileForm.student_id}
                      onChange={(e) => setProfileForm((p) => ({ ...p, student_id: e.target.value }))}
                      fullWidth
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Class Group"
                      value={profileForm.class_group}
                      onChange={(e) => setProfileForm((p) => ({ ...p, class_group: e.target.value }))}
                      fullWidth
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Level"
                      value={profileForm.level}
                      onChange={(e) => setProfileForm((p) => ({ ...p, level: e.target.value }))}
                      fullWidth
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                )}

                <TextField
                  label="Email (สำหรับรับแจ้งเตือน)"
                  type="email"
                  value={profileForm.email ?? ""}
                  onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="เปลี่ยนรหัสผ่าน (ไม่กรอก = ไม่เปลี่ยน)"
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm((p) => ({ ...p, password: e.target.value }))}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </div>

              <div className="mt-4 flex gap-2 flex-wrap">
                <Button variant="contained" disabled={savingProfile} onClick={handleSaveProfile}>
                  บันทึก
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => {
                    setProfileForm({
                      username: user.username || '',
                      student_id: user.student_id || '',
                      class_group: user.class_group || '',
                      level: user.level || '',
                      email: user.email || '',
                      password: '',
                    });
                    setEditProfile(false);
                  }}
                >
                  ยกเลิก
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ================= TEACHER (ยังอยู่ใน Profile) ================= */}
      {isTeacher && (
        <>
          <Typography variant="h6">รายการรออนุมัติ (เฉพาะนักศึกษาที่คุณเป็นที่ปรึกษา)</Typography>

          {pendingError ? <Typography color="error" sx={{ mb: 1 }}>{pendingError}</Typography> : null}
          {pendingDocs.length === 0 && !pendingError && (
            <Typography color="text.secondary">ไม่มีรายการรอตรวจ</Typography>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDocs.map((doc) => (
              <Card key={doc.document_id}>
                <CardContent>
                  <Typography variant="subtitle1" className="font-semibold">{doc.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ผู้ส่ง: {doc.student_name} ({doc.student_id || '-'})
                  </Typography>

                  <div className="mt-2">
                    <TimelineBlock documentId={doc.document_id} docStatus={doc.status} />
                  </div>

                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button size="small" variant="outlined" onClick={() => navigate(`/document-detail/${doc.document_id}`)}>
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
                      onClick={() => {
                        if (!ensureEmailOrOpenEdit('ตีกลับ')) return;
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
        </>
      )}

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
              setRejectReason('');
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

export default Profile;