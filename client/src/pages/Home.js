import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, Typography, CardActions } from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Legend , Cell
} from "recharts";
import api from "../services/api";


const Home = () => {
  const navigate = useNavigate();
  const [role] = useState(localStorage.getItem("role")?.trim().toLowerCase() || "");
  const [popularDocs, setPopularDocs] = useState([]);
  const [stats] = useState({ users: 0, documents: 0, downloads: 0, uploadsLast7Days: [], topCategories: [], usersByRole: [] });
  const [docCategoryNames, setDocCategoryNames] = useState({});

  useEffect(() => {
  let cancelled = false;

  const run = async () => {
    console.log("Role:", role);
    if (!(role === "student" || role === "teacher")) return;

    try {
      console.log("Testing API connection...");
      const testRes = await api.get("/api/documents/test");
      console.log("Test API response:", testRes.data);

      console.log("Fetching recommended documents...");
      let recRes;
      try {
        recRes = await api.get("/api/documents/recommended");
      } catch (e) {
        console.warn("recommended failed, fallback to /api/documents", e?.response?.data || e.message);
        recRes = await api.get("/api/documents");
      }

      const docs = Array.isArray(recRes.data) ? recRes.data : [];
      console.log("Docs length:", docs.length);

      if (cancelled) return;
      setPopularDocs(docs);

      // เติมชื่อหมวดหมู่ให้การ์ด
      try {
        const detailResults = await Promise.all(
          docs.map((doc) =>
            api
              .get(`/api/documents/${doc.document_id}`)
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
          } else if (fallback?.category_names) {
            names = fallback.category_names;
          }
          map[id] = names;
        });

        if (!cancelled) setDocCategoryNames(map);
      } catch (e) {
        console.warn("Unable to enrich categories for recommended docs", e);
      }
    } catch (err) {
      console.error("Home load error:", err);
      console.error("Error details:", err?.response?.data);
      if (!cancelled) setPopularDocs([]); // กันหน้าแตก
    }
  };

  run();

  return () => {
    cancelled = true;
  };
}, [role]);

  return (
    <div>

      <div className="p-6 max-w-7xl mx-auto">
        <Typography variant="h4" gutterBottom className="text-brand-800">
          ยินดีต้อนรับ{" "}
          {role === "student"
            ? "นักศึกษา"
            : role === "teacher"
            ? "อาจารย์"
            : role === "admin"
            ? "ผู้ดูแลระบบ"
            : ""}
        </Typography>

        {/* ================= Student Actions ================= */}
        {(role === "student") && (
          <div className="mb-8">
            <Button
              variant="contained"
              color={role === "student" ? "primary" : "secondary"}
              onClick={() =>
                role === "student" ? navigate("/upload") : navigate("/document")
              }
              sx={{ mb: 4 }}
            >
              {role === "student" ? "อัปโหลดผลงานใหม่" : "ตรวจสอบผลงานนักศึกษา"}
            </Button>
          </div>
        )}

        {/* ================= Admin Stats ================= */}
{role === "admin" && (
  <div className="space-y-8 mb-12">
    <Typography variant="h5" gutterBottom className="text-brand-800">
      📊 แดชบอร์ดผู้ดูแลระบบ
    </Typography>

    {/* KPI CARDS */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-md">
        <CardContent>
          <Typography variant="h6">👥 ผู้ใช้งานทั้งหมด</Typography>
          <Typography variant="h4" className="font-bold text-indigo-700">{stats.users}</Typography>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-md">
        <CardContent>
          <Typography variant="h6">📚 ผลงานทั้งหมด</Typography>
          <Typography variant="h4" className="font-bold text-purple-700">{stats.documents}</Typography>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-pink-50 to-pink-100 shadow-md">
        <CardContent>
          <Typography variant="h6">⬇️ ดาวน์โหลดรวม</Typography>
          <Typography variant="h4" className="font-bold text-pink-700">{stats.downloads}</Typography>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-md">
        <CardContent>
          <Typography variant="h6">📅 อัปโหลดใน 7 วันล่าสุด</Typography>
          <Typography variant="h4" className="font-bold text-green-700">
            {stats.uploadsLast7Days?.reduce((a, b) => a + (b.count || 0), 0) || 0}
          </Typography>
        </CardContent>
      </Card>
    </div>

    {/* CHARTS SECTION */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* BAR CHART - Uploads */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>📈 การอัปโหลดใน 7 วันที่ผ่านมา</Typography>
          {stats.uploadsLast7Days?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.uploadsLast7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={(d) => new Date(d).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}/>
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography color="text.secondary">ไม่มีข้อมูลการอัปโหลด</Typography>
          )}
        </CardContent>
      </Card>

      {/* PIE CHART - Categories */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>🥇 หมวดหมู่ยอดนิยม</Typography>
          {stats.topCategories?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
  <Pie
    data={stats.topCategories}
    dataKey="count"
    nameKey="category"
    outerRadius={100}
    label
  >
    {stats.topCategories.map((entry, index) => (
      <Cell
        key={`cell-${index}`}
        fill={[
          "#8884d8", // ม่วง
          "#82ca9d", // เขียว
          "#ffc658", // เหลือง
          "#ff7f50", // ส้ม
          "#0088FE", // ฟ้า
          "#d45087", // ชมพู
          "#a0d911", // เขียวอ่อน
          "#00C49F", // เขียวมรกต
        ][index % 8]} // ใช้สีวนไปเรื่อยๆ
      />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>

            </ResponsiveContainer>
          ) : (
            <Typography color="text.secondary">ไม่มีข้อมูลหมวดหมู่</Typography>
          )}
        </CardContent>
      </Card>
    </div>

    {/* TOP DOCUMENTS */}
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>🏆 เอกสารยอดดาวน์โหลด</Typography>
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
                    const res = await api.get(`/api/admin/documents/${d.document_id}/file-downloads`);
                    const files = res.data;
                    const list = files && files.length
                      ? files.map(f => `${f.section || 'main'} - ${(f.original_name || 'file')} : ${f.download_count}`).join('\n')
                      : 'ไม่มีไฟล์ที่มีการดาวน์โหลด';
                    alert(`ไฟล์ของ: ${d.title}\n\n${list}`);
                  } catch (e) {
                    alert('โหลดข้อมูลไฟล์ไม่สำเร็จ');
                  }
                }}
              >
                <span className="truncate max-w-[70%]">{d.title}</span>
                <span className="font-semibold">{d.download_count}</span>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>


  </div>
)}


        {/* ================= Recommended Documents ================= */}
        {(role === "student" || role === "teacher") && (
          <div>
            <Typography variant="h5" gutterBottom className="mb-4 text-brand-700">
              🌟 ผลงานยอดนิยม
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
                    className="shadow-lg hover:shadow-2xl transition rounded-xl border border-brand-100/70"
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom className="line-clamp-2 text-brand-800">
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