import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, Typography } from "@mui/material";
import Navbar from "../components/Navbar";
import api from "../services/api";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [studentDocs, setStudentDocs] = useState([]);
  const [stats, setStats] = useState({}); // ข้อมูลสรุปสำหรับครู เช่น จำนวนผลงานรอตรวจ

  useEffect(() => {
    // โหลดผลงานนักศึกษาที่ครูต้องตรวจสอบ
    api.get("/api/teacher/documents")
      .then(res => setStudentDocs(res.data))
      .catch(err => console.error(err));

    // โหลดสถิติสำหรับครู (เช่น จำนวนผลงานรอตรวจ)
    api.get("/api/teacher/stats")
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <Navbar />

      <div className="p-6 mt-16">
        <Typography variant="h4" gutterBottom>
          แดชบอร์ดครู
        </Typography>

        {/* สถิติ */}
        <div className="flex gap-4 mb-6">
          <Card>
            <CardContent>
              <Typography variant="h6">📄 ผลงานรอตรวจ</Typography>
              <Typography variant="body1">{stats.pending || 0} รายการ</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6">✅ ตรวจแล้ว</Typography>
              <Typography variant="body1">{stats.reviewed || 0} รายการ</Typography>
            </CardContent>
          </Card>
        </div>

        {/* รายการผลงานนักศึกษา */}
        <Typography variant="h6" className="mb-2">📚 ผลงานนักศึกษา</Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentDocs.map(doc => (
            <Card key={doc.id}>
              <CardContent>
                <Typography variant="h6">{doc.title}</Typography>
                <Typography variant="body2">ผู้ส่ง: {doc.studentName}</Typography>
                <Typography variant="body2">สถานะ: {doc.status}</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  className="mt-2"
                  onClick={() => navigate(`/teacher/review/${doc.id}`)}
                >
                  ตรวจสอบ
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
