import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import api from "../services/api";

const ADMIN_BASE = "/api/admin"; // ✅ ให้ใช้ตัวเดียวทั้งไฟล์

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "", student_id: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [studentCodes, setStudentCodes] = useState([]);
  const [newCodesText, setNewCodesText] = useState("");
  const [stats, setStats] = useState(null);

    const fetchStats = async () => {
  try {
    const res = await api.get(`${ADMIN_BASE}/stats`, { params: { days: 7 } });
    setStats(res.data);
  } catch (err) {
    console.error("โหลด stats ล้มเหลว", err?.response?.data || err.message);
    setStats(null);
  }
};

useEffect(() => {
  fetchUsers();
  fetchStudentCodes();
  fetchStats();
}, []);

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

  // ✅ ดึงข้อมูลผู้ใช้
  const fetchUsers = async () => {
    try {
      const res = await api.get(`${ADMIN_BASE}/users`);
      setUsers(res.data || []);
    } catch (err) {
      console.error("โหลดข้อมูลผู้ใช้ล้มเหลว", err?.response?.data || err.message);
    }
  };



  // ✅ ดึง Student Codes (ต้องเป็น GET)
  const fetchStudentCodes = async () => {
    try {
      const res = await api.get(`${ADMIN_BASE}/student-codes`);
      setStudentCodes(res.data || []);
    } catch (err) {
      console.error("โหลด student codes ล้มเหลว", err?.response?.data || err.message);
      setStudentCodes([]);
    }
  };

  // ✅ เพิ่ม / แก้ไข ผู้ใช้
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`${ADMIN_BASE}/users/${editingUser.user_id}`, {
          username: form.username,
          role: form.role,
          student_id: form.student_id || null, // ✅ ส่งไปด้วย เผื่อ role=student ต้องมี student_id
        });
      } else {
        await api.post(`${ADMIN_BASE}/users`, {
          username: form.username,
          password: form.password,
          role: form.role,
          student_id: form.student_id || null,
        });
      }

      setForm({ username: "", password: "", role: "", student_id: "" });
      setEditingUser(null);
      fetchUsers();
      fetchStudentCodes(); // เผื่อเพิ่ม student_id แล้วไป insert student_codes ด้วย
    } catch (err) {
      console.error("บันทึกล้มเหลว:", err?.response?.data || err.message);
      alert(err?.response?.data?.error || "บันทึกไม่สำเร็จ");
    }
  };

  // ✅ ลบผู้ใช้
  const deleteUser = async (user_id) => {
    if (!window.confirm("ยืนยันการลบผู้ใช้นี้?")) return;
    try {
      await api.delete(`${ADMIN_BASE}/users/${user_id}`);
      fetchUsers();
    } catch (err) {
      console.error("ลบผู้ใช้ล้มเหลว", err?.response?.data || err.message);
      alert(err?.response?.data?.error || "ลบผู้ใช้ไม่สำเร็จ");
    }
  };

  // ✅ สำรองฐานข้อมูล (route นี้ใน server return 501 อยู่แล้ว)
  const backupDatabase = async () => {
    try {
      const res = await api.get(`${ADMIN_BASE}/backup`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "backup.sql");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("สำรองฐานข้อมูลล้มเหลว", err?.response?.data || err.message);
      alert("ตอนนี้ระบบ backup ผ่าน API ยังไม่เปิดใช้งาน (501)");
    }
  };

  // ✅ เพิ่ม Student Code (server รับ student_ids)
  const addStudentCodes = async () => {
    try {
      const payload = { student_ids: newCodesText };
      await api.post(`${ADMIN_BASE}/student-codes`, payload);
      setNewCodesText("");
      fetchStudentCodes();
    } catch (err) {
      console.error("เพิ่ม student codes ล้มเหลว", err?.response?.data || err.message);
      alert(err?.response?.data?.error || "เพิ่มรหัสนักศึกษาไม่สำเร็จ");
    }
  };

  // ✅ ลบ Student Code
  const deleteStudentCode = async (id) => {
    if (!window.confirm("ยืนยันการลบ?")) return;
    try {
      await api.delete(`${ADMIN_BASE}/student-codes/${id}`);
      fetchStudentCodes();
    } catch (err) {
      console.error("ลบ student code ล้มเหลว", err?.response?.data || err.message);
      alert(err?.response?.data?.error || "ลบไม่สำเร็จ");
    }
  };

  return (
    <Box p={4}>
      <Tabs
        value={tab}
        onChange={(e, newValue) => setTab(newValue)}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="จัดการผู้ใช้" />
        <Tab label="จัดการรหัสนักศึกษา" />
        <Tab label="สำรองฐานข้อมูล" />
      </Tabs>

      <Box mt={3}>
        {/* TAB 1 */}
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
                    placeholder="Username"
                    className="border p-2 rounded"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />

                  {!editingUser && (
                    <input
                      type="password"
                      placeholder="Password"
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

                  {/* ✅ ให้กรอก student_id เมื่อ role = student */}
                  {form.role === "student" && (
                    <input
                      type="text"
                      placeholder="Student ID"
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
                          {u.student_id ? (
                            <div className="text-xs text-gray-500">{u.student_id}</div>
                          ) : null}
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

        {/* TAB 2 */}
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
                  placeholder="วาง Student ID ได้หลายบรรทัด หรือคั่นด้วย ,"
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
                      <TableCell>ID</TableCell>
                      <TableCell>Student ID</TableCell>
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

        {/* TAB 3 */}
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
      </Box>
    </Box>
  );
}