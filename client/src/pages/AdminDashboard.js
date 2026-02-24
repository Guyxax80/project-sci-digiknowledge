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
} from "@mui/material";
import api from "../services/api";

const ADMIN_BASE = "/api/admin"; // ✅ ให้ใช้ตัวเดียวทั้งไฟล์

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
  const [advisorMap, setAdvisorMap] = useState({}); // studentUserId -> advisorId
  const [editingAdvisor, setEditingAdvisor] = useState({}); // studentUserId -> true/false
  const [savingAdvisorId, setSavingAdvisorId] = useState(null); // studentUserId ที่กำลังบันทึก

  // ===== Toast helper (เหมือนหน้าอื่น ๆ) =====
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

    // รีเซ็ตโหมดแก้ไขทุกคนตอนโหลดใหม่ (กันหลุด state)
    setEditingAdvisor({});
    setSavingAdvisorId(null);
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

      // โหลดใหม่ให้ข้อมูลตรงกับ DB
      await loadAdvisorData();

      // ปิดโหมดแก้ไขของคนนั้น
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

  // โหลด Advisor เฉพาะตอนเปิดแท็บ Advisor (ประหยัด API)
  useEffect(() => {
    if (tab === 3) {
      loadAdvisorData().catch((err) => {
        console.error("โหลดข้อมูล advisor ไม่สำเร็จ", err?.response?.data || err.message);
        toast("โหลดข้อมูลที่ปรึกษาไม่สำเร็จ", "error");
      });
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
  // BACKUP (server return 501)
  // =========================
  const backupDatabase = async () => {
    try {
      const res = await api.get(`${ADMIN_BASE}/backup`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "backup.sql");
      document.body.appendChild(link);
      link.click();
      toast("เริ่มดาวน์โหลดไฟล์สำรองแล้ว", "success");
    } catch (err) {
      console.error("สำรองฐานข้อมูลล้มเหลว", err?.response?.data || err.message);
      toast("ตอนนี้ระบบ backup ผ่าน API ยังไม่เปิดใช้งาน (501)", "warning");
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

  return (
    <Box p={4}>
      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} textColor="primary" indicatorColor="primary">
        <Tab label="จัดการผู้ใช้" />
        <Tab label="จัดการรหัสนักศึกษา" />
        <Tab label="สำรองฐานข้อมูล" />
        <Tab label="จัดการที่ปรึกษา" />
      </Tabs>

      <Box mt={3}>
        {/* ===== TAB 1 ===== */}
        {tab === 0 && (
          <Card className="shadow-md">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                จัดการผู้ใช้
              </Typography>

              <form className="mb-6 space-y-4 bg-gray-50 p-4 rounded-xl shadow" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="ชื่อผู้ใช้"
                    className="border p-2 rounded"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />

                  {!editingUser && (
                    <input
                      type="password"
                      placeholder="รหัสผ่าน"
                      className="border p-2 rounded"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                  )}

                  <select
                    className="border p-2 w-full"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    required
                  >
                    <option value="">-- เลือกบทบาทผู้ใช้ --</option>
                    <option value="student">นักศึกษา</option>
                    <option value="teacher">อาจารย์</option>
                    <option value="admin">แอดมิน</option>
                    <option value="user">ผู้ใช้ทั่วไป</option>
                  </select>

                  {form.role === "student" && (
                    <input
                      type="text"
                      placeholder="รหัสนักศึกษา"
                      className="border p-2 rounded"
                      value={form.student_id}
                      onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                      required
                    />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Button type="submit" variant="contained" color="primary">
                    {editingUser ? "อัปเดตผู้ใช้" : "เพิ่มผู้ใช้"}
                  </Button>
                  {editingUser && (
                    <Button
                      type="button"
                      variant="contained"
                      color="secondary"
                      onClick={() => {
                        setEditingUser(null);
                        setForm({ username: "", password: "", role: "", student_id: "" });
                      }}
                    >
                      ยกเลิก
                    </Button>
                  )}
                </div>
              </form>

              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ชื่อผู้ใช้</TableCell>
                      <TableCell>บทบาท</TableCell>
                      <TableCell>จัดการ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div>{u.username}</div>
                          {u.student_id ? <div className="text-xs text-gray-500">{u.student_id}</div> : null}
                        </TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell>
                          <Button color="warning" onClick={() => setEditingUser(u)}>
                            แก้ไข
                          </Button>
                          <Button color="error" onClick={() => deleteUser(u.user_id)}>
                            ลบ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== TAB 2 ===== */}
        {tab === 1 && (
          <Card className="shadow-md">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                จัดการรหัสนักศึกษา (student_codes)
              </Typography>

              <div className="flex flex-col md:flex-row gap-2 mb-2">
                <textarea
                  className="border p-2 rounded w-full"
                  rows={3}
                  placeholder="วางรหัสนักศึกษาได้หลายบรรทัด หรือคั่นด้วย ,"
                  value={newCodesText}
                  onChange={(e) => setNewCodesText(e.target.value)}
                />
                <Button variant="contained" onClick={addStudentCodes}>
                  เพิ่มรหัส
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ไอดี</TableCell>
                      <TableCell>รหัสนักศึกษา</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentCodes.map((s) => (
                      <TableRow key={s.student_code_id}>
                        <TableCell>{s.student_code_id}</TableCell>
                        <TableCell>{s.student_id}</TableCell>
                        <TableCell>
                          <Button color="error" onClick={() => deleteStudentCode(s.student_code_id)}>
                            ลบ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== TAB 3 ===== */}
        {tab === 2 && (
          <Box textAlign="center" mt={8}>
            <Typography variant="h6" gutterBottom>
              สำรองฐานข้อมูลทั้งหมด
            </Typography>
            <Button variant="contained" color="primary" size="large" onClick={backupDatabase}>
              ดาวน์โหลดไฟล์สำรอง (backup.sql)
            </Button>
          </Box>
        )}

        {/* ===== TAB 4: Advisor ===== */}
        {tab === 3 && (
          <Box sx={{ maxWidth: 1200, mx: "auto", mt: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  จัดการที่ปรึกษานักศึกษา
                </Typography>

                <div className="overflow-x-auto">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ชื่อผู้ใช้</TableCell>
                        <TableCell>รหัสนักศึกษา</TableCell>
                        <TableCell>กลุ่มเรียน</TableCell>
                        <TableCell>ชั้นปี</TableCell>
                        <TableCell>อีเมล</TableCell>
                        <TableCell>ที่ปรึกษาปัจจุบัน</TableCell>
                        <TableCell>จัดการ</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {students.map((s) => {
                        const isEdit = !!editingAdvisor[s.user_id];
                        const isSaving = savingAdvisorId === s.user_id;

                        return (
                          <TableRow key={s.user_id}>
                            <TableCell>{s.username}</TableCell>
                            <TableCell>{s.student_id || "-"}</TableCell>
                            <TableCell>{s.class_group || "-"}</TableCell>
                            <TableCell>{s.level || "-"}</TableCell>
                            <TableCell>{s.email || "-"}</TableCell>

                            <TableCell>
                              {!isEdit ? (
                                <Chip
                                  label={advisorLabelOf(s.advisor_id)}
                                  size="small"
                                  variant="outlined"
                                />
                              ) : (
                                <Select
                                  size="small"
                                  value={advisorMap[s.user_id] || ""}
                                  onChange={(e) =>
                                    setAdvisorMap((prev) => ({ ...prev, [s.user_id]: e.target.value }))
                                  }
                                  displayEmpty
                                  sx={{ minWidth: 260 }}
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
                                  onClick={() =>
                                    setEditingAdvisor((prev) => ({ ...prev, [s.user_id]: true }))
                                  }
                                >
                                  แก้ไข
                                </Button>
                              ) : (
                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    variant="contained"
                                    size="small"
                                    disabled={isSaving}
                                    onClick={() => saveAdvisor(s.user_id)}
                                  >
                                    {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                                  </Button>

                                  <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={isSaving}
                                    onClick={() => {
                                      // ยกเลิก -> revert ค่า select ให้กลับไปเหมือน DB
                                      setAdvisorMap((prev) => ({
                                        ...prev,
                                        [s.user_id]: s.advisor_id || "",
                                      }));
                                      setEditingAdvisor((prev) => ({ ...prev, [s.user_id]: false }));
                                    }}
                                  >
                                    ยกเลิก
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            ไม่พบนักศึกษา
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
}