import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Card, CardContent, Button } from "@mui/material";
import { API_BASE_URL } from "../config.js";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myDocs, setMyDocs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          // ดึงเอกสารของผู้ใช้
          fetch(`${API_BASE_URL}/api/documents/by-user/${data.user.user_id}`)
            .then((r) => r.json())
            .then((docs) => setMyDocs(Array.isArray(docs) ? docs : []))
            .catch((e) => console.error("Error fetching my documents:", e))
            .finally(() => setLoading(false));
          return;
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login"); // เปลี่ยนเป็นหน้า login ของคุณ
  };

  if (loading) return <p className="p-4">กำลังโหลด...</p>;

  if (!user)
    return (
      <div className="p-4 text-center">
        <p>ยังไม่ได้เข้าสู่ระบบ</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto mt-20 p-6">
      <Card className="mb-6">
        <CardContent>
          <Typography variant="h5" className="mb-2">โปรไฟล์ผู้ใช้งาน</Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>Username: <strong>{user.username}</strong></div>
            <div>Role: <strong>{user.role}</strong></div>
            <div>Student ID: <strong>{user.student_id || "-"}</strong></div>
            <div>Class Group: <strong>{user.class_group || "-"}</strong></div>
            <div>Level: <strong>{user.level || "-"}</strong></div>
          </div>
          <div className="mt-4">
            <Button variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
          </div>
        </CardContent>
      </Card>

      <Typography variant="h6" className="mb-3">ผลงานที่ฉันอัปโหลด</Typography>
      {myDocs.length === 0 ? (
        <Typography color="text.secondary">ยังไม่มีผลงานที่อัปโหลด</Typography>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myDocs.map((doc) => (
            <Card key={doc.document_id} className="">
              <CardContent>
                <Typography variant="subtitle1" className="font-semibold">{doc.title}</Typography>
                <Typography variant="body2" color="text.secondary">หมวดหมู่: {doc.category_names || "-"}</Typography>
                <Typography variant="body2" color="text.secondary">คำค้นหา: {doc.keywords || "-"}</Typography>
                <Typography variant="body2" color="text.secondary">ปีการศึกษา: {doc.academic_year || "-"}</Typography>
                <Typography variant="body2" color="text.secondary">สถานะ: {doc.status || '-'}</Typography>
                <Typography variant="body2" color="text.secondary">ดาวน์โหลด: {doc.download_count || 0} ครั้ง</Typography>
                <div className="mt-2 flex gap-2">
                  <Button size="small" variant="outlined" onClick={() => navigate(`/document-detail/${doc.document_id}`)}>ดูรายละเอียด</Button>
                  {doc.status === 'draft' && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={async () => {
                        try {
                          const userId = user?.user_id;
                          const res = await fetch(`${API_BASE_URL}/api/documents/${doc.document_id}/publish`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: userId })
                          });
                          const data = await res.json();
                          if (!res.ok || !data.success) {
                            alert(data.message || 'เผยแพร่ไม่สำเร็จ');
                            return;
                          }
                          // refresh myDocs
                          const r = await fetch(`${API_BASE_URL}/api/documents/by-user/${userId}`);
                          const docs = await r.json();
                          setMyDocs(Array.isArray(docs) ? docs : []);
                        } catch (e) {
                          console.error(e);
                          alert('เกิดข้อผิดพลาด');
                        }
                      }}
                    >
                      เผยแพร่
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Profile;