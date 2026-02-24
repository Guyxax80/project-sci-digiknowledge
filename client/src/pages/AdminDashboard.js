import React, { useEffect, useMemo, useState } from "react";
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  Chip,
  Stack,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import KeyIcon from "@mui/icons-material/Key";
import SchoolIcon from "@mui/icons-material/School";
import PersonPinIcon from "@mui/icons-material/PersonPin";
import BackupIcon from "@mui/icons-material/Backup";
import RestoreIcon from "@mui/icons-material/Restore";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import api from "../services/api";

const ADMIN_BASE = "/admin"; // ✅ ให้ใช้ตัวเดียวทั้งไฟล์

// ===== helper UI =====
const roleChip = (role) => {
  const r = String(role || "").toLowerCase();
  const map = {
    admin: { label: "Admin", color: "error" },
    teacher: { label: "Teacher", color: "warning" },
    student: { label: "Student", color: "success" },
    user: { label: "User", color: "default" },
    visitor: { label: "Visitor", color: "default" },
  };
  const m = map[r] || { label: role || "-", color: "default" };
  return (
    <Chip
      size="small"
      label={m.label}
      color={m.color}
      variant={m.color === "default" ? "outlined" : "filled"}
    />
  );
};

function StatCard({ icon, label, value, sub }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 10px 30px rgba(0,0,0,.08)",
        border: "1px solid rgba(0,0,0,.06)",
        height: "100%",
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(25,118,210,.10)",
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              {value}
            </Typography>
            {sub ? (
              <Typography variant="caption" sx={{ opacity: 0.65 }}>
                {sub}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);

  // ===== TAB 1: Users =====
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "", student_id: "" });
  const [editingUser, setEditingUser] = useState(null);

  // ===== TAB 2: Student Codes =====
  const [studentCodes, setStudentCodes] = useState([]);
  const [newCodesText, setNewCodesText] = useState("");

  // ===== Stats (กัน ESLint: ใช้จริง) =====
  const [, setStats] = useState(null);

  // ===== TAB 4: Advisor =====
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [advisorMap, setAdvisorMap] = useState({});
  const [editingAdvisor, setEditingAdvisor] = useState({});
  const [savingAdvisorId, setSavingAdvisorId] = useState(null);

  // ===== TAB 3: Backup/Restore =====
  const [backupBusy, setBackupBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreMode] = useState("full"); // เผื่ออนาคต

  // ✅ Backup options (NEW)
  const [backupScope, setBackupScope] = useState("all"); // all | tables
  const [backupDestination, setBackupDestination] = useState("download"); // download | server | supabase
  const [dbTables, setDbTables] = useState([]); // รายชื่อตารางทั้งหมด
  const [selectedTables, setSelectedTables] = useState([]);
  const [backupResult, setBackupResult] = useState(null); // เก็บผลลัพธ์เมื่อ destination ไม่ใช่ download

  // ===== UI-only filters =====
  const [qUsers, setQUsers] = useState("");
  const [qStudents, setQStudents] = useState("");
  const [qCodes, setQCodes] = useState("");

  // ===== Toast helper =====
  const toast = (message, severity = "info") => {
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
  };

  // =========================
  // FETCH: Users
  // =========================
  const fetchUsers = async () => {
    try {
      const res = await api.get(`${ADMIN_BASE}/users`);
      setUsers(res.data || []);
    } catch (err) {
      console.error("โหลดข้อมูลผู้ใช้ล้มเหลว", err?.response?.data || err.message);
      toast("โหลดข้อมูลผู้ใช้ไม่สำเร็จ", "error");
    }
  };

  // =========================
  // FETCH: Student Codes
  // =========================
  const fetchStudentCodes = async () => {
    try {
      const res = await api.get(`${ADMIN_BASE}/student-codes`);
      setStudentCodes(res.data || []);
    } catch (err) {
      console.error("โหลด student codes ล้มเหลว", err?.response?.data || err.message);
      setStudentCodes([]);
      toast("โหลดรหัสนักศึกษาไม่สำเร็จ", "error");
    }
  };

  // =========================
  // FETCH: Stats
  // =========================
  const fetchStats = async () => {
    try {
      const res = await api.get(`${ADMIN_BASE}/stats`, { params: { days: 7 } });
      setStats(res.data);
    } catch (err) {
      console.error("โหลด stats ล้มเหลว", err?.response?.data || err.message);
      setStats(null);
    }
  };

  // =========================
  // FETCH: Advisor data
  // =========================
  const loadAdvisorData = async () => {
    const [studentRes, teacherRes] = await Promise.all([
      api.get(`${ADMIN_BASE}/students`),
      api.get(`${ADMIN_BASE}/teachers`),
    ]);

    const studentRows = Array.isArray(studentRes.data) ? studentRes.data : [];
    const teacherRows = Array.isArray(teacherRes.data) ? teacherRes.data : [];

    setStudents(studentRows);
    setTeachers(teacherRows);

    const nextMap = {};
    studentRows.forEach((s) => {
      nextMap[s.user_id] = s.advisor_id || "";
    });
    setAdvisorMap(nextMap);

    setEditingAdvisor({});
    setSavingAdvisorId(null);
  };

  // =========================
  // FETCH: DB Tables (สำหรับ backup เลือกตาราง)
  // =========================
  const fetchDbTables = async () => {
    try {
      const res = await api.get(`${ADMIN_BASE}/backup/tables`);
      setDbTables(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("โหลดรายชื่อตารางไม่สำเร็จ", err?.response?.data || err.message);
      setDbTables([]);
      // ไม่ toast ก็ได้ แต่ใส่ไว้ช่วย debug
      toast("โหลดรายชื่อตารางสำหรับ Backup ไม่สำเร็จ", "warning");
    }
  };

  // แปลง teacher list เป็น map เพื่อโชว์ชื่อที่ปรึกษาปัจจุบันได้เร็ว
  const teacherById = useMemo(() => {
    const m = new Map();
    teachers.forEach((t) => m.set(String(t.user_id), t));
    return m;
  }, [teachers]);

  const advisorLabelOf = (advisorId) => {
    if (!advisorId) return "ยังไม่กำหนด";
    const t = teacherById.get(String(advisorId));
    if (!t) return `อาจารย์ ID: ${advisorId}`;
    return `${t.username}${t.email ? ` (${t.email})` : ""}`;
  };

  const saveAdvisor = async (studentUserId) => {
    const advisor_id = advisorMap[studentUserId];
    if (!advisor_id) {
      toast("กรุณาเลือกอาจารย์ที่ปรึกษา", "warning");
      return;
    }

    try {
      setSavingAdvisorId(studentUserId);

      await api.put(`${ADMIN_BASE}/students/${studentUserId}/advisor`, { advisor_id });

      toast("บันทึกที่ปรึกษาสำเร็จ", "success");

      await loadAdvisorData();
      setEditingAdvisor((prev) => ({ ...prev, [studentUserId]: false }));
    } catch (err) {
      console.error(err);
      toast(err?.response?.data?.error || "บันทึกไม่สำเร็จ", "error");
    } finally {
      setSavingAdvisorId(null);
    }
  };

  // =========================
  // INIT LOAD
  // =========================
  useEffect(() => {
    fetchUsers();
    fetchStudentCodes();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // โหลด Advisor เฉพาะตอนเปิดแท็บ Advisor
  useEffect(() => {
    if (tab === 3) {
      loadAdvisorData().catch((err) => {
        console.error("โหลดข้อมูล advisor ไม่สำเร็จ", err?.response?.data || err.message);
        toast("โหลดข้อมูลที่ปรึกษาไม่สำเร็จ", "error");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ✅ โหลด tables เฉพาะตอนเปิดแท็บ Backup/Restore
  useEffect(() => {
    if (tab === 2) {
      fetchDbTables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (editingUser) {
      setForm({
        username: editingUser.username,
        password: "",
        role: editingUser.role,
        student_id: editingUser.student_id || "",
      });
    }
  }, [editingUser]);

  // =========================
  // SUBMIT: Add/Edit User
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`${ADMIN_BASE}/users/${editingUser.user_id}`, {
          username: form.username,
          role: form.role,
          student_id: form.student_id || null,
        });
        toast("อัปเดตผู้ใช้สำเร็จ", "success");
      } else {
        await api.post(`${ADMIN_BASE}/users`, {
          username: form.username,
          password: form.password,
          role: form.role,
          student_id: form.student_id || null,
        });
        toast("เพิ่มผู้ใช้สำเร็จ", "success");
      }

      setForm({ username: "", password: "", role: "", student_id: "" });
      setEditingUser(null);
      fetchUsers();
      fetchStudentCodes();
    } catch (err) {
      console.error("บันทึกล้มเหลว:", err?.response?.data || err.message);
      toast(err?.response?.data?.error || "บันทึกไม่สำเร็จ", "error");
    }
  };

  // =========================
  // DELETE: User
  // =========================
  const deleteUser = async (user_id) => {
    if (!window.confirm("ยืนยันการลบผู้ใช้นี้?")) return;
    try {
      await api.delete(`${ADMIN_BASE}/users/${user_id}`);
      toast("ลบผู้ใช้สำเร็จ", "success");
      fetchUsers();
    } catch (err) {
      console.error("ลบผู้ใช้ล้มเหลว", err?.response?.data || err.message);
      toast(err?.response?.data?.error || "ลบผู้ใช้ไม่สำเร็จ", "error");
    }
  };

  // =========================
  // ✅ BACKUP (NEW: POST /backup + เลือก scope/destination)
  // =========================
  const backupDatabase = async () => {
    try {
      setBackupBusy(true);
      setBackupResult(null);

      const payload = {
        scope: backupScope, // "all" | "tables"
        tables: backupScope === "tables" ? selectedTables : [],
        destination: backupDestination, // "download" | "server" | "supabase"
      };

      // ถ้าเป็น download ให้รับเป็น blob แล้วดาวน์โหลด
      if (backupDestination === "download") {
        const res = await api.post(`${ADMIN_BASE}/backup`, payload, { responseType: "blob" });

        const blob = new Blob([res.data], { type: "application/sql" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;

        const ts = new Date();
        const yyyy = ts.getFullYear();
        const mm = String(ts.getMonth() + 1).padStart(2, "0");
        const dd = String(ts.getDate()).padStart(2, "0");
        const hh = String(ts.getHours()).padStart(2, "0");
        const mi = String(ts.getMinutes()).padStart(2, "0");

        const filename =
          backupScope === "all"
            ? `backup-all-${yyyy}${mm}${dd}-${hh}${mi}.sql`
            : `backup-${selectedTables.join("_")}-${yyyy}${mm}${dd}-${hh}${mi}.sql`;

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

        toast("ดาวน์โหลดไฟล์สำรองสำเร็จ", "success");
        return;
      }

      // ถ้าไม่ใช่ download ให้รับ JSON result
      const res = await api.post(`${ADMIN_BASE}/backup`, payload);
      setBackupResult(res.data);

      toast("สร้างไฟล์ backup สำเร็จ", "success");
    } catch (err) {
      console.error("สำรองฐานข้อมูลล้มเหลว", err?.response?.data || err.message);
      const status = err?.response?.status;
      if (status === 501) toast("ตอนนี้ระบบ backup ผ่าน API ยังไม่เปิดใช้งาน (501)", "warning");
      else toast(err?.response?.data?.error || "สำรองฐานข้อมูลไม่สำเร็จ", "error");
    } finally {
      setBackupBusy(false);
    }
  };

  // =========================
  // RESTORE (เดิมของคุณ)
  // =========================
  const restoreDatabase = async () => {
    if (!restoreFile) {
      toast("กรุณาเลือกไฟล์ .sql ก่อนกู้คืน", "warning");
      return;
    }

    const ok = window.confirm(
      "⚠️ ยืนยันกู้คืนฐานข้อมูล?\n\nการกู้คืนอาจทำให้ข้อมูลเดิมถูกเขียนทับ/ลบได้\nแนะนำให้สำรองก่อนเสมอ"
    );
    if (!ok) return;

    try {
      setRestoreBusy(true);

      const fd = new FormData();
      fd.append("file", restoreFile);
      fd.append("mode", restoreMode); // full

      await api.post(`${ADMIN_BASE}/restore`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast("กู้คืนฐานข้อมูลสำเร็จ", "success");
      setRestoreFile(null);
    } catch (err) {
      console.error("กู้คืนฐานข้อมูลล้มเหลว", err?.response?.data || err.message);
      const status = err?.response?.status;
      if (status === 501) toast("ตอนนี้ระบบ restore ผ่าน API ยังไม่เปิดใช้งาน (501)", "warning");
      else toast(err?.response?.data?.error || "กู้คืนไม่สำเร็จ", "error");
    } finally {
      setRestoreBusy(false);
    }
  };

  // =========================
  // Student Codes: Add/Delete
  // =========================
  const addStudentCodes = async () => {
    try {
      const payload = { student_ids: newCodesText };
      await api.post(`${ADMIN_BASE}/student-codes`, payload);
      setNewCodesText("");
      fetchStudentCodes();
      toast("เพิ่มรหัสนักศึกษาสำเร็จ", "success");
    } catch (err) {
      console.error("เพิ่ม student codes ล้มเหลว", err?.response?.data || err.message);
      toast(err?.response?.data?.error || "เพิ่มรหัสนักศึกษาไม่สำเร็จ", "error");
    }
  };

  const deleteStudentCode = async (id) => {
    if (!window.confirm("ยืนยันการลบ?")) return;
    try {
      await api.delete(`${ADMIN_BASE}/student-codes/${id}`);
      fetchStudentCodes();
      toast("ลบรหัสสำเร็จ", "success");
    } catch (err) {
      console.error("ลบ student code ล้มเหลว", err?.response?.data || err.message);
      toast(err?.response?.data?.error || "ลบไม่สำเร็จ", "error");
    }
  };

  // ===== dashboard counts =====
  const counts = useMemo(() => {
    const totalUsers = users.length;
    const totalStudents = users.filter((u) => String(u.role).toLowerCase() === "student").length;
    const totalTeachers = users.filter((u) => String(u.role).toLowerCase() === "teacher").length;
    const totalCodes = studentCodes.length;
    const advisorAssigned = students.filter((s) => !!s.advisor_id).length;

    return { totalUsers, totalStudents, totalTeachers, totalCodes, advisorAssigned };
  }, [users, studentCodes, students]);

  // ===== filtered lists =====
  const filteredUsers = useMemo(() => {
    const q = qUsers.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        String(u.username || "").toLowerCase().includes(q) ||
        String(u.role || "").toLowerCase().includes(q) ||
        String(u.student_id || "").toLowerCase().includes(q)
      );
    });
  }, [users, qUsers]);

  const filteredCodes = useMemo(() => {
    const q = qCodes.trim().toLowerCase();
    if (!q) return studentCodes;
    return studentCodes.filter((s) => String(s.student_id || "").toLowerCase().includes(q));
  }, [studentCodes, qCodes]);

  const filteredStudents = useMemo(() => {
    const q = qStudents.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const advisorText = advisorLabelOf(s.advisor_id).toLowerCase();
      return (
        String(s.username || "").toLowerCase().includes(q) ||
        String(s.student_id || "").toLowerCase().includes(q) ||
        String(s.class_group || "").toLowerCase().includes(q) ||
        String(s.level || "").toLowerCase().includes(q) ||
        String(s.email || "").toLowerCase().includes(q) ||
        advisorText.includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, qStudents]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "rgba(0,0,0,.02)",
        py: 4,
        px: { xs: 2, md: 4 },
      }}
    >
      {/* ===== Header ===== */}
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              จัดการผู้ใช้ • รหัสนักศึกษา • สำรอง/กู้คืนฐานข้อมูล • ที่ปรึกษา
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => {
                fetchUsers();
                fetchStudentCodes();
                if (tab === 3) loadAdvisorData();
              }}
            >
              รีเฟรชข้อมูล
            </Button>
          </Stack>
        </Stack>

        {/* ===== KPI cards ===== */}
        <Box
          sx={{
            mt: 3,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
            gap: 2,
          }}
        >
          <StatCard icon={<PeopleOutlineIcon />} label="ผู้ใช้ทั้งหมด" value={counts.totalUsers} />
          <StatCard icon={<SchoolIcon />} label="นักศึกษา" value={counts.totalStudents} />
          <StatCard icon={<PersonPinIcon />} label="อาจารย์" value={counts.totalTeachers} />
          <StatCard icon={<KeyIcon />} label="Student Codes" value={counts.totalCodes} />
          <StatCard icon={<PersonPinIcon />} label="มีที่ปรึกษาแล้ว" value={counts.advisorAssigned} sub="ในแท็บที่ปรึกษา" />
        </Box>

        {/* ===== Tabs ===== */}
        <Card
          sx={{
            mt: 3,
            borderRadius: 3,
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            border: "1px solid rgba(0,0,0,.06)",
          }}
        >
          <Tabs
            value={tab}
            onChange={(e, newValue) => setTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 700, py: 2 },
            }}
          >
            <Tab label="จัดการผู้ใช้" />
            <Tab label="จัดการรหัสนักศึกษา" />
            <Tab label="สำรอง/กู้คืนฐานข้อมูล" />
            <Tab label="จัดการที่ปรึกษา" />
          </Tabs>
        </Card>

        <Box mt={3}>
          {/* ===== TAB 1 ===== */}
          {tab === 0 && (
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 10px 30px rgba(0,0,0,.08)",
                border: "1px solid rgba(0,0,0,.06)",
              }}
            >
              <CardContent>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems={{ md: "center" }}
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      จัดการผู้ใช้
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      เพิ่ม/แก้ไข/ลบผู้ใช้ในระบบ
                    </Typography>
                  </Box>

                  <TextField
                    size="small"
                    placeholder="ค้นหา username / role / student_id"
                    value={qUsers}
                    onChange={(e) => setQUsers(e.target.value)}
                    sx={{ minWidth: { xs: "100%", md: 360 } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Card
                  sx={{
                    borderRadius: 3,
                    bgcolor: "rgba(0,0,0,.02)",
                    border: "1px solid rgba(0,0,0,.06)",
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                      {editingUser ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"}
                    </Typography>

                    <form onSubmit={handleSubmit}>
                      <Stack spacing={2}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                          <TextField
                            fullWidth
                            label="ชื่อผู้ใช้"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                          />

                          {!editingUser ? (
                            <TextField
                              fullWidth
                              type="password"
                              label="รหัสผ่าน"
                              value={form.password}
                              onChange={(e) => setForm({ ...form, password: e.target.value })}
                              required
                            />
                          ) : (
                            <TextField
                              fullWidth
                              label="รหัสผ่าน"
                              value="********"
                              disabled
                              helperText="แก้รหัสผ่านให้ทำฟีเจอร์เฉพาะ (ยังไม่เปิดในหน้านี้)"
                            />
                          )}
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                          <TextField
                            select
                            fullWidth
                            label="บทบาทผู้ใช้"
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            required
                          >
                            <MenuItem value="">-- เลือกบทบาทผู้ใช้ --</MenuItem>
                            <MenuItem value="student">นักศึกษา</MenuItem>
                            <MenuItem value="teacher">อาจารย์</MenuItem>
                            <MenuItem value="admin">แอดมิน</MenuItem>
                            <MenuItem value="user">ผู้ใช้ทั่วไป</MenuItem>
                          </TextField>

                          <TextField
                            fullWidth
                            label="รหัสนักศึกษา"
                            value={form.student_id}
                            onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                            required={form.role === "student"}
                            disabled={form.role !== "student"}
                            helperText={form.role === "student" ? "จำเป็นสำหรับ role นักศึกษา" : "ใช้ได้เฉพาะ role นักศึกษา"}
                          />
                        </Stack>

                        <Stack direction="row" spacing={1}>
                          <Button type="submit" variant="contained">
                            {editingUser ? "อัปเดตผู้ใช้" : "เพิ่มผู้ใช้"}
                          </Button>

                          {editingUser && (
                            <Button
                              type="button"
                              variant="outlined"
                              onClick={() => {
                                setEditingUser(null);
                                setForm({ username: "", password: "", role: "", student_id: "" });
                              }}
                            >
                              ยกเลิก
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    </form>
                  </CardContent>
                </Card>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 700 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(0,0,0,.03)" }}>
                        <TableCell sx={{ fontWeight: 800 }}>ชื่อผู้ใช้</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>บทบาท</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>จัดการ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.map((u, idx) => (
                        <TableRow key={u.user_id} sx={{ bgcolor: idx % 2 ? "rgba(0,0,0,.015)" : "transparent" }}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700 }}>{u.username}</Typography>
                            {u.student_id ? (
                              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                {u.student_id}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell>{roleChip(u.role)}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button size="small" color="warning" variant="outlined" onClick={() => setEditingUser(u)}>
                                แก้ไข
                              </Button>
                              <Button size="small" color="error" variant="outlined" onClick={() => deleteUser(u.user_id)}>
                                ลบ
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            ไม่พบข้อมูลผู้ใช้
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* ===== TAB 2 ===== */}
          {tab === 1 && (
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 10px 30px rgba(0,0,0,.08)",
                border: "1px solid rgba(0,0,0,.06)",
              }}
            >
              <CardContent>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems={{ md: "center" }}
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      จัดการรหัสนักศึกษา (student_codes)
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      วางหลายบรรทัด หรือคั่นด้วยเครื่องหมายจุลภาค (,)
                    </Typography>
                  </Box>

                  <TextField
                    size="small"
                    placeholder="ค้นหารหัสนักศึกษา"
                    value={qCodes}
                    onChange={(e) => setQCodes(e.target.value)}
                    sx={{ minWidth: { xs: "100%", md: 320 } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Card
                  sx={{
                    borderRadius: 3,
                    bgcolor: "rgba(0,0,0,.02)",
                    border: "1px solid rgba(0,0,0,.06)",
                  }}
                >
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-start" }}>
                      <TextField
                        multiline
                        minRows={3}
                        fullWidth
                        label="เพิ่มรหัสนักศึกษา"
                        placeholder={"เช่น 6501234567\n6501234568\nหรือ 6501...,6501..."}
                        value={newCodesText}
                        onChange={(e) => setNewCodesText(e.target.value)}
                      />
                      <Button variant="contained" onClick={addStudentCodes} sx={{ height: 42, mt: { xs: 0, md: 1 } }}>
                        เพิ่มรหัส
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 600 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(0,0,0,.03)" }}>
                        <TableCell sx={{ fontWeight: 800 }}>ไอดี</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>รหัสนักศึกษา</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCodes.map((s, idx) => (
                        <TableRow key={s.student_code_id} sx={{ bgcolor: idx % 2 ? "rgba(0,0,0,.015)" : "transparent" }}>
                          <TableCell>{s.student_code_id}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{s.student_id}</TableCell>
                          <TableCell>
                            <Button size="small" color="error" variant="outlined" onClick={() => deleteStudentCode(s.student_code_id)}>
                              ลบ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredCodes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            ไม่พบรหัสนักศึกษา
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* ===== TAB 3: Backup/Restore ===== */}
          {tab === 2 && (
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 10px 30px rgba(0,0,0,.08)",
                border: "1px solid rgba(0,0,0,.06)",
              }}
            >
              <CardContent>
                <Stack spacing={3} sx={{ py: 3 }}>
                  {/* ===== Backup ===== */}
                  <Box
                    sx={{
                      borderRadius: 3,
                      border: "1px solid rgba(0,0,0,.08)",
                      bgcolor: "rgba(0,0,0,.02)",
                      p: 3,
                    }}
                  >
                    <Stack spacing={1.2} alignItems="center">
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 3,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: "rgba(25,118,210,.10)",
                        }}
                      >
                        <BackupIcon fontSize="large" />
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 900, textAlign: "center" }}>
                        สำรองฐานข้อมูล (Backup)
                      </Typography>

                      <Typography variant="body2" sx={{ opacity: 0.7, textAlign: "center", maxWidth: 680 }}>
                        เลือกได้ว่าจะสำรอง “ทั้งหมด” หรือ “เลือกเฉพาะตาราง” และเลือกที่เก็บไฟล์ได้
                      </Typography>

                      {/* ✅ Options */}
                      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 1, width: "100%", maxWidth: 900 }}>
                        <TextField
                          select
                          fullWidth
                          label="รูปแบบการสำรอง"
                          value={backupScope}
                          onChange={(e) => {
                            const v = e.target.value;
                            setBackupScope(v);
                            setSelectedTables([]);
                            setBackupResult(null);
                          }}
                        >
                          <MenuItem value="all">สำรองทั้งหมด (All)</MenuItem>
                          <MenuItem value="tables">เลือกเฉพาะตาราง (Selected tables)</MenuItem>
                        </TextField>

                        <TextField
                          select
                          fullWidth
                          label="ที่เก็บไฟล์"
                          value={backupDestination}
                          onChange={(e) => {
                            setBackupDestination(e.target.value);
                            setBackupResult(null);
                          }}
                        >
                          <MenuItem value="download">ดาวน์โหลดทันที (Download)</MenuItem>
                          <MenuItem value="server">เก็บบน Server (ชั่วคราว)</MenuItem>
                          <MenuItem value="supabase">เก็บบน Supabase Storage</MenuItem>
                        </TextField>
                      </Stack>

                      {/* ✅ Select tables */}
                      {backupScope === "tables" && (
                        <TextField
                          select
                          fullWidth
                          label="เลือกตาราง"
                          SelectProps={{ multiple: true }}
                          value={selectedTables}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSelectedTables(typeof v === "string" ? v.split(",") : v);
                            setBackupResult(null);
                          }}
                          sx={{ mt: 1, width: "100%", maxWidth: 900 }}
                          helperText={dbTables.length ? "เลือกได้หลายตาราง" : "ยังโหลดรายชื่อตารางไม่ได้"}
                        >
                          {dbTables.map((t) => (
                            <MenuItem key={t} value={t}>
                              {t}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}

                      <Button
                        variant="contained"
                        size="large"
                        onClick={backupDatabase}
                        disabled={
                          backupBusy ||
                          restoreBusy ||
                          (backupScope === "tables" && selectedTables.length === 0)
                        }
                        sx={{ mt: 1 }}
                      >
                        {backupBusy ? "กำลังเตรียมไฟล์..." : "เริ่ม Backup"}
                      </Button>

                      {/* ✅ show result (server/supabase) */}
                      {backupResult ? (
                        <Box
                          sx={{
                            mt: 2,
                            width: "100%",
                            maxWidth: 900,
                            p: 2,
                            borderRadius: 2,
                            border: "1px dashed rgba(0,0,0,.25)",
                            bgcolor: "rgba(255,255,255,.6)",
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            ผลลัพธ์ Backup
                          </Typography>
                          <Typography variant="body2">destination: {backupResult.destination}</Typography>
                          <Typography variant="body2">filename: {backupResult.filename}</Typography>

                          {backupResult.destination === "supabase" ? (
                            <>
                              <Typography variant="body2">path: {backupResult.path}</Typography>
                              {backupResult.signedUrl ? (
                                <Button
                                  variant="outlined"
                                  sx={{ mt: 1 }}
                                  onClick={() => window.open(backupResult.signedUrl, "_blank")}
                                >
                                  เปิดลิงก์ดาวน์โหลด (Signed URL)
                                </Button>
                              ) : null}
                            </>
                          ) : null}

                          {backupResult.destination === "server" ? (
                            <Typography variant="caption" sx={{ opacity: 0.75 }}>
                              หมายเหตุ: Railway filesystem อาจหายเมื่อ redeploy/restart แนะนำใช้ Supabase Storage
                            </Typography>
                          ) : null}
                        </Box>
                      ) : null}
                    </Stack>
                  </Box>

                  <Divider />

                  {/* ===== Restore ===== */}
                  <Box
                    sx={{
                      borderRadius: 3,
                      border: "1px solid rgba(0,0,0,.08)",
                      bgcolor: "rgba(255,0,0,.03)",
                      p: 3,
                    }}
                  >
                    <Stack spacing={1.2} alignItems="center">
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 3,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: "rgba(211,47,47,.10)",
                        }}
                      >
                        <RestoreIcon fontSize="large" />
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 900, textAlign: "center" }}>
                        กู้คืนฐานข้อมูล (Restore)
                      </Typography>

                      <Typography variant="body2" sx={{ opacity: 0.75, textAlign: "center", maxWidth: 680 }}>
                        ⚠️ การกู้คืนอาจทำให้ข้อมูลเดิมถูกเขียนทับ/ลบได้
                        <br />
                        ให้เลือกไฟล์ .sql ที่เชื่อถือได้ และควรสำรองก่อนเสมอ
                      </Typography>

                      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<UploadFileIcon />}
                          disabled={restoreBusy || backupBusy}
                        >
                          เลือกไฟล์ .sql
                          <input
                            hidden
                            type="file"
                            accept=".sql,application/sql,text/plain"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              setRestoreFile(f);
                            }}
                          />
                        </Button>

                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          {restoreFile ? restoreFile.name : "ยังไม่ได้เลือกไฟล์"}
                        </Typography>
                      </Stack>

                      <Button
                        color="error"
                        variant="contained"
                        size="large"
                        onClick={restoreDatabase}
                        disabled={!restoreFile || restoreBusy || backupBusy}
                        sx={{ mt: 1 }}
                      >
                        {restoreBusy ? "กำลังกู้คืน..." : "กู้คืนจากไฟล์ที่เลือก"}
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* ===== TAB 4: Advisor ===== */}
          {tab === 3 && (
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 10px 30px rgba(0,0,0,.08)",
                border: "1px solid rgba(0,0,0,.06)",
              }}
            >
              <CardContent>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems={{ md: "center" }}
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      จัดการที่ปรึกษานักศึกษา
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      กำหนด advisor ให้กับนักศึกษาแต่ละคน
                    </Typography>
                  </Box>

                  <TextField
                    size="small"
                    placeholder="ค้นหา นศ./รหัส/กลุ่ม/อีเมล/ที่ปรึกษา"
                    value={qStudents}
                    onChange={(e) => setQStudents(e.target.value)}
                    sx={{ minWidth: { xs: "100%", md: 420 } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 1050 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(0,0,0,.03)" }}>
                        {["ชื่อผู้ใช้", "รหัสนักศึกษา", "กลุ่มเรียน", "ชั้นปี", "อีเมล", "ที่ปรึกษาปัจจุบัน", "จัดการ"].map(
                          (h) => (
                            <TableCell key={h} sx={{ fontWeight: 800 }}>
                              {h}
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filteredStudents.map((s, idx) => {
                        const isEdit = !!editingAdvisor[s.user_id];
                        const isSaving = savingAdvisorId === s.user_id;

                        return (
                          <TableRow key={s.user_id} sx={{ bgcolor: idx % 2 ? "rgba(0,0,0,.015)" : "transparent" }}>
                            <TableCell sx={{ fontWeight: 700 }}>{s.username}</TableCell>
                            <TableCell>{s.student_id || "-"}</TableCell>
                            <TableCell>{s.class_group || "-"}</TableCell>
                            <TableCell>{s.level || "-"}</TableCell>
                            <TableCell>{s.email || "-"}</TableCell>

                            <TableCell>
                              {!isEdit ? (
                                <Chip label={advisorLabelOf(s.advisor_id)} size="small" variant="outlined" />
                              ) : (
                                <Select
                                  size="small"
                                  value={advisorMap[s.user_id] || ""}
                                  onChange={(e) => setAdvisorMap((prev) => ({ ...prev, [s.user_id]: e.target.value }))}
                                  displayEmpty
                                  sx={{ minWidth: 280 }}
                                >
                                  <MenuItem value="">เลือกอาจารย์</MenuItem>
                                  {teachers.map((t) => (
                                    <MenuItem key={t.user_id} value={t.user_id}>
                                      {t.username} ({t.email || "ไม่มีอีเมล"})
                                    </MenuItem>
                                  ))}
                                </Select>
                              )}
                            </TableCell>

                            <TableCell>
                              {!isEdit ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setEditingAdvisor((prev) => ({ ...prev, [s.user_id]: true }))}
                                >
                                  แก้ไข
                                </Button>
                              ) : (
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  <Button variant="contained" size="small" disabled={isSaving} onClick={() => saveAdvisor(s.user_id)}>
                                    {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                                  </Button>

                                  <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={isSaving}
                                    onClick={() => {
                                      setAdvisorMap((prev) => ({ ...prev, [s.user_id]: s.advisor_id || "" }));
                                      setEditingAdvisor((prev) => ({ ...prev, [s.user_id]: false }));
                                    }}
                                  >
                                    ยกเลิก
                                  </Button>
                                </Stack>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            ไม่พบนักศึกษา
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}