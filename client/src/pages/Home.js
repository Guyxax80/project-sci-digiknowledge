// client/src/pages/Home.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  Typography,
  CardActions,
  Box,
  Divider,
  Stack,
  Chip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  Cell,
} from "recharts";
import api from "../services/api";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7f50",
  "#0088FE",
  "#d45087",
  "#a0d911",
  "#00C49F",
];

const getRoleFromStorage = () => {
  const raw = localStorage.getItem("role");
  return (raw || "").trim().toLowerCase();
};

// ===== UI helpers (ตกแต่งอย่างเดียว) =====
const RoleBadge = ({ role }) => {
  const r = (role || "").toLowerCase();
  const map = {
    student: { label: "นักศึกษา", color: "success" },
    teacher: { label: "อาจารย์", color: "warning" },
    admin: { label: "ผู้ดูแลระบบ", color: "error" },
  };
  const m = map[r] || { label: "ผู้เยี่ยมชม", color: "default" };
  return (
    <Chip
      size="small"
      label={m.label}
      color={m.color}
      variant={m.color === "default" ? "outlined" : "filled"}
    />
  );
};

const StatCard = ({ title, value, tone = "indigo", subtitle }) => {
  // ใช้ tailwind gradient แบบเดิมของคุณ (ไม่เพิ่ม dependency)
  const toneClass =
    tone === "indigo"
      ? "from-indigo-50 to-indigo-100"
      : tone === "purple"
      ? "from-purple-50 to-purple-100"
      : tone === "pink"
      ? "from-pink-50 to-pink-100"
      : tone === "green"
      ? "from-green-50 to-green-100"
      : "from-slate-50 to-slate-100";

  const valueClass =
    tone === "indigo"
      ? "text-indigo-700"
      : tone === "purple"
      ? "text-purple-700"
      : tone === "pink"
      ? "text-pink-700"
      : tone === "green"
      ? "text-green-700"
      : "text-slate-700";

  return (
    <Card className={`bg-gradient-to-br ${toneClass} shadow-md rounded-2xl border border-black/5`}>
      <CardContent>
        <Typography variant="body2" className="opacity-80">
          {title}
        </Typography>
        <Typography variant="h4" className={`font-black ${valueClass}`}>
          {value}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" className="opacity-70">
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(getRoleFromStorage());

  const [popularDocs, setPopularDocs] = useState([]);
  const [docCategoryNames, setDocCategoryNames] = useState({});

  const [stats, setStats] = useState({
    users: 0,
    documents: 0,
    downloads: 0,
    uploadCount7d: 0,
    uploadsLast7Days: [],
    topCategories: [],
    usersByRole: [],
    topDocuments: [],
  });

  // ✅ ใหม่: เก็บเฉพาะ topDocuments ที่ "มีไฟล์ย่อยที่ยอดดาวน์โหลด > 0"
  const [topDocsFiltered, setTopDocsFiltered] = useState([]);
  const [topDocsLoading, setTopDocsLoading] = useState(false);

  useEffect(() => {
    const onStorage = () => setRole(getRoleFromStorage());
    window.addEventListener("storage", onStorage);

    const id = setInterval(() => {
      const r = getRoleFromStorage();
      setRole((prev) => (prev === r ? prev : r));
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

  // 1) docs
  useEffect(() => {
    let cancelled = false;

    const fetchDocs = async () => {
      try {
        let res;

        if (isStudent || isTeacher) {
          try {
            res = await api.get("/documents/recommended");
          } catch (e) {
            res = await api.get("/documents");
          }
        } else {
          res = await api.get("/documents");
        }

        const docs = Array.isArray(res.data) ? res.data : [];
        if (cancelled) return;

        setPopularDocs(docs);

        try {
          const detailResults = await Promise.all(
            docs.map((doc) =>
              api
                .get(`/documents/${doc.document_id}`)
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
        } catch {
          if (!cancelled) setDocCategoryNames({});
        }
      } catch (err) {
        console.error("Home docs load error:", err?.response?.data || err.message);
        if (!cancelled) setPopularDocs([]);
      }
    };

    fetchDocs();
    return () => {
      cancelled = true;
    };
  }, [isStudent, isTeacher, isAdmin]);

  // 2) stats admin
  useEffect(() => {
    let cancelled = false;

    const fetchAdminStats = async () => {
      if (!isAdmin) return;

      try {
        const res = await api.get("/admin/stats", { params: { days: 7 } });
        const d = res.data || {};

        const uploadsLast7Days = Array.isArray(d.uploads7dSeries)
          ? d.uploads7dSeries.map((x) => ({
              day: x.date,
              count: Number(x.count || 0),
            }))
          : [];

        const topCategories = Array.isArray(d.topCategories)
          ? d.topCategories.map((c) => ({
              category: c.category_name ?? c.name ?? c.category ?? "-",
              count: Number(c.count ?? 0),
            }))
          : [];

        const next = {
          users: Number(d.users || 0),
          documents: Number(d.documents || 0),
          downloads: Number(d.downloads || 0),
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
            usersByRole: [],
            topDocuments: [],
          }));
        }
      }
    };

    fetchAdminStats();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  // ✅ 3) กรอง "เอกสารยอดดาวน์โหลด" ให้เหลือเฉพาะเอกสารที่มีไฟล์ย่อย download_count > 0
  useEffect(() => {
    let cancelled = false;

    const filterTopDocsByDownloadedFiles = async () => {
      if (!isAdmin) return;

      const docs = Array.isArray(stats.topDocuments) ? stats.topDocuments : [];
      if (docs.length === 0) {
        setTopDocsFiltered([]);
        return;
      }

      setTopDocsLoading(true);

      try {
        const results = await Promise.all(
          docs.map(async (d) => {
            try {
              const res = await api.get(`/admin/documents/${d.document_id}/file-downloads`);
              const files = Array.isArray(res.data) ? res.data : [];
              const hasDownloadedFile = files.some((f) => Number(f.download_count || 0) > 0);
              return hasDownloadedFile ? d : null;
            } catch {
              // ถ้าโหลดไฟล์ย่อยไม่ได้ ให้ตัดออกเพื่อ "ชัวร์ว่าต้องมี >0"
              return null;
            }
          })
        );

        const filtered = results.filter(Boolean);
        if (!cancelled) setTopDocsFiltered(filtered);
      } finally {
        if (!cancelled) setTopDocsLoading(false);
      }
    };

    filterTopDocsByDownloadedFiles();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, stats.topDocuments]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "rgba(0,0,0,.02)",
        py: 4,
        px: { xs: 2, md: 0 },
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* ===== Header / Hero ===== */}
        <Card className="rounded-3xl border border-black/5 shadow-lg overflow-hidden">
          <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ md: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h4" className="font-black text-brand-800">
                  ยินดีต้อนรับ{" "}
                  {isStudent ? "นักศึกษา" : isTeacher ? "อาจารย์" : isAdmin ? "ผู้ดูแลระบบ" : "ผู้เยี่ยมชม"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
                  ศูนย์รวมเอกสาร/ผลงาน พร้อมสรุปสถิติและเอกสารยอดนิยม
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <RoleBadge role={role} />
                {!isLoggedIn ? (
                  <>
                    <Button variant="contained" onClick={() => navigate("/login")}>
                      เข้าสู่ระบบ
                    </Button>
                    <Button variant="outlined" onClick={() => navigate("/signup")}>
                      สมัครสมาชิก
                    </Button>
                  </>
                ) : null}

                {isStudent ? (
                  <Button variant="contained" color="primary" onClick={() => navigate("/upload")}>
                    อัปโหลดผลงานใหม่
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </div>
        </Card>

        {/* ===== Admin Dashboard ===== */}
        {isAdmin && (
          <div className="mt-6 space-y-8">
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="h5" className="text-brand-800 font-black">
                📊 แดชบอร์ดผู้ดูแลระบบ
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                สรุปข้อมูลภาพรวมในช่วง 7 วันล่าสุด
              </Typography>
            </Stack>

            {/* KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="👥 ผู้ใช้งานทั้งหมด" value={stats.users} tone="indigo" />
              <StatCard title="📚 ผลงานทั้งหมด" value={stats.documents} tone="purple" />
              <StatCard title="⬇️ ดาวน์โหลดรวม" value={stats.downloads} tone="pink" />
              <StatCard title="📅 อัปโหลดใน 7 วันล่าสุด" value={stats.uploadCount7d ?? 0} tone="green" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-2xl border border-black/5 shadow-md">
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" className="font-black">
                      📈 การอัปโหลดใน 7 วันที่ผ่านมา
                    </Typography>
                    <Chip size="small" label="Uploads / Day" variant="outlined" />
                  </Stack>
                  <Divider className="my-2" />
                  {stats.uploadsLast7Days?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
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
                        <Bar dataKey="count" fill="#8884d8" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary">ไม่มีข้อมูลการอัปโหลด</Typography>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-black/5 shadow-md">
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" className="font-black">
                      🥇 หมวดหมู่ยอดนิยม
                    </Typography>
                    <Chip size="small" label="Top Categories" variant="outlined" />
                  </Stack>
                  <Divider className="my-2" />
                  {stats.topCategories?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie data={stats.topCategories} dataKey="count" nameKey="category" outerRadius={105} label>
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

            {/* Top documents */}
            <Card className="rounded-2xl border border-black/5 shadow-md">
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
                  <Typography variant="h6" className="font-black">
                    🏆 เอกสารยอดดาวน์โหลด
                  </Typography>
                  <Chip size="small" label="Click เพื่อดูไฟล์ย่อย" variant="outlined" />
                </Stack>
                <Divider className="my-2" />

                <div className="space-y-2">
                  {topDocsLoading ? (
                    <Typography color="text.secondary">กำลังตรวจสอบไฟล์ย่อยของเอกสาร...</Typography>
                  ) : !topDocsFiltered || topDocsFiltered.length === 0 ? (
                    <Typography color="text.secondary">ไม่มีเอกสารที่มีไฟล์ย่อยถูกดาวน์โหลด</Typography>
                  ) : (
                    topDocsFiltered.map((d) => (
                      <button
                        key={d.document_id}
                        className="w-full flex items-center justify-between text-left text-sm hover:bg-black/[0.03] p-3 rounded-xl border border-black/5 transition"
                        onClick={async () => {
                          try {
                            const res = await api.get(`/admin/documents/${d.document_id}/file-downloads`);
                            const files = Array.isArray(res.data) ? res.data : [];

                            // ✅ แสดงเฉพาะไฟล์ที่ download_count > 0
                            const onlyDownloaded = files.filter((f) => Number(f.download_count || 0) > 0);

                            const list =
                              onlyDownloaded.length > 0
                                ? onlyDownloaded
                                    .sort((a, b) => Number(b.download_count || 0) - Number(a.download_count || 0))
                                    .map(
                                      (f) =>
                                        `${f.section || "main"} - ${f.original_name || "file"} : ${Number(
                                          f.download_count || 0
                                        )}`
                                    )
                                    .join("\n")
                                : "ไม่มีไฟล์ที่มีการดาวน์โหลด";

                            alert(`ไฟล์ของ: ${d.title}\n\n${list}`);
                          } catch {
                            alert("โหลดข้อมูลไฟล์ไม่สำเร็จ");
                          }
                        }}
                      >
                        <span className="truncate max-w-[70%] font-semibold">{d.title}</span>
                        <span className="font-black">{d.download_count}</span>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== Popular docs ===== */}
        <div className="mt-10">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
            className="mb-4"
          >
            <Typography variant="h5" className="text-brand-700 font-black">
              🌟 ผลงานยอดนิยม
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              เรียงตามจำนวนดาวน์โหลดสูงสุด
            </Typography>
          </Stack>

          {popularDocs.length === 0 ? (
            <Card className="rounded-2xl border border-black/5 shadow-sm">
              <CardContent>
                <Typography variant="body1" color="text.secondary">
                  ยังไม่มีผลงานที่อัปโหลด
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularDocs
                .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
                .slice(0, 6)
                .map((doc) => (
                  <Card
                    key={doc.document_id}
                    className="shadow-lg hover:shadow-2xl transition rounded-2xl border border-black/5 overflow-hidden"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300" />
                    <CardContent>
                      <Typography variant="h6" gutterBottom className="line-clamp-2 text-brand-800 font-black">
                        {doc.title}
                      </Typography>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Chip size="small" label={`ดาวน์โหลด ${Number(doc.download_count || 0)} ครั้ง`} />
                        <Chip size="small" variant="outlined" label={`ปี ${doc.academic_year || "-"}`} />
                      </div>

                      <Typography variant="body2" color="text.secondary" className="mb-2">
                        หมวดหมู่: {docCategoryNames[doc.document_id] ?? "-"}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" className="mb-2">
                        คำค้นหา: {doc.keywords || "ไม่ระบุ"}
                      </Typography>
                    </CardContent>

                    <CardActions className="px-4 pb-4">
                      <Button size="small" variant="outlined" onClick={() => navigate(`/document-detail/${doc.document_id}`)}>
                        ดูรายละเอียด
                      </Button>
                    </CardActions>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {/* Footer spacing */}
        <div className="h-10" />
      </div>
    </Box>
  );
};

export default Home;