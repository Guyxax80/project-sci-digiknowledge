// src/pages/Profile.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import api from "../services/api";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ โหมดแก้ไขโปรไฟล์
  const [editProfile, setEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    student_id: "",
    class_group: "",
    level: "",
    advisor_name: "",
    advisor_email: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const effectiveRole = useMemo(
    () => String((user && user.role) || localStorage.getItem("role") || "").trim().toLowerCase(),
    [user]
  );

  const isStudent = effectiveRole === "student";
  //const isTeacher = effectiveRole === 'teacher';
  const isAdmin = effectiveRole === "admin";

  // ===== Helpers =====
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

  // ✅ ดึง profile จาก route ที่ “ชัวร์ว่ามี email”
  const fetchProfileMe = useCallback(async () => {
    const res = await api.get("/profile/me");
    return res.data?.user || null;
  }, []);

  // ✅ โหลด user จาก /auth/me แล้ว merge email จาก /profile/me
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
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
        } catch (e) {
          console.error("profile/me error:", e?.response?.data || e.message);
          profileMe = null;
        }

        const mergedUser = {
          ...data.user,
          ...(profileMe || {}),
          email: String(profileMe?.email ?? data.user.email ?? "").trim(),
        };

        setUser(mergedUser);

        setProfileForm({
          username: mergedUser.username || "",
          student_id: mergedUser.student_id || "",
          class_group: mergedUser.class_group || "",
          level: mergedUser.level || "",
          advisor_name: mergedUser.advisor_name || "",
          advisor_email: mergedUser.advisor_email || "",
          email: mergedUser.email || "",
          password: "",
        });
      } catch (err) {
        console.error("Error fetching profile:", err?.response?.data || err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchProfileMe]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/login");
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

      if (String(profileForm.password || "").trim()) {
        payload.password = profileForm.password;
      }

      const res = await api.patch("/profile/me", payload);
      const updatedUser = res.data?.user;

      if (!res.data?.success || !updatedUser) {
        toast(res.data?.message || "บันทึกไม่สำเร็จ", "error");
        return;
      }

      setUser((prev) => ({
        ...(prev || {}),
        ...updatedUser,
        email: String(updatedUser.email || "").trim(),
      }));

      setProfileForm((prev) => ({
        ...prev,
        username: updatedUser.username || "",
        student_id: updatedUser.student_id || "",
        class_group: updatedUser.class_group || "",
        level: updatedUser.level || "",
        advisor_name: updatedUser.advisor_name || "",
        advisor_email: updatedUser.advisor_email || "",
        email: updatedUser.email || "",
        password: "",
      }));

      setEditProfile(false);
      toast("บันทึกโปรไฟล์สำเร็จ", "success");
    } catch (err) {
      console.error("save profile error:", err?.response?.data || err.message);
      toast(err?.response?.data?.message || "บันทึกไม่สำเร็จ", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // ===== UI-only helpers =====
  const roleLabel = useMemo(() => {
    if (isAdmin) return "ผู้ดูแลระบบ";
    if (isStudent) return "นักศึกษา";
    return "ผู้ใช้งาน";
  }, [isAdmin, isStudent]);

  const advisorLabel = useMemo(() => {
    if (!isStudent) return "-";
    return user?.advisor_name
      ? `${user.advisor_name}${user.advisor_email ? ` (${user.advisor_email})` : ""}`
      : "ยังไม่ผูกที่ปรึกษา";
  }, [isStudent, user?.advisor_name, user?.advisor_email]);

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

  return (
    <div className="min-h-screen bg-black/[0.02] py-6">
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
        {/* ===== Hero ===== */}
        <div className="rounded-3xl border border-black/5 shadow-lg overflow-hidden bg-white">
          <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-brand-50/60">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  โปรไฟล์ผู้ใช้งาน
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  จัดการข้อมูลส่วนตัวสำหรับการใช้งานระบบและการแจ้งเตือน
                </Typography>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip label={`บทบาท: ${roleLabel}`} variant="outlined" />
                  <Chip
                    label={`อีเมล: ${user.email ? "มีแล้ว" : "ยังไม่มี"}`}
                    color={user.email ? "success" : "warning"}
                    variant="outlined"
                    size="small"
                  />
                  {isStudent ? (
                    <Chip
                      label={`ที่ปรึกษา: ${user.advisor_name ? "ผูกแล้ว" : "ยังไม่ผูก"}`}
                      color={user.advisor_name ? "success" : "default"}
                      variant="outlined"
                      size="small"
                    />
                  ) : null}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {!isAdmin && !editProfile ? (
                  <Button variant="contained" onClick={() => setEditProfile(true)}>
                    แก้ไขโปรไฟล์
                  </Button>
                ) : null}

                <Button variant="outlined" color="error" onClick={handleLogout}>
                  ออกจากระบบ
                </Button>
              </div>
            </div>

            {isAdmin ? (
              <div className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
                <Typography color="text.secondary">
                  คุณเป็นผู้ดูแลระบบ (Admin) — หน้านี้แสดงข้อมูลโปรไฟล์เท่านั้น
                </Typography>
              </div>
            ) : null}
          </div>
        </div>

        {/* ===== Content grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ===== Left: Profile summary ===== */}
          <Card
            className="shadow-md"
            sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>
                ข้อมูลบัญชี
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {!editProfile ? (
                <div className="space-y-2 text-sm text-gray-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-600">ชื่อผู้ใช้</span>
                    <span className="font-semibold">{user.username}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-600">บทบาท</span>
                    <span className="font-semibold">{user.role}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-600">อีเมล</span>
                    <span className="font-semibold">{user.email || "-"}</span>
                  </div>

                  {isStudent ? (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        ข้อมูลนักศึกษา
                      </Typography>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-600">รหัสนักศึกษา</span>
                        <span className="font-semibold">{user.student_id || "-"}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-600">กลุ่มเรียน</span>
                        <span className="font-semibold">{user.class_group || "-"}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-600">ชั้นปี</span>
                        <span className="font-semibold">{user.level || "-"}</span>
                      </div>

                      <div className="mt-2 rounded-xl border border-black/5 bg-black/[0.02] p-3">
                        <div className="text-gray-600 text-xs">อาจารย์ที่ปรึกษา</div>
                        <div className="font-semibold">{advisorLabel}</div>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  อยู่ในโหมดแก้ไขข้อมูล → กรอกข้อมูลในแบบฟอร์มด้านขวา
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== Right: Edit form / Settings ===== */}
          <Card
            className="shadow-md lg:col-span-2"
            sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <CardContent>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                  {editProfile ? "แก้ไขโปรไฟล์" : "การตั้งค่าโปรไฟล์"}
                </Typography>

                {!editProfile ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={user.email ? "พร้อมรับแจ้งเตือนทางอีเมล" : "ยังไม่ตั้งค่าอีเมลแจ้งเตือน"}
                    color={user.email ? "success" : "warning"}
                  />
                ) : null}
              </div>

              <Divider sx={{ my: 2 }} />

              {!editProfile ? (
                <div className="space-y-2">
                  <Typography variant="body2" color="text.secondary">
                    คุณสามารถแก้ไขชื่อผู้ใช้/อีเมล และเปลี่ยนรหัสผ่านได้ (ถ้าเป็นนักศึกษาจะแก้ไขกลุ่มเรียน/ชั้นปีได้)
                  </Typography>

                  {!isAdmin ? (
                    <div className="mt-3">
                      <Button variant="contained" onClick={() => setEditProfile(true)}>
                        แก้ไขโปรไฟล์
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextField
                      label="ชื่อผู้ใช้"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
                      fullWidth
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />

                    {/* ✅ Student เท่านั้นที่แก้ class/level ได้ */}
                    {isStudent ? (
                      <>
                        <TextField
                          label="รหัสนักศึกษา"
                          value={profileForm.student_id}
                          fullWidth
                          margin="normal"
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ readOnly: true }}
                          helperText="*รหัสนักศึกษาไม่สามารถแก้ไขได้*"
                          FormHelperTextProps={{ sx: { fontStyle: "italic" } }}
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
                              ? `${profileForm.advisor_name}${
                                  profileForm.advisor_email ? ` (${profileForm.advisor_email})` : ""
                                }`
                              : "ยังไม่ผูกที่ปรึกษา"
                          }
                          fullWidth
                          margin="normal"
                          InputLabelProps={{ shrink: true }}
                          disabled
                        />
                      </>
                    ) : null}

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

                  <div className="mt-4 flex gap-2 flex-wrap items-center">
                    <Button variant="contained" disabled={savingProfile} onClick={handleSaveProfile}>
                      {savingProfile ? "กำลังบันทึก..." : "บันทึก"}
                    </Button>

                    <Button
                      variant="outlined"
                      disabled={savingProfile}
                      onClick={() => {
                        setProfileForm({
                          username: user.username || "",
                          student_id: user.student_id || "",
                          class_group: user.class_group || "",
                          level: user.level || "",
                          advisor_name: user.advisor_name || "",
                          advisor_email: user.advisor_email || "",
                          email: user.email || "",
                          password: "",
                        });
                        setEditProfile(false);
                      }}
                    >
                      ยกเลิก
                    </Button>

                    <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
                      <Chip size="small" variant="outlined" label="แก้ไขเฉพาะ UI" />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={isStudent ? "Student" : isAdmin ? "Admin" : "User"}
                      />
                    </Stack>
                  </div>

                  <div className="mt-3 rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                    <Typography variant="caption" color="text.secondary">
                      เคล็ดลับ: ใส่อีเมลที่ใช้งานจริงเพื่อรับแจ้งเตือนสถานะเอกสาร (เช่น ส่งแล้ว/ตีกลับ/อนุมัติ)
                    </Typography>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}

export default Profile;