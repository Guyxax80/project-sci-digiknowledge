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
  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const navigate = useNavigate();

  const effectiveRole = useMemo(
    () => String((user && user.role) || localStorage.getItem('role') || '').trim().toLowerCase(),
    [user]
  );
  const isAdvisor = effectiveRole === 'teacher' || effectiveRole === 'admin';

  const loadMyDocs = async (userId) => {
    const r = await api.get(`/api/documents/by-user/${userId}`);
    setMyDocs(Array.isArray(r.data) ? r.data : []);
  };

  const loadPendingDocs = useCallback(async () => {
    if (!isAdvisor) return;
    const r = await api.get('/api/approvals/pending');
    setPendingDocs(Array.isArray(r.data) ? r.data : []);
  }, [isAdvisor]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const data = res.data;
        if (!data.success) {
          setLoading(false);
          return;
        }

        setUser(data.user);
        if (String(data.user.role).toLowerCase() === 'student') {
          await loadMyDocs(data.user.user_id);
        }
      })
      .catch((err) => console.error('Error fetching profile:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPendingDocs().catch((e) => console.error(e));
  }, [loadPendingDocs]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
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
          </div>
          <div className="mt-4">
            <Button variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
          </div>
        </CardContent>
      </Card>

      {effectiveRole === 'student' && (
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
                      <Button size="small" variant="outlined" onClick={() => navigate(`/document-detail/${doc.document_id}`)}>ดูรายละเอียด</Button>
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

      {isAdvisor && (
        <>
          <Typography variant="h6">รายการรออนุมัติ</Typography>
          {pendingDocs.length === 0 && <Typography color="text.secondary">ไม่มีรายการรอตรวจ</Typography>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDocs.map((doc) => (
              <Card key={doc.document_id}>
                <CardContent>
                  <Typography variant="subtitle1" className="font-semibold">{doc.title}</Typography>
                  <Typography variant="body2" color="text.secondary">ผู้ส่ง: {doc.student_name} ({doc.student_id || '-'})</Typography>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button size="small" variant="outlined" onClick={() => navigate(`/document-detail/${doc.document_id}`)}>ดูรายละเอียด</Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={async () => {
                        await api.post(`/api/approvals/${doc.document_id}/approve`);
                        await loadPendingDocs();
                      }}
                    >อนุมัติ</Button>
                    <Button size="small" variant="contained" color="error" onClick={() => setRejectingDoc(doc)}>ตีกลับ</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

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
          <Button onClick={() => { setRejectingDoc(null); setRejectReason(''); }}>ยกเลิก</Button>
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
          >ยืนยันตีกลับ</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Profile;