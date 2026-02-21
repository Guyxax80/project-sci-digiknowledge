import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, Typography, CardActions } from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Legend, Cell
} from "recharts";
import api from "../services/api";

const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7f50",
  "#0088FE", "#d45087", "#a0d911", "#00C49F",
];

const getRoleFromStorage = () => {
  const raw = localStorage.getItem("role");
  return (raw || "").trim().toLowerCase();
};

const Home = () => {
  const navigate = useNavigate();

  // ✅ ให้ role อัปเดตได้ (ไม่ล็อกไว้ครั้งเดียว)
  const [role, setRole] = useState(getRoleFromStorage());

  const [popularDocs, setPopularDocs] = useState([]);
  const [docCategoryNames, setDocCategoryNames] = useState({});

  // ✅ ใส่ setStats ด้วย
  const [stats, setStats] = useState({
    users: 0,
    documents: 0,
    downloads: 0,
    uploadCount7d: 0,          // ✅ เพิ่ม
    uploadsLast7Days: [],
    topCategories: [],
    usersByRole: [],
    topDocuments: [],
  });

  // ถ้า role ใน localStorage เปลี่ยน (เช่น login/logout) ให้หน้า Home อัปเดต
  useEffect(() => {
    const onStorage = () => setRole(getRoleFromStorage());
    window.addEventListener("storage", onStorage);

    // เผื่อกรณี set localStorage ใน tab เดียวกันแล้วไม่ยิง storage event
    const id = setInterval(() => {
      const r = getRoleFromStorage();
      setRole(prev => (prev === r ? prev : r));
    }, 800);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(id);
    };
  }, []);

  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";
  const isLoggedIn = useMemo(() => isStudent || isTeacher || isAdmin, [isStudent, isTeacher, isAdmin]);

  // =========================
  // 1) โหลดเอกสารยอดนิยม / แนะนำ
  // =========================
  useEffect(() => {
    let cancelled = false;

    const fetchDocs = async () => {
      try {
        // ✅ ถ้า login เป็น student/teacher → recommended ก่อน
        // ✅ ถ้า guest/admin → ใช้ documents ธรรมดา (ให้เห็นรายการได้)
        let res;

        if (isStudent || isTeacher) {
          try {
            res = await api.get("/api/documents/recommended");
          } catch (e) {
            console.warn("recommended failed, fallback /api/documents", e?.response?.data || e.message);
            res = await api.get("/api/documents");
          }
        } else {
          // guest หรือ admin ให้ดู list ได้
          res = await api.get("/api/documents");
        }

        const docs = Array.isArray(res.data) ? res.data : [];
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
          console.warn("Unable to enrich categories", e);
        }
      } catch (err) {
        console.error("Home docs load error:", err?.response?.data || err.message);
        if (!cancelled) setPopularDocs([]);
      }
    };

    fetchDocs();
    return () => { cancelled = true; };
  }, [isStudent, isTeacher, isAdmin]);

  // =========================
  // 2) โหลดสถิติสำหรับ Admin
  // =========================
  useEffect(() => {
    let cancelled = false;

const fetchAdminStats = async () => {
  if (!isAdmin) return;

  try {
    const res = await api.get("/api/admin/stats", { params: { days: 7 } });
    const d = res.data || {};

    // ✅ server ส่ง uploads7dSeries: [{ date, count }]
    const uploadsLast7Days = Array.isArray(d.uploads7dSeries)
      ? d.uploads7dSeries.map((x) => ({
          day: x.date, // ให้ตรงกับกราฟที่ใช้ dataKey="day"
          count: Number(x.count || 0),
        }))
      : [];

    // ✅ server ส่ง topCategories: [{ category_name, count }]
    const topCategories = Array.isArray(d.topCategories)
      ? d.topCategories.map((c) => ({
          category:
            c.category ??
            c.category_name ??
            c.name ??
            c.categoryTitle ??
            `#${c.category_id ?? ""}`,
          count: Number(c.count ?? c.total ?? c.value ?? 0),
        }))
      : [];

    const next = {
      users: Number(d.users || 0),
      documents: Number(d.documents || 0),
      downloads: Number(d.downloads || 0),

      // ✅ ใช้ตัวนี้โชว์ KPI ได้เลย
      uploadCount7d: Number(d.uploadCount7d || 0),

      uploadsLast7Days,
      topCategories,
      usersByRole: Array.isArray(d.usersByRole) ? d.usersByRole : [],
      topDocuments: Array.isArray(d.topDocuments) ? d.topDocuments : [],
    };

    if (!cancelled) setStats(next);
  } catch (err) {
    console.error("Admin stats load error:", err?.response?.data || err.message);
    if (!cancelled) {
      setStats((prev) => ({
        ...prev,
        uploadCount7d: 0,
        uploadsLast7Days: [],
        topCategories: [],
      }));
    }
  }
};

    fetchAdminStats();
    return () => { cancelled = true; };
  }, [isAdmin]);

  return (
    <div>
      <div className="p-6 max-w-7xl mx-auto">
        <Typography variant="h4" gutterBottom className="text-brand-800">
          ยินดีต้อนรับ{" "}
          {isStudent ? "นักศึกษา" : isTeacher ? "อาจารย์" : isAdmin ? "ผู้ดูแลระบบ" : "ผู้เยี่ยมชม"}
        </Typography>

        {/* ===== Guest CTA ===== */}
        {!isLoggedIn && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Button variant="contained" onClick={() => navigate("/login")}>
              เข้าสู่ระบบ
            </Button>
            <Button variant="outlined" onClick={() => navigate("/signup")}>
              สมัครสมาชิก
            </Button>
          </div>
        )}

        {/* ================= Student Actions ================= */}
        {isStudent && (
          <div className="mb-8">
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/upload")}
              sx={{ mb: 4 }}
            >
              อัปโหลดผลงานใหม่
            </Button>
          </div>
        )}

        {/* ================= Admin Stats ================= */}
        {isAdmin && stats &&  (
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
                    {stats.uploadCount7d ?? 0}
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
                        <XAxis
                          dataKey="day"
                          tickFormatter={(d) =>
                            new Date(d).toLocaleDateString("th-TH", { month: "short", day: "numeric" })
                          }
                        />
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
                          {stats.topCategories.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                              ? files.map(f => `${f.section || "main"} - ${(f.original_name || "file")} : ${f.download_count}`).join("\n")
                              : "ไม่มีไฟล์ที่มีการดาวน์โหลด";
                            alert(`ไฟล์ของ: ${d.title}\n\n${list}`);
                          } catch (e) {
                            alert("โหลดข้อมูลไฟล์ไม่สำเร็จ");
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

        {/* ================= Recommended Documents (ทุกคนเห็นได้) ================= */}
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
      </div>
    </div>
  );
};

export default Home;