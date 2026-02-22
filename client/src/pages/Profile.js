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
} from '@mui/material';
import api from '../services/api';

// ✅ ปรับให้ตรง enum document_status_enum: draft, pending, approved, rejected


function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [myDocs, setMyDocs] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [pendingError, setPendingError] = useState('');

  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // ✅ timeline ต่อเอกสาร (ใช้ร่วมกันทั้ง student/teacher)
  // { [docId]: { open, loading, error, items } }
  const [timelineByDoc, setTimelineByDoc] = useState({});

  const navigate = useNavigate();

  const effectiveRole = useMemo(
    () => String((user && user.role) || localStorage.getItem('role') || '').trim().toLowerCase(),
    [user]
  );

  const isTeacher = effectiveRole === 'teacher';
  const isStudent = effectiveRole === 'student';
  const isAdmin = effectiveRole === 'admin';

  const loadMyDocs = useCallback(async (userId) => {
    const r = await api.get(`/api/documents/by-user/${userId}`);
    setMyDocs(Array.isArray(r.data) ? r.data : []);
  }, []);

  const loadPendingDocs = useCallback(async () => {
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

  // ✅ โหลดโปรไฟล์
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

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

  // ✅ โหลดรายการรอตรวจของครู
  useEffect(() => {
    loadPendingDocs().catch((e) => console.error(e));
  }, [loadPendingDocs]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  // ✅ เปิด/ปิด + โหลด timeline แบบ lazy (กดแล้วค่อยโหลด)
  const toggleTimeline = async (documentId) => {
    // toggle open
    setTimelineByDoc((prev) => {
      const cur = prev[documentId] || { open: false, loading: false, error: null, items: null };
      return { ...prev, [documentId]: { ...cur, open: !cur.open } };
    });

    // ถ้าเคยโหลดแล้ว ไม่ต้องโหลดซ้ำ
    const cur = timelineByDoc[documentId];
    if (cur?.items) return;

    // โหลดตอนเปิดครั้งแรก
    setTimelineByDoc((prev) => ({
      ...prev,
      [documentId]: { ...(prev[documentId] || {}), open: true, loading: true, error: null, items: null },
    }));

    try {
      const res = await api.get(`/api/approvals/${documentId}/timeline`);
      const items = res.data?.timeline || [];
      setTimelineByDoc((prev) => ({
        ...prev,
        [documentId]: { ...(prev[documentId] || {}), open: true, loading: false, error: null, items },
      }));
    } catch (err) {
      console.error('load timeline error:', err?.response?.data || err.message);
      setTimelineByDoc((prev) => ({
        ...prev,
        [documentId]: { ...(prev[documentId] || {}), open: true, loading: false, error: 'โหลด Timeline ไม่สำเร็จ', items: [] },
      }));
    }
  };

  // ✅ UI timeline สวย (รีใช้ได้ทั้ง student/teacher)
  const TimelineBlock = ({ documentId }) => {
    const state = timelineByDoc[documentId] || { open: false, loading: false, error: null, items: null };
    const items = Array.isArray(state.items) ? state.items : [];

    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => toggleTimeline(documentId)}
          className="text-sm text-blue-600 hover:underline"
        >
          {state.open ? 'ซ่อน Timeline' : 'ดู Timeline'}
        </button>

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
                                  {item.status}
                                </span>

                                <span className="text-xs text-gray-500">
                                  {item.approved_at ? new Date(item.approved_at).toLocaleString() : '-'}
                                </span>
                              </div>

                              <div className="text-sm">โดย {item.approver_name || '-'}</div>

                              {item.reason && (
                                <div className="text-sm text-red-500 mt-1">เหตุผล: {item.reason}</div>
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

                    {/* ✅ แทน Chip ด้วย Timeline ตามที่ขอ */}
                    <div className="mt-2">
                      <TimelineBlock documentId={doc.document_id} />
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

                  {/* ✅ ครูอยากดู Timeline ของงานที่จะตรวจได้ด้วย */}
                  <div className="mt-2">
                    <TimelineBlock documentId={doc.document_id} />
                  </div>

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