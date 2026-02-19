import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, CardActions, CardContent, Chip, Typography } from "@mui/material";
import { BookOpenText, CalendarDays, Download, FileImage, FileText, PlayCircle, Tag } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";

const COLORS = ["#7C83FD", "#7DD3FC", "#A7F3D0", "#FDBA74", "#F9A8D4", "#C4B5FD", "#86EFAC", "#FDE68A"];

const getRoleFromStorage = () => (localStorage.getItem("role") || "").trim().toLowerCase();

const detectFileKinds = (files = []) => {
  const kinds = new Set();
  files.forEach((file) => {
    const name = String(file?.original_name || "").toLowerCase();
    const section = String(file?.section || "").toLowerCase();
    if (name.endsWith(".pdf") || section.includes("chapter") || section === "main") kinds.add("pdf");
    if (name.match(/\.(png|jpg|jpeg|webp)$/)) kinds.add("image");
    if (section === "presentation_video" || name.match(/\.(mp4|mov|avi|mkv)$/)) kinds.add("video");
  });
  return Array.from(kinds);
};

const fileKindUi = {
  pdf: { label: "PDF", icon: FileText },
  image: { label: "Image", icon: FileImage },
  video: { label: "Video", icon: PlayCircle },
};

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(getRoleFromStorage());
  const [popularDocs, setPopularDocs] = useState([]);
  const [docMetaMap, setDocMetaMap] = useState({});
  const [stats, setStats] = useState({
    users: 0,
    documents: 0,
    downloads: 0,
    uploadsLast7Days: [],
    topCategories: [],
    usersByRole: [],
    topDocuments: [],
  });

  useEffect(() => {
    const onStorage = () => setRole(getRoleFromStorage());
    window.addEventListener("storage", onStorage);
    const id = setInterval(() => {
      const latest = getRoleFromStorage();
      setRole((prev) => (prev === latest ? prev : latest));
    }, 700);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(id);
    };
  }, []);

  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";
  const isUser = role === "user";
  const isLoggedIn = useMemo(() => isStudent || isTeacher || isAdmin || isUser, [isStudent, isTeacher, isAdmin, isUser]);

  useEffect(() => {
    if (location.state?.message) {
      alert(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    let cancelled = false;

    const fetchDocs = async () => {
      try {
        let res;
        if (isStudent || isTeacher) {
          try {
            res = await api.get("/api/documents/recommended");
          } catch {
            res = await api.get("/api/documents");
          }
        } else {
          res = await api.get("/api/documents");
        }

        const docs = Array.isArray(res.data) ? res.data : [];
        if (cancelled) return;
        setPopularDocs(docs);

        const detailResults = await Promise.all(
          docs.map((doc) =>
            api
              .get(`/api/documents/${doc.document_id}`)
              .then((dres) => ({ id: doc.document_id, detail: dres.data, fallback: doc }))
              .catch(() => ({ id: doc.document_id, detail: null, fallback: doc }))
          )
        );

        const nextMap = {};
        detailResults.forEach(({ id, detail, fallback }) => {
          const categories = Array.isArray(detail?.categories)
            ? detail.categories.map((c) => c.name)
            : String(fallback?.category_names || "")
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);

          const files = Array.isArray(detail?.downloadFiles) ? detail.downloadFiles : [];
          nextMap[id] = {
            categories,
            fileKinds: detectFileKinds(files),
            coverName: files.find((f) => String(f.section || "").toLowerCase() === "cover")?.original_name || null,
          };
        });

        if (!cancelled) setDocMetaMap(nextMap);
      } catch (err) {
        console.error("Home docs load error:", err?.response?.data || err.message);
        if (!cancelled) setPopularDocs([]);
      }
    };

    fetchDocs();
    return () => {
      cancelled = true;
    };
  }, [isStudent, isTeacher]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    const fetchAdminStats = async () => {
      try {
        const res = await api.get("/api/admin/stats").catch(() => api.get("/api/admin/dashboard"));
        if (!cancelled && res?.data) {
          setStats({
            users: res.data.users ?? 0,
            documents: res.data.documents ?? 0,
            downloads: res.data.downloads ?? 0,
            uploadsLast7Days: Array.isArray(res.data.uploadsLast7Days) ? res.data.uploadsLast7Days : [],
            topCategories: Array.isArray(res.data.topCategories) ? res.data.topCategories : [],
            usersByRole: Array.isArray(res.data.usersByRole) ? res.data.usersByRole : [],
            topDocuments: Array.isArray(res.data.topDocuments) ? res.data.topDocuments : [],
          });
        }
      } catch (err) {
        console.error("fetch admin stats error", err?.response?.data || err.message);
      }
    };

    fetchAdminStats();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/40 to-white text-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur px-6 py-7 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Digital Knowledge Library</h1>
              <p className="text-slate-500 mt-2">ค้นหา อ่านรายละเอียด และดาวน์โหลดงานวิชาการได้อย่างเป็นระเบียบและน่าเชื่อถือ</p>
            </div>
            <Chip
              icon={<BookOpenText size={16} />}
              label={isLoggedIn ? `Signed in as ${role || "member"}` : "Public Access"}
              color="primary"
              variant="outlined"
            />
          </div>
        </section>

        {isAdmin && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[{ k: "users", l: "Users" }, { k: "documents", l: "Documents" }, { k: "downloads", l: "Downloads" }].map((item) => (
              <Card key={item.k} className="rounded-2xl shadow-sm border border-slate-100">
                <CardContent>
                  <Typography variant="overline" color="text.secondary">{item.l}</Typography>
                  <Typography variant="h4" fontWeight={700}>{stats[item.k]}</Typography>
                </CardContent>
              </Card>
            ))}

            <Card className="rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
              <CardContent>
                <Typography variant="h6" gutterBottom>Uploads (7 days)</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.uploadsLast7Days}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7C83FD" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border border-slate-100">
              <CardContent>
                <Typography variant="h6" gutterBottom>Top Categories</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={stats.topCategories} dataKey="count" nameKey="category" outerRadius={80} label>
                      {stats.topCategories.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>
        )}

        <section>
          <Typography variant="h5" className="!font-semibold !mb-4">Popular Documents</Typography>
          {popularDocs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">ยังไม่มีเอกสารที่เผยแพร่</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {popularDocs.map((doc) => {
                const meta = docMetaMap[doc.document_id] || { categories: [], fileKinds: [], coverName: null };
                return (
                  <Card key={doc.document_id} className="rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="h-36 bg-gradient-to-br from-slate-100 via-sky-100 to-indigo-100 flex items-center justify-center">
                      <div className="text-center text-slate-600">
                        <FileText className="mx-auto mb-2" size={30} />
                        <p className="text-xs">{meta.coverName ? `Cover: ${meta.coverName}` : "No thumbnail available"}</p>
                      </div>
                    </div>
                    <CardContent className="space-y-3">
                      <Typography variant="h6" className="!font-semibold line-clamp-2">{doc.title}</Typography>

                      <div className="flex flex-wrap gap-2">
                        {(meta.categories.length ? meta.categories : ["Uncategorized"]).slice(0, 4).map((cat) => (
                          <span key={cat} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{cat}</span>
                        ))}
                      </div>

                      <div className="space-y-1 text-sm text-slate-600">
                        <p className="flex items-center gap-2"><Tag size={15} /> {doc.keywords || "ไม่ระบุคำค้น"}</p>
                        <p className="flex items-center gap-2"><CalendarDays size={15} /> ปีการศึกษา: {doc.academic_year || "ไม่ระบุ"}</p>
                        <p className="flex items-center gap-2"><Download size={15} /> ดาวน์โหลด: {Number(doc.download_count || 0)} ครั้ง</p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {meta.fileKinds.length > 0 ? meta.fileKinds.map((kind) => {
                          const item = fileKindUi[kind];
                          if (!item) return null;
                          const Icon = item.icon;
                          return (
                            <Chip
                              key={kind}
                              icon={<Icon size={14} />}
                              label={item.label}
                              size="small"
                              variant="outlined"
                            />
                          );
                        }) : <Chip label="No file info" size="small" variant="outlined" />}
                      </div>
                    </CardContent>
                    <CardActions className="!px-4 !pb-4">
                      <Button variant="outlined" fullWidth onClick={() => navigate(`/document-detail/${doc.document_id}`)}>
                        ดูรายละเอียด
                      </Button>
                    </CardActions>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;