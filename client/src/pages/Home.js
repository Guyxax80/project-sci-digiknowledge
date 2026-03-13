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
  Drawer,
  IconButton,
  Badge,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
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
    <Card
      className={`bg-gradient-to-br ${toneClass} shadow-md rounded-2xl border border-black/5`}
    >
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
  const [searchText, setSearchText] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);

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
  const isLoggedIn = useMemo(
    () => isStudent || isTeacher || isAdmin,
    [isStudent, isTeacher, isAdmin]
  );

  // ✅ searchbar ให้ student / teacher / guest ใช้ได้
  const canUseSearch = !isAdmin;

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleYear = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedYears([]);
    setSearchText("");
  };

  useEffect(() => {
    let cancelled = false;

    const fetchDocs = async () => {
      try {
        let res;

        if (isStudent || isTeacher) {
          try {
            res = await api.get("/documents/recommended");
          } catch {
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
                .then((dres) => ({
                  id: doc.document_id,
                  detail: dres.data,
                  fallback: doc,
                }))
                .catch(() => ({
                  id: doc.document_id,
                  detail: null,
                  fallback: doc,
                }))
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
              const res = await api.get(
                `/admin/documents/${d.document_id}/file-downloads`
              );
              const files = Array.isArray(res.data) ? res.data : [];
              const hasDownloadedFile = files.some(
                (f) => Number(f.download_count || 0) > 0
              );
              return hasDownloadedFile ? d : null;
            } catch {
              return null;
            }
          })
        );

        if (!cancelled) setTopDocsFiltered(results.filter(Boolean));
      } finally {
        if (!cancelled) setTopDocsLoading(false);
      }
    };

    filterTopDocsByDownloadedFiles();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, stats.topDocuments]);

  const availableYears = useMemo(() => {
    const years = popularDocs
      .map((doc) => String(doc.academic_year || "").trim())
      .filter(Boolean);

    return [...new Set(years)].sort((a, b) => Number(b) - Number(a));
  }, [popularDocs]);

  const availableCategories = useMemo(() => {
    const allCategories = Object.values(docCategoryNames)
      .flatMap((value) =>
        String(value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
      .filter((item) => item !== "-");

    return [...new Set(allCategories)].sort((a, b) =>
      a.localeCompare(b, "th")
    );
  }, [docCategoryNames]);

  useEffect(() => {
    setSelectedCategories((prev) =>
      prev.filter((item) => availableCategories.includes(item))
    );
  }, [availableCategories]);

  useEffect(() => {
    setSelectedYears((prev) =>
      prev.filter((item) => availableYears.includes(item))
    );
  }, [availableYears]);

  const filteredPopularDocs = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return popularDocs.filter((doc) => {
      const title = String(doc.title || "").toLowerCase();
      const keywords = String(doc.keywords || "").toLowerCase();
      const academicYear = String(doc.academic_year || "").toLowerCase();
      const categoryNames = String(
        docCategoryNames[doc.document_id] || ""
      ).toLowerCase();
      const status = String(doc.status || "").toLowerCase();

      const isNotDraft = status !== "draft";

      const matchSearch =
        !keyword ||
        title.includes(keyword) ||
        keywords.includes(keyword) ||
        academicYear.includes(keyword) ||
        categoryNames.includes(keyword) ||
        status.includes(keyword);

      const matchCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((cat) =>
          categoryNames.includes(String(cat).toLowerCase())
        );

      const matchYear =
        selectedYears.length === 0 ||
        selectedYears.includes(String(doc.academic_year || ""));

      return isNotDraft && matchSearch && matchCategory && matchYear;
    });
  }, [popularDocs, docCategoryNames, searchText, selectedCategories, selectedYears]);

  const visiblePopularDocs = useMemo(() => {
    if (canUseSearch) return filteredPopularDocs;
    return [];
  }, [canUseSearch, filteredPopularDocs]);

  const activeFilterCount = selectedCategories.length + selectedYears.length;

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
        <Card className="rounded-3xl border border-black/5 shadow-xl overflow-hidden">
          <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              alignItems={{ md: "center" }}
              justifyContent="space-between"
            >
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <AutoAwesomeIcon
                    fontSize="small"
                    className="text-indigo-500"
                  />
                  <Typography variant="h4" className="font-black text-brand-800">
                    ยินดีต้อนรับ{" "}
                    {isStudent
                      ? "นักศึกษา"
                      : isTeacher
                      ? "อาจารย์"
                      : isAdmin
                      ? "ผู้ดูแลระบบ"
                      : "ผู้เยี่ยมชม"}
                  </Typography>
                </Stack>

                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  {canUseSearch
                    ? "ค้นหาเอกสารได้เร็วขึ้นด้วยคำค้น หมวดหมู่ และปีการศึกษา"
                    : "ภาพรวมระบบและสถิติการใช้งานสำหรับผู้ดูแลระบบ"}
                </Typography>

                {canUseSearch && (
                  <div className="mt-5 w-full max-w-3xl">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white shadow-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-300">
                      <Badge
                        badgeContent={activeFilterCount}
                        color="primary"
                        invisible={activeFilterCount === 0}
                      >
                        <IconButton
                          onClick={() => setFilterOpen(true)}
                          title="เปิดตัวกรอง"
                          size="small"
                          className="bg-slate-50"
                        >
                          <TuneIcon />
                        </IconButton>
                      </Badge>

                      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600">
                        <SearchIcon fontSize="small" />
                      </div>

                      <input
                        className="w-full bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm md:text-base"
                        type="text"
                        value={searchText}
                        placeholder="ค้นหาเอกสารจากชื่อเรื่อง หมวดหมู่ คำค้น ปีการศึกษา หรือสถานะ"
                        onChange={(event) => setSearchText(event.target.value)}
                      />

                      {(searchText || activeFilterCount > 0) && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="text-sm px-3 py-1.5 rounded-xl border border-black/10 hover:bg-black/[0.03] transition whitespace-nowrap"
                          title="ล้างคำค้นและตัวกรอง"
                        >
                          ล้างทั้งหมด
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Chip
                        size="small"
                        icon={<FilterListIcon />}
                        label={`พบ ${visiblePopularDocs.length} รายการ`}
                        variant="outlined"
                      />

                      {selectedCategories.map((cat) => (
                        <Chip
                          key={cat}
                          label={cat}
                          size="small"
                          color="primary"
                          variant="outlined"
                          onDelete={() => toggleCategory(cat)}
                        />
                      ))}

                      {selectedYears.map((year) => (
                        <Chip
                          key={year}
                          label={`ปี ${year}`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          onDelete={() => toggleYear(year)}
                        />
                      ))}
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      * เอกสารสถานะ <span className="font-semibold">draft</span>{" "}
                      จะไม่แสดงในหน้านี้
                    </div>
                  </div>
                )}
              </Box>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
              >
                <RoleBadge role={role} />

                {!isLoggedIn ? (
                  <>
                    <Button
                      variant="contained"
                      onClick={() => navigate("/login")}
                    >
                      เข้าสู่ระบบ
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate("/signup")}
                    >
                      สมัครสมาชิก
                    </Button>
                  </>
                ) : null}

                {isStudent ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("/upload")}
                  >
                    อัปโหลดผลงานใหม่
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </div>
        </Card>

        {canUseSearch && (
          <Drawer
            anchor="left"
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            PaperProps={{
              sx: {
                width: "100%",
                maxWidth: 380,
                boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
                borderRight: "1px solid rgba(0,0,0,0.08)",
                overflow: "hidden",
                backgroundColor: "#fff",
              },
            }}
          >
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Box
                sx={{
                  px: 2.5,
                  py: 2,
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Typography variant="h6" className="font-black text-gray-800">
                      ตัวกรองเอกสาร
                    </Typography>
                    <Typography variant="body2" className="text-gray-500 mt-1">
                      เลือกหมวดหมู่และปีการศึกษา
                    </Typography>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="h-10 w-10 rounded-xl border border-black/10 hover:bg-black/[0.03] transition flex items-center justify-center text-lg"
                    title="ปิดตัวกรอง"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 hover:bg-black/[0.03] transition font-semibold"
                  >
                    ♻️ ล้างตัวกรอง
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 hover:opacity-90 transition font-semibold"
                  >
                    ใช้งานตัวกรอง
                  </button>
                </div>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: 2.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      🗂️
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">หมวดหมู่</h4>
                      <p className="text-xs text-gray-500">
                        เลือกได้มากกว่า 1 รายการ
                      </p>
                    </div>
                  </div>

                  {availableCategories.length === 0 ? (
                    <p className="text-sm text-gray-500">ไม่มีข้อมูลหมวดหมู่</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-auto pr-1">
                      {availableCategories.map((category) => {
                        const checked = selectedCategories.includes(category);
                        return (
                          <label
                            key={category}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition ${
                              checked
                                ? "border-blue-300 bg-blue-50"
                                : "border-black/5 hover:bg-black/[0.02]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCategory(category)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {category}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                      📅
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">ปีการศึกษา</h4>
                      <p className="text-xs text-gray-500">
                        เลือกได้มากกว่า 1 รายการ
                      </p>
                    </div>
                  </div>

                  {availableYears.length === 0 ? (
                    <p className="text-sm text-gray-500">ไม่มีข้อมูลปีการศึกษา</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-auto pr-1">
                      {availableYears.map((year) => {
                        const checked = selectedYears.includes(year);
                        return (
                          <label
                            key={year}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition ${
                              checked
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-black/5 hover:bg-black/[0.02]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleYear(year)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {year}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Box>
            </Box>
          </Drawer>
        )}

        {isAdmin && (
          <div className="mt-6 space-y-8">
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
            >
              <Typography variant="h5" className="text-brand-800 font-black">
                📊 แดชบอร์ดผู้ดูแลระบบ
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                สรุปข้อมูลภาพรวมในช่วง 7 วันล่าสุด
              </Typography>
            </Stack>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="👥 ผู้ใช้งานทั้งหมด"
                value={stats.users}
                tone="indigo"
              />
              <StatCard
                title="📚 ผลงานทั้งหมด"
                value={stats.documents}
                tone="purple"
              />
              <StatCard
                title="⬇️ ดาวน์โหลดรวม"
                value={stats.downloads}
                tone="pink"
              />
              <StatCard
                title="📅 อัปโหลดใน 7 วันล่าสุด"
                value={stats.uploadCount7d ?? 0}
                tone="green"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-2xl border border-black/5 shadow-md">
                <CardContent>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography variant="h6" className="font-black">
                      📈 การอัปโหลดใน 7 วันที่ผ่านมา
                    </Typography>
                    <Chip
                      size="small"
                      label="Uploads / Day"
                      variant="outlined"
                    />
                  </Stack>
                  <Divider className="my-2" />
                  {stats.uploadsLast7Days?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={stats.uploadsLast7Days}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="day"
                          tickFormatter={(d) =>
                            new Date(d).toLocaleDateString("th-TH", {
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          fill="#8884d8"
                          radius={[10, 10, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary">
                      ไม่มีข้อมูลการอัปโหลด
                    </Typography>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-black/5 shadow-md">
                <CardContent>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography variant="h6" className="font-black">
                      🥇 หมวดหมู่ยอดนิยม
                    </Typography>
                    <Chip
                      size="small"
                      label="Top Categories"
                      variant="outlined"
                    />
                  </Stack>
                  <Divider className="my-2" />
                  {stats.topCategories?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={stats.topCategories}
                          dataKey="count"
                          nameKey="category"
                          outerRadius={105}
                          label
                        >
                          {stats.topCategories.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary">
                      ไม่มีข้อมูลหมวดหมู่
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl border border-black/5 shadow-md">
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                  flexWrap="wrap"
                  gap={1}
                >
                  <Typography variant="h6" className="font-black">
                    🏆 เอกสารยอดดาวน์โหลด
                  </Typography>
                  <Chip
                    size="small"
                    label="Click เพื่อดูไฟล์ย่อย"
                    variant="outlined"
                  />
                </Stack>
                <Divider className="my-2" />

                <div className="space-y-2">
                  {topDocsLoading ? (
                    <Typography color="text.secondary">
                      กำลังตรวจสอบไฟล์ย่อยของเอกสาร...
                    </Typography>
                  ) : !topDocsFiltered || topDocsFiltered.length === 0 ? (
                    <Typography color="text.secondary">
                      ไม่มีเอกสารที่มีไฟล์ย่อยถูกดาวน์โหลด
                    </Typography>
                  ) : (
                    topDocsFiltered.map((d) => (
                      <button
                        key={d.document_id}
                        className="w-full flex items-center justify-between text-left text-sm hover:bg-black/[0.03] p-3 rounded-xl border border-black/5 transition"
                        onClick={async () => {
                          try {
                            const res = await api.get(
                              `/admin/documents/${d.document_id}/file-downloads`
                            );
                            const files = Array.isArray(res.data)
                              ? res.data
                              : [];
                            const onlyDownloaded = files.filter(
                              (f) => Number(f.download_count || 0) > 0
                            );

                            const list =
                              onlyDownloaded.length > 0
                                ? onlyDownloaded
                                    .sort(
                                      (a, b) =>
                                        Number(b.download_count || 0) -
                                        Number(a.download_count || 0)
                                    )
                                    .map(
                                      (f) =>
                                        `${f.section || "main"} - ${
                                          f.original_name || "file"
                                        } : ${Number(f.download_count || 0)}`
                                    )
                                    .join("\n")
                                : "ไม่มีไฟล์ที่มีการดาวน์โหลด";

                            alert(`ไฟล์ของ: ${d.title}\n\n${list}`);
                          } catch {
                            alert("โหลดข้อมูลไฟล์ไม่สำเร็จ");
                          }
                        }}
                      >
                        <span className="truncate max-w-[70%] font-semibold">
                          {d.title}
                        </span>
                        <span className="font-black">{d.download_count}</span>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!isAdmin && (
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

            {visiblePopularDocs.length === 0 ? (
              <Card className="rounded-2xl border border-black/5 shadow-sm">
                <CardContent>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบเอกสารที่ตรงกับคำค้นหา
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...visiblePopularDocs]
                  .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
                  .slice(0, 6)
                  .map((doc) => (
                    <Card
                      key={doc.document_id}
                      className="shadow-lg hover:shadow-2xl transition rounded-2xl border border-black/5 overflow-hidden"
                    >
                      <div className="h-1.5 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300" />
                      <CardContent>
                        <Typography
                          variant="h6"
                          gutterBottom
                          className="line-clamp-2 text-brand-800 font-black"
                        >
                          {doc.title}
                        </Typography>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Chip
                            size="small"
                            label={`ดาวน์โหลด ${Number(
                              doc.download_count || 0
                            )} ครั้ง`}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`ปี ${doc.academic_year || "-"}`}
                          />
                        </div>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          className="mb-2"
                        >
                          หมวดหมู่: {docCategoryNames[doc.document_id] ?? "-"}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          className="mb-2"
                        >
                          คำค้นหา: {doc.keywords || "ไม่ระบุ"}
                        </Typography>
                      </CardContent>

                      <CardActions className="px-4 pb-4">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            navigate(`/document-detail/${doc.document_id}`)
                          }
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

        <div className="h-10" />
      </div>
    </Box>
  );
};

export default Home;