import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [form, setForm] = useState({ username: "", password: "", role: "", student_id: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [studentCodes, setStudentCodes] = useState([]);
  const [newCodesText, setNewCodesText] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchStudentCodes();
  }, []);

  // ดึงข้อมูลผู้ใช้งาน
  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:3000/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("โหลดข้อมูลผู้ใช้ล้มเหลว", err);
    }
  };

  // ดึงสถิติ (อาจไม่ใช้งานแล้ว ถ้าต้องการซ่อนการ์ด)
  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:3000/admin/stats");
      setStats(res.data || {});
    } catch (err) {
      console.error("โหลดสถิติล้มเหลว", err);
    }
  };

  const fetchStudentCodes = async () => {
    try {
      const res = await axios.get("http://localhost:3000/admin/student-codes");
      setStudentCodes(res.data || []);
    } catch (err) {
      console.error("โหลด student codes ล้มเหลว", err);
    }
  };

  // ลบผู้ใช้
  const deleteUser = async (user_id) => {
    if (!window.confirm("ยืนยันการลบผู้ใช้นี้?")) return;
    try {
      await axios.delete(`http://localhost:3000/admin/users/${user_id}`);
      fetchUsers();
    } catch (err) {
      console.error("ลบผู้ใช้ล้มเหลว", err);
    }
  };

  // สำรองฐานข้อมูล
  const backupDatabase = async () => {
    try {
      const res = await axios.get("http://localhost:3000/admin/backup", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "backup.sql");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("สำรองฐานข้อมูลล้มเหลว", err);
    }
  };

  // เพิ่ม/แก้ไขผู้ใช้
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(
          `http://localhost:3000/admin/users/${editingUser.user_id}`,
          {
            username: form.username,
            role: form.role,
          }
        );
      } else {
        await axios.post("http://localhost:3000/admin/users", form);
      }
      setForm({ username: "", password: "", role: "", student_id: "" });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error("บันทึกล้มเหลว:", err);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({ username: user.username, password: "", role: user.role, student_id: user.student_id || "" });
  };

  return (
    <div className="p-6 space-y-6">
      <Typography variant="h4" className="font-bold mb-4">
        Admin Dashboard
      </Typography>

      {/* ฟอร์ม เพิ่ม/แก้ไขผู้ใช้ */}
      <form
        className="mb-6 space-y-4 bg-yellow-50 p-4 rounded-xl shadow"
        onSubmit={handleSubmit}
      >
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
          </select>
          {/* ไม่แก้ Student ID ตอนแก้ไขผู้ใช้ ตามคำขอ */}
        </div>
        <div className="flex gap-2 mt-2">
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
                setForm({ username: "", password: "", role: "" });
              }}
            >
              ยกเลิก
            </Button>
          )}
        </div>
      </form>

      {/* จัดการ Student Codes */}
      <Card className="shadow-md">
        <CardContent>
          <Typography variant="h6" gutterBottom>จัดการรหัสนักศึกษา (student_codes)</Typography>
          <div className="flex gap-2 mb-2">
            <textarea
              className="border p-2 rounded w-full"
              rows={3}
              placeholder={"วาง Student ID ได้หลายบรรทัด หรือคั่นด้วย ,"}
              value={newCodesText}
              onChange={(e) => setNewCodesText(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  const payload = { student_ids: newCodesText };
                  await axios.post("http://localhost:3000/admin/student-codes", payload);
                  setNewCodesText("");
                  fetchStudentCodes();
                } catch (err) {
                  console.error("เพิ่ม student codes ล้มเหลว", err);
                  alert("เพิ่มรหัสนักศึกษาไม่สำเร็จ");
                }
              }}
            >เพิ่มรหัส</Button>
          </div>
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
                    <Button color="error" onClick={async () => {
                      try {
                        await axios.delete(`http://localhost:3000/admin/student-codes/${s.student_code_id}`);
                        fetchStudentCodes();
                      } catch (err) {
                        console.error("ลบ student code ล้มเหลว", err);
                        alert("ลบไม่สำเร็จ");
                      }
                    }}>ลบ</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ปุ่มสำรองฐานข้อมูล */}
      <Button variant="contained" color="primary" onClick={backupDatabase}>
        สำรองฐานข้อมูล
      </Button>

      {/* ตารางผู้ใช้ */}
      <Card className="shadow-md mt-6">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            จัดการผู้ใช้
          </Typography>
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
                    <Button color="warning" onClick={() => handleEdit(u)}>
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
        </CardContent>
      </Card>
    </div>
  );
}