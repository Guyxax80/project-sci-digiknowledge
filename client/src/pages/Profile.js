// src/pages/Profile.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
} from '@mui/material';
import api from '../services/api';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ โหมดแก้ไขโปรไฟล์
  const [editProfile, setEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    student_id: '',
    class_group: '',
    level: '',
    advisor_name: '',
    advisor_email: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  const effectiveRole = useMemo(
    () => String((user && user.role) || localStorage.getItem('role') || '').trim().toLowerCase(),
    [user]
  );

  const isStudent = effectiveRole === 'student';
  //const isTeacher = effectiveRole === 'teacher';
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

  // ✅ ดึง profile จาก route ที่ “ชัวร์ว่ามี email”
  const fetchProfileMe = useCallback(async () => {
    const res = await api.get('/profile/me');
    return res.data?.user || null;
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
          advisor_name: mergedUser.advisor_name || '',
          advisor_email: mergedUser.advisor_email || '',
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

  // ✅ บันทึกแก้ไขโปรไฟล์ (PATCH /profile/me)
  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);

      const payload = {
        username: profileForm.username,
        email: profileForm.email,
      };

      // เฉพาะ student เท่านั้นที่ส่งเพิ่ม
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
        advisor_name: updatedUser.advisor_name || '',
        advisor_email: updatedUser.advisor_email || '',
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

  if (loading) return <p className="p-4">กำลังโหลด...</p>;
  if (!user) return <div className="p-4 text-center"><p>ยังไม่ได้เข้าสู่ระบบ</p></div>;

  return (
    <div className="max-w-5xl mx-auto mt-20 p-6 space-y-6">
      <Card>
        <CardContent>
          <Typography variant="h5" className="mb-2">โปรไฟล์ผู้ใช้งาน</Typography>

          {!editProfile ? (
            <>
              {/* ✅ แสดงตามบทบาท */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>ชื่อผู้ใช้: <strong>{user.username}</strong></div>
                <div>บทบาท: <strong>{user.role}</strong></div>
                <div>อีเมล: <strong>{user.email || '-'}</strong></div>

                {/* ✅ Student เท่านั้นที่เห็นข้อมูลนักศึกษา */}
                {isStudent && (
                  <>
                    <div>รหัสนักศึกษา: <strong>{user.student_id || '-'}</strong></div>
                    <div>กลุ่มเรียน: <strong>{user.class_group || '-'}</strong></div>
                    <div>ชั้นปี: <strong>{user.level || '-'}</strong></div>
                    <div>
                      อาจารย์ที่ปรึกษา:{' '}
                      <strong>
                        {user.advisor_name
                          ? `${user.advisor_name}${user.advisor_email ? ` (${user.advisor_email})` : ''}`
                          : 'ยังไม่ผูกที่ปรึกษา'}
                      </strong>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 flex gap-2 flex-wrap">
                {!isAdmin && (
                  <Button variant="contained" onClick={() => setEditProfile(true)}>
                    แก้ไขโปรไฟล์
                  </Button>
                )}

                <Button variant="outlined" color="error" onClick={handleLogout}>
                  ออกจากระบบ
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
                  label="ชื่อผู้ใช้"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />

                {/* ✅ Student เท่านั้นที่แก้ class/level ได้ */}
                {isStudent && (
                  <>
                    <TextField
                      label="รหัสนักศึกษา"
                      value={profileForm.student_id}
                      fullWidth
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                      helperText="*รหัสนักศึกษาไม่สามารถแก้ไขได้*"
                      FormHelperTextProps={{ sx: { fontStyle: 'italic' } }}
                    />

                    <TextField
                      label="กลุ่มชั้นเรียน"
                      value={profileForm.class_group}
                      onChange={(e) => setProfileForm((p) => ({ ...p, class_group: e.target.value }))}
                      fullWidth
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                      label="ชั้นปี"
                      value={profileForm.level}
                      onChange={(e) => setProfileForm((p) => ({ ...p, level: e.target.value }))}
                      fullWidth
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                      label="อาจารย์ที่ปรึกษา"
                      value={
                        profileForm.advisor_name
                          ? `${profileForm.advisor_name}${profileForm.advisor_email ? ` (${profileForm.advisor_email})` : ''}`
                          : 'ยังไม่ผูกที่ปรึกษา'
                      }
                      fullWidth
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                      disabled
                    />
                  </>
                )}

                {/* ✅ Teacher/Profile: มีแค่ Username/Email/Password (และ Student ก็มี Email/Password ด้วย) */}
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
                      advisor_name: user.advisor_name || '',
                      advisor_email: user.advisor_email || '',
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

      {/* ✅ Teacher pending ถูกย้ายออกไปที่หน้า TeacherApprovalHistory แล้ว */}
    </div>
  );
}

export default Profile;