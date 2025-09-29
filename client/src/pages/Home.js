import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Card, CardContent, Typography, CardActions } from "@mui/material";
import Navbar from "../components/Navbar";

const Home = () => {
  const navigate = useNavigate();
  const [role] = useState(localStorage.getItem("role")?.trim().toLowerCase() || "");
  const [popularDocs, setPopularDocs] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    console.log("Role:", role);
    if (role === "student" || role === "teacher") {
      // ทดสอบ API ก่อน
      console.log("Testing API connection...");
      axios
        .get("http://localhost:3000/api/documents/test")
        .then((res) => {
          console.log("Test API response:", res.data);
          
          // ถ้า API ทำงานได้ ให้ดึงข้อมูลจริง
          console.log("Fetching recommended documents...");
          return axios.get("http://localhost:3000/api/documents/recommended");
        })
        .then((res) => {
          console.log("Recommended documents response:", res.data);
          console.log("Response length:", res.data.length);
          setPopularDocs(res.data);
        })
        .catch((err) => {
          console.error("Error fetching recommended documents:", err);
          console.error("Error details:", err.response?.data);
        });
    }

    if (role === "admin") {
      axios
        .get("http://localhost:3000/api/admin/stats")
        .then((res) => setStats(res.data))
        .catch((err) => console.error(err));
    }
  }, [role]);

  return (
    <div>
      <Navbar />

      <div className="p-6 mt-16 max-w-7xl mx-auto">
        <Typography variant="h4" gutterBottom>
          ยินดีต้อนรับ{" "}
          {role === "student"
            ? "นักศึกษา"
            : role === "teacher"
            ? "อาจารย์"
            : role === "admin"
            ? "ผู้ดูแลระบบ"
            : ""}
        </Typography>

        {/* ================= Student & Teacher Actions ================= */}
        {(role === "student" || role === "teacher") && (
          <div className="mb-8">
            <Button
              variant="contained"
              color={role === "student" ? "primary" : "secondary"}
              onClick={() =>
                role === "student" ? navigate("/upload") : navigate("/reviews")
              }
              sx={{ mb: 4 }}
            >
              {role === "student" ? "อัปโหลดผลงานใหม่" : "ตรวจสอบผลงานนักศึกษา"}
            </Button>
          </div>
        )}

        {/* ================= Admin Stats ================= */}
        {role === "admin" && (
          <div className="flex gap-4 mb-8 flex-wrap">
            <Card className="flex-1 min-w-[200px]">
              <CardContent>
                <Typography variant="h6">👥 ผู้ใช้งานทั้งหมด</Typography>
                <Typography variant="body1">{stats.users} คน</Typography>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent>
                <Typography variant="h6">📚 ผลงานทั้งหมด</Typography>
                <Typography variant="body1">{stats.documents} รายการ</Typography>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent>
                <Typography variant="h6">⬇️ ดาวน์โหลดรวม</Typography>
                <Typography variant="body1">{stats.downloads} ครั้ง</Typography>
              </CardContent>
            </Card>

            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/admin/users")}
            >
              จัดการผู้ใช้งาน
            </Button>
          </div>
        )}

        {/* ================= Recommended Documents ================= */}
        {(role === "student" || role === "teacher") && (
          <div>
            <Typography variant="h5" gutterBottom className="mb-4">
              🌟 ผลงานล่าสุด
            </Typography>
            
            {popularDocs.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                ยังไม่มีผลงานที่อัปโหลด
              </Typography>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularDocs.map((doc) => (
                  <Card
                    key={doc.document_id}
                    className="shadow-lg hover:shadow-2xl transition rounded-xl"
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom className="line-clamp-2">
                        {doc.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="mb-2">
                        โดย: User ID {doc.user_id || "ไม่ระบุ"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="mb-2">
                        ปีการศึกษา: {doc.academic_year}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="mb-2">
                        หมวดหมู่: {doc.section || "อื่นๆ"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="mb-2">
                        ไฟล์: {doc.original_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        อัปโหลด: {new Date(doc.uploaded_at).toLocaleDateString('th-TH')}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/documents/${doc.document_id}`)}
                      >
                        ดูรายละเอียด
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        href={`http://localhost:3000/files/download/${doc.document_id}`}
                      >
                        ดาวน์โหลด
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
