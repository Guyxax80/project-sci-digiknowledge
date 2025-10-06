import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Card, CardContent, Typography, CardActions } from "@mui/material";
import Navbar from "../components/Navbar";

const Home = () => {
  const navigate = useNavigate();
  const [role] = useState(localStorage.getItem("role")?.trim().toLowerCase() || "");
  const [popularDocs, setPopularDocs] = useState([]);
  const [stats, setStats] = useState({ users: 0, documents: 0, downloads: 0, uploadsLast7Days: [], topCategories: [], usersByRole: [] });
  const [docCategoryNames, setDocCategoryNames] = useState({});

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
        .then(async (res) => {
          console.log("Recommended documents response:", res.data);
          console.log("Response length:", res.data.length);
          const docs = res.data || [];
          setPopularDocs(docs);

          // เติมชื่อหมวดหมู่ให้การ์ด (พยายามใช้ /api/documents/:id ถ้าใช้ไม่ได้ ใช้ category_names)
          try {
            const detailResults = await Promise.all(
              docs.map((doc) =>
                axios
                  .get(`http://localhost:3000/api/documents/${doc.document_id}`)
                  .then((dres) => ({ id: doc.document_id, detail: dres.data, fallback: doc }))
                  .catch(() => ({ id: doc.document_id, detail: null, fallback: doc }))
              )
            );
            const map = {};
            detailResults.forEach(({ id, detail, fallback }) => {
              let names = "-";
              const cats = detail?.categories;
              if (Array.isArray(cats) && cats.length) {
                names = cats.map((c) => c.name).join(", ");
              } else if (fallback && typeof fallback.category_names === 'string' && fallback.category_names.length) {
                names = fallback.category_names;
              }
              map[id] = names;
            });
            setDocCategoryNames(map);
          } catch (e) {
            console.warn("Unable to enrich categories for recommended docs", e);
          }
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
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardContent><Typography variant="h6">👥 ผู้ใช้งานทั้งหมด</Typography><Typography variant="h4">{stats.users}</Typography></CardContent></Card>
              <Card><CardContent><Typography variant="h6">📚 ผลงานทั้งหมด</Typography><Typography variant="h4">{stats.documents}</Typography></CardContent></Card>
              <Card><CardContent><Typography variant="h6">⬇️ ดาวน์โหลดรวม</Typography><Typography variant="h4">{stats.downloads}</Typography></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>อัปโหลด 7 วันล่าสุด</Typography>
                  <div className="space-y-2">
                    {stats.uploadsLast7Days.length === 0 ? (
                      <Typography color="text.secondary">ไม่มีข้อมูล</Typography>
                    ) : (
                      stats.uploadsLast7Days.map((r, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{new Date(r.day).toLocaleDateString('th-TH')}</span>
                          <span className="font-semibold">{r.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>หมวดหมู่ยอดนิยม</Typography>
                  <div className="space-y-2">
                    {stats.topCategories.length === 0 ? (
                      <Typography color="text.secondary">ไม่มีข้อมูล</Typography>
                    ) : (
                      stats.topCategories.map((r, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{r.category}</span>
                          <span className="font-semibold">{r.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>เอกสารยอดดาวน์โหลด</Typography>
                <div className="space-y-2">
                  {!stats.topDocuments || stats.topDocuments.length === 0 ? (
                    <Typography color="text.secondary">ไม่มีข้อมูล</Typography>
                  ) : (
                    stats.topDocuments.map((d) => (
                      <button
                        key={d.document_id}
                        className="w-full flex justify-between text-left text-sm hover:bg-gray-50 p-1 rounded"
                        onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:3000/api/admin/documents/${d.document_id}/file-downloads`);
                            const files = await res.json();
                            const list = files && files.length
                              ? files.map(f => `${f.section || 'main'} - ${(f.original_name || 'file')} : ${f.download_count}`).join('\n')
                              : 'ไม่มีไฟล์ที่มีการดาวน์โหลด';
                            alert(`ไฟล์ของ: ${d.title}\n\n${list}`);
                          } catch (e) {
                            alert('โหลดข้อมูลไฟล์ไม่สำเร็จ');
                          }
                        }}
                        title={d.title}
                      >
                        <span className="truncate max-w-[70%]">{d.title}</span>
                        <span className="font-semibold">{d.download_count}</span>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <div>
              <Button
                variant="contained"
                color="primary"
                component="a"
                href="http://localhost:3001/admin"
              >
                จัดการผู้ใช้งาน
              </Button>
            </div>
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
                        หมวดหมู่: {docCategoryNames[doc.document_id] ?? "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="mb-2">
                        คำค้นหา: {doc.keywords || "ไม่ระบุ"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="mb-2">
                        ปีการศึกษา: {doc.academic_year || "ไม่ระบุ"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="mb-2">
                        ดาวน์โหลด: {Number.isFinite(parseInt(doc.download_count)) ? parseInt(doc.download_count) : 0} ครั้ง
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="outlined"
                      onClick={() => navigate(`/document-detail/${doc.document_id}`)}
                      >
                        ดูรายละเอียด
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