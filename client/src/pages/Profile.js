import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import api from '../services/api';

const statusColor = {
  draft: 'default',
  pending: 'warning',
  published: 'success',
  rejected: 'error',
};

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [myDocs, setMyDocs] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [pendingError, setPendingError] = useState('');

  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const navigate = useNavigate();

  const effectiveRole = useMemo(
    () => String((user && user.role) || localStorage.getItem('role') || '').trim().toLowerCase(),
    [user]
  );

  // ✅ approvals backend ของคุณ: ให้เฉพาะ teacher เท่านั้น
  const isTeacher = effectiveRole === 'teacher';
  const isStudent = effectiveRole === 'student';
  const isAdmin = effectiveRole === 'admin';

  const loadMyDocs = useCallback(async (userId) => {
    const r = await api.get(`/api/documents/by-user/${userId}`);
    setMyDocs(Array.isArray(r.data) ? r.data : []);
  }, []);

  const loadPendingDocs = useCallback(async () => {
    // ✅ admin ไม่ต้องเรียก (จะ 403)
    if (!isTeacher) {
      setPendingDocs([]);
      setPendingError('');
      return;
    }

    try {
      setPendingError('');
      const r = await api.get('/api/approvals/pending');
      setPendingDocs(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      const msg = e?.response?.data?.message || 'โหลดรายการรอตรวจไม่สำเร็จ';
      setPendingDocs([]);
      setPendingError(msg);
    }
  }, [isTeacher]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    // ✅ api.js ใส่ Authorization ให้อยู่แล้ว ไม่ต้องส่ง headers ซ้ำ
    api
      .get('/api/auth/me')
      .then(async (res) => {
        const data = res.data;

        if (!data?.success || !data?.user) {
          setUser(null);
          return;
        }

        setUser(data.user);

        if (String(data.user.role).toLowerCase() === 'student') {
          await loadMyDocs(data.user.user_id);
        }
      })
      .catch((err) => {
        console.error('Error fetching profile:', err?.response?.data || err.message);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [loadMyDocs]);

  useEffect(() => {
    loadPendingDocs().catch((e) => console.error(e));
  }, [loadPendingDocs]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  if (loading) return <p className="p-4">กำลังโหลด...</p>;
  if (!user) return <div className="p-4 text-center"><p>ยังไม่ได้เข้าสู่ระบบ</p></div>;

  return (
    <div className="max-w-5xl mx-auto mt-20 p-6 space-y-6">
      <Card>
        <CardContent>
          <Typography variant="h5" className="mb-2">โปรไฟล์ผู้ใช้งาน</Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>Username: <strong>{user.username}</strong></div>
            <div>Role: <strong>{user.role}</strong></div>
            <div>Student ID: <strong>{user.student_id || '-'}</strong></div>
            <div>Class Group: <strong>{user.class_group || '-'}</strong></div>
            <div>Level: <strong>{user.level || '-'}</strong></div>
            <div>Email: <strong>{user.email || '-'}</strong></div>
          </div>

          <div className="mt-4">
            <Button variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
          </div>

          {/* ✅ Admin: แค่โชว์ข้อความ ไม่ต้องดึง approvals */}
          {isAdmin ? (
            <Typography sx={{ mt: 2 }} color="text.secondary">
              คุณเป็นผู้ดูแลระบบ (Admin) — หน้านี้แสดงข้อมูลโปรไฟล์เท่านั้น
            </Typography>
          ) : null}
        </CardContent>
      </Card>

      {/* ================= STUDENT ================= */}
      {isStudent && (
        <>
          <Typography variant="h6">ผลงานที่ฉันอัปโหลด</Typography>
          {myDocs.length === 0 && <Typography color="text.secondary">ยังไม่มีผลงานที่อัปโหลด</Typography>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myDocs.map((doc) => {
              const normalized = String(doc.status || 'draft').toLowerCase();
              const canSubmit = normalized === 'draft' || normalized === 'rejected';

              return (
                <Card key={doc.document_id}>
                  <CardContent>
                    <Typography variant="subtitle1" className="font-semibold">{doc.title}</Typography>
                    <Typography variant="body2" color="text.secondary">หมวดหมู่: {doc.category_names || '-'}</Typography>
                    <Typography variant="body2" color="text.secondary">คำค้นหา: {doc.keywords || '-'}</Typography>
                    <Typography variant="body2" color="text.secondary">ปีการศึกษา: {doc.academic_year || '-'}</Typography>

                    <div className="mt-2">
                      <Chip size="small" label={normalized} color={statusColor[normalized] || 'default'} />
                    </div>

                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Button size="small" variant="outlined" onClick={() => navigate(`/document-detail/${doc.document_id}`)}>
                        ดูรายละเอียด
                      </Button>

                      {canSubmit && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={async () => {
                            // ✅ ถ้าคุณย้ายไป approvals/request แล้ว ให้เปลี่ยน endpoint ตรงนี้ได้
                            await api.post(`/api/documents/${doc.document_id}/submit`);
                            await loadMyDocs(user.user_id);
                          }}
                        >
                          ส่งให้อาจารย์ตรวจ
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* ================= TEACHER (Advisor) ================= */}
      {isTeacher && (
        <>
          <Typography variant="h6">รายการรออนุมัติ (เฉพาะนักศึกษาที่คุณเป็นที่ปรึกษา)</Typography>

          {pendingError ? (
            <Typography color="error" sx={{ mb: 1 }}>{pendingError}</Typography>
          ) : null}

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

                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button size="small" variant="outlined" onClick={() => navigate(`/document-detail/${doc.document_id}`)}>
                      ดูรายละเอียด
                    </Button>

                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={async () => {
                        await api.post(`/api/approvals/${doc.document_id}/approve`);
                        await loadPendingDocs();
                      }}
                    >
                      อนุมัติ
                    </Button>

                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => setRejectingDoc(doc)}
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
            onClick={async () => {
              await api.post(`/api/approvals/${rejectingDoc.document_id}/reject`, { reason: rejectReason });
              setRejectingDoc(null);
              setRejectReason('');
              await loadPendingDocs();
            }}
          >
            ยืนยันตีกลับ
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Profile;