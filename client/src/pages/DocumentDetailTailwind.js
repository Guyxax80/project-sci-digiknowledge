// src/pages/DocumentDetailTailwind.js
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import api from "../services/api";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// ✅ ตั้งค่า PDF.js worker แบบ local
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

function DocumentDetailTailwind() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [doc, setDoc] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [downloadFiles, setDownloadFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [replacingSection, setReplacingSection] = useState(null);

  const fileInputsRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewingPdf, setViewingPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);

  // ✅ Scroll-mode
  const pdfScrollRef = useRef(null);
  const pageRefs = useRef({});

  // ✅ หน้า “ที่กำลังอ่านอยู่”
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ UI controls
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ✅ หัวข้อที่ "ควรมีให้ครบ"
  const REQUIRED_SECTIONS = useMemo(
    () => [
      "cover",
      "abstract",
      "acknowledgement",
      "toc",
      "chapter1",
      "chapter2",
      "chapter3",
      "chapter4",
      "chapter5",
      "bibliography",
      "appendix",
      "author_bio",
      "presentation_video",
    ],
    []
  );

  const API_BASE = useMemo(
    () => (process.env.REACT_APP_API_URL || "").replace(/\/+$/, ""),
    []
  );

  const pdfOptions = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
    }),
    []
  );

  // ✅ login check
  const isLoggedIn = () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    return Boolean(token && userId);
  };

  // ✅ ไปหน้า login/signup และจำหน้าที่กลับมา
  const goLogin = () => navigate("/login", { state: { from: location.pathname } });
  const goSignup = () => navigate("/signup", { state: { from: location.pathname } });

  // ✅ (แก้แล้ว) ฟังก์ชัน zoom ที่ถูกต้อง — ไม่ทำให้ re-render loop
  const zoomIn = () => setScale((s) => Math.min(2.5, Number((s + 0.1).toFixed(2))));
  const zoomOut = () => setScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(2))));
  const zoomReset = () => setScale(1.0);

  const normalizeSection = (s) => String(s || "").trim().toLowerCase();

  // ✅ scroll ไปหน้าแบบไม่เพี้ยน
  const scrollToPage = (p) => {
    const container = pdfScrollRef.current;
    const el = pageRefs.current[p];
    if (!container || !el) return;
    container.scrollTo({ top: el.offsetTop, behavior: "smooth" });
  };

  const toggleFullscreen = () => {
    const root = pdfScrollRef.current?.closest(".pdf-modal-root");
    if (!root) return;

    if (!window.document.fullscreenElement) {
      root.requestFullscreen?.();
    } else {
      window.document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(window.document.fullscreenElement));
    window.document.addEventListener("fullscreenchange", onFsChange);
    return () => window.document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const getThaiSectionLabel = (sectionRaw) => {
    if (!sectionRaw) return "";
    const section = String(sectionRaw).toLowerCase();

    const sectionToThaiMap = {
      cover: "ปก",
      toc: "สารบัญ",
      abstract: "บทคัดย่อ",
      acknowledgement: "กิตติกรรมประกาศ",
      bibliography: "บรรณานุกรม",
      appendix: "ภาคผนวก",
      author_bio: "ประวัติผู้จัดทำปริญญานิพนธ์",
      presentation_video: "วิดีโอนำเสนอ",

      references: "บรรณานุกรม",
      reference: "บรรณานุกรม",
      acknowledgements: "กิตติกรรมประกาศ",
      acknowledgments: "กิตติกรรมประกาศ",
      "author-bio": "ประวัติผู้จัดทำปริญญานิพนธ์",
    };

    if (sectionToThaiMap[section]) return sectionToThaiMap[section];

    const chapterMatch = section.match(/chapter[\s\-_]*(\d+)/);
    if (chapterMatch) {
      const chapterNumber = Number(chapterMatch[1]);
      if (!Number.isNaN(chapterNumber) && chapterNumber >= 1 && chapterNumber <= 99) {
        return `บทที่${chapterNumber}`;
      }
    }
    return "";
  };

  // =========================
  // ✅ FETCH: doc detail (public ได้)
  // =========================
  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) {
        setError("ไม่พบรหัสเอกสาร");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const docRes = await api.get(`/documents/${id}`);
        setDoc(docRes.data.document);
        setVideoFile(docRes.data.videoFile);
        setDownloadFiles(docRes.data.downloadFiles || []);
        setCategories(docRes.data.categories || []);

        // ✅ timeline เป็น auth เท่านั้น → โหลดเฉพาะตอน login
        if (isLoggedIn()) {
          const timelineRes = await api
            .get(`/documents/${id}/timeline`)
            .catch(() => ({ data: { success: true, timeline: [] } }));

          const tl = timelineRes.data?.timeline || [];
          setTimeline(Array.isArray(tl) ? tl : []);
        } else {
          setTimeline([]);
        }
      } catch (err) {
        console.error("Error fetching document details:", err);
        const msg = err?.response?.data?.message || "ไม่สามารถดึงรายละเอียดเอกสารได้";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ แทนที่ได้ทุกสถานะ ยกเว้น pending/approved + ต้องเป็นเจ้าของ
  const canReplace = () => {
    if (!doc) return false;

    const status = String(doc.status || "").trim().toLowerCase();
    const statusOk = !["pending", "approved"].includes(status);

    const currentUserId = localStorage.getItem("userId");
    const ownerOk = currentUserId && String(currentUserId) === String(doc.user_id || "");

    return statusOk && ownerOk;
  };

  const triggerReplace = (section) => {
    const sec = normalizeSection(section);
    if (!fileInputsRef.current[sec]) return;
    setReplacingSection(sec);
    fileInputsRef.current[sec].click();
  };

  const handleFileSelected = async (section, file) => {
    if (!file) return;

    if (!isLoggedIn()) {
      alert("ต้องเข้าสู่ระบบก่อนอัปโหลด/แทนที่ไฟล์");
      goLogin();
      return;
    }

    const sec = normalizeSection(section);

    try {
      setReplacingSection(sec);

      const form = new FormData();
      form.append("file", file);

      await api.put(`/section-files/${doc.document_id}/sections/${sec}`, form);

      // ✅ รีเฟรชหลังอัปโหลด
      const docRes = await api.get(`/documents/${id}`);
      setDoc(docRes.data.document);
      setVideoFile(docRes.data.videoFile);
      setDownloadFiles(docRes.data.downloadFiles || []);
      setCategories(docRes.data.categories || []);
    } catch (e) {
      console.error(e);
      alert("อัปโหลด/แทนที่ไฟล์ไม่สำเร็จ");
    } finally {
      setReplacingSection(null);
    }
  };

  const isPdfFile = (file) => {
    if (!file) return false;
    const fileName = file.original_name || "";
    const fileType = file.file_type || "";
    return fileName.toLowerCase().endsWith(".pdf") || fileType === "application/pdf";
  };

  const openPdfViewer = (file) => {
    setViewingPdf(file);
    setNumPages(null);
    setCurrentPage(1);
    setScale(1.0);
    pageRefs.current = {};
  };

  const closePdfViewer = () => {
    setViewingPdf(null);
    setNumPages(null);
    setCurrentPage(1);
    setScale(1.0);
    pageRefs.current = {};
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    requestAnimationFrame(() => {
      if (pdfScrollRef.current) pdfScrollRef.current.scrollTop = 0;
    });
  };

  // ✅ เลขหน้านิ่ง 100% จาก scrollTop
  useEffect(() => {
    if (!viewingPdf || !numPages) return;

    const container = pdfScrollRef.current;
    if (!container) return;

    let rafId = null;

    const computeCurrentPage = () => {
      rafId = null;
      const scrollTop = container.scrollTop;
      const centerY = scrollTop + container.clientHeight / 2;

      let bestPage = 1;
      let bestDist = Infinity;

      for (let p = 1; p <= numPages; p++) {
        const el = pageRefs.current[p];
        if (!el) continue;
        const top = el.offsetTop;
        const height = el.offsetHeight || 1;
        const pageCenter = top + height / 2;
        const dist = Math.abs(centerY - pageCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestPage = p;
        }
      }

      setCurrentPage(bestPage);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(computeCurrentPage);
    };

    container.addEventListener("scroll", onScroll, { passive: true });

    requestAnimationFrame(() => {
      container.scrollTop = 0;
      setCurrentPage(1);
      computeCurrentPage();
    });

    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [viewingPdf, numPages, scale, isFullscreen]);

  const onDocumentLoadError = (error) => {
    console.error("Error loading PDF:", error);
    alert(`ไม่สามารถโหลดไฟล์ PDF ได้: ${error.message || "Unknown error"}`);
  };

  // ✅ ดาวน์โหลดไฟล์: ต้อง login
  const handleDownload = async (file) => {
    if (!isLoggedIn()) {
      alert("ต้องเข้าสู่ระบบ/สมัครสมาชิกก่อนดาวน์โหลดเอกสาร");
      goLogin();
      return;
    }

    try {
      const res = await api.get(`/files/download/${file.document_file_id}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file.original_name || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("ดาวน์โหลดไม่สำเร็จ");
    }
  };

  const handleVideoDownload = async () => {
    if (!videoFile?.document_file_id) return;

    if (!isLoggedIn()) {
      alert("ต้องเข้าสู่ระบบ/สมัครสมาชิกก่อนดาวน์โหลดวิดีโอ");
      goLogin();
      return;
    }

    try {
      const res = await api.get(`/files/download/${videoFile.document_file_id}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: res.headers?.["content-type"] || "video/mp4",
      });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = videoFile.original_name || "presentation_video.mp4";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Video download failed:", err);
      alert("ดาวน์โหลดวิดีโอไม่สำเร็จ");
    }
  };

  // ✅ section index (รวม video)
  const sectionIndex = useMemo(() => {
    const map = new Map();

    (downloadFiles || []).forEach((f) => {
      map.set(normalizeSection(f.section), f);
    });

    if (videoFile) {
      map.set("presentation_video", {
        ...videoFile,
        section: "presentation_video",
        original_name:
          videoFile.original_name ||
          videoFile.file_name ||
          videoFile.public_url ||
          "presentation_video",
        file_type: videoFile.file_type || videoFile.mime_type || "video/*",
      });
    }

    return map;
  }, [downloadFiles, videoFile]);

  // ✅ render list
  const filesForRender = useMemo(() => {
    const requiredRows = REQUIRED_SECTIONS.map((sec) => {
      const f = sectionIndex.get(normalizeSection(sec)) || null;
      return { section: sec, file: f };
    });

    const extraRows = (downloadFiles || [])
      .filter((f) => {
        const sec = normalizeSection(f.section);
        return sec !== "main" && !REQUIRED_SECTIONS.includes(sec);
      })
      .map((f) => ({ section: normalizeSection(f.section), file: f }));

    return [...extraRows, ...requiredRows];
  }, [REQUIRED_SECTIONS, downloadFiles, sectionIndex]);

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/80 border border-black/5 shadow-md rounded-2xl p-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-black/[0.04] flex items-center justify-center">
            ⏳
          </div>
          <div className="text-gray-700 font-semibold">กำลังโหลด...</div>
          <div className="text-sm text-gray-500 mt-1">โปรดรอสักครู่</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-red-200 shadow-md rounded-2xl p-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
            ⚠️
          </div>
          <div className="text-red-600 font-semibold">{error}</div>
          <div className="text-sm text-gray-500 mt-1">ลองรีเฟรชหน้า หรือเช็คการเชื่อมต่อ</div>
        </div>
      </div>
    );

  if (!doc)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/80 border border-black/5 shadow-md rounded-2xl p-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-black/[0.04] flex items-center justify-center">
            📄
          </div>
          <div className="text-gray-700 font-semibold">ไม่พบเอกสาร</div>
        </div>
      </div>
    );

  const baseWidth = Math.min(900, window.innerWidth - 80);
  const displaySectionName = (section) => getThaiSectionLabel(section) || section;

  const statusLower = String(doc.status || "").toLowerCase();
  const statusBadge =
    statusLower === "approved"
      ? "bg-green-50 text-green-700 border-green-200"
      : statusLower === "pending"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : statusLower === "rejected"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="min-h-screen bg-black/[0.02] py-6">
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
        {/* ===== Top notice ===== */}
        {!isLoggedIn() && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900 shadow-sm">
            <div className="font-semibold">ผู้เยี่ยมชมสามารถดูรายละเอียดและเปิดอ่านเอกสารได้</div>
            <div className="text-yellow-800/90">
              แต่การดาวน์โหลดต้องเข้าสู่ระบบ/สมัครสมาชิก
              <button onClick={goLogin} className="ml-2 underline font-semibold">
                เข้าสู่ระบบ
              </button>
              <button onClick={goSignup} className="ml-2 underline font-semibold">
                สมัครสมาชิก
              </button>
            </div>
          </div>
        )}

        {/* ===== Hero header ===== */}
        <div className="rounded-3xl border border-black/5 shadow-lg overflow-hidden bg-white">
          <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-brand-50/60">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-black text-brand-800 leading-snug">
                    {doc.title}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusBadge}`}>
                      สถานะ: {String(doc.status || "-").toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                      ปีการศึกษา: {doc.academic_year || "-"}
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                      หมวดหมู่:{" "}
                      {categories.length > 0 ? categories.map((c) => c.name).join(", ") : "-"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 rounded-xl border border-black/10 hover:bg-black/[0.03] transition font-semibold"
                  >
                    ← ย้อนกลับ
                  </button>

                  {isLoggedIn() ? (
                    <button
                      type="button"
                      onClick={() => window.scrollTo({ top: 999999, behavior: "smooth" })}
                      className="px-4 py-2 rounded-xl border border-black/10 hover:bg-black/[0.03] transition font-semibold"
                      title="ไปยังรายการไฟล์"
                    >
                      ไปส่วนไฟล์
                    </button>
                  ) : null}
                </div>
              </div>

              {doc.keywords ? (
                <div className="mt-1 text-sm text-gray-700">
                  <span className="font-semibold">คำค้น:</span> {doc.keywords}
                </div>
              ) : (
                <div className="mt-1 text-sm text-gray-500">
                  <span className="font-semibold">คำค้น:</span> -
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== Video ===== */}
        {videoFile && (
          <div className="rounded-3xl border border-black/5 shadow-lg overflow-hidden bg-white">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-lg font-black text-gray-800">🎬 วิดีโอนำเสนอ</div>
                  <div className="text-sm text-gray-500">ดูวิดีโอได้ทันที (ดาวน์โหลดต้องเข้าสู่ระบบ)</div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
                  >
                    ดูวิดีโอ
                  </button>

                  {isLoggedIn() ? (
                    <button
                      type="button"
                      onClick={handleVideoDownload}
                      className="px-4 py-2 rounded-xl border border-black/10 hover:bg-black/[0.03] transition font-semibold"
                    >
                      ดาวน์โหลดวิดีโอ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goLogin}
                      className="px-4 py-2 rounded-xl border border-black/10 text-gray-600 hover:bg-black/[0.03] transition font-semibold"
                      title="ต้องเข้าสู่ระบบเพื่อดาวน์โหลด"
                    >
                      ดาวน์โหลดวิดีโอ (เข้าสู่ระบบก่อน)
                    </button>
                  )}
                </div>
              </div>

              <video
                className="w-full aspect-video max-h-[70vh] rounded-2xl shadow-md bg-black"
                controls
                src={`${API_BASE}/files/video/${videoFile.document_file_id}`}
              >
                เบราว์เซอร์ของคุณไม่รองรับแท็กวิดีโอ
              </video>
            </div>
          </div>
        )}

        {/* ===== Main content ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-black/5 shadow-lg bg-white overflow-hidden">
              <div className="p-5 md:p-6">
                <div className="text-xl font-black text-gray-800 mb-3">📌 รายละเอียดเอกสาร</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-800">
                  <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                    <div className="text-xs text-gray-500">หมวดหมู่</div>
                    <div className="font-semibold mt-1">
                      {categories.length > 0 ? categories.map((c) => c.name).join(", ") : "-"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                    <div className="text-xs text-gray-500">ปีการศึกษา</div>
                    <div className="font-semibold mt-1">{doc.academic_year || "-"}</div>
                  </div>

                  <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4 md:col-span-2">
                    <div className="text-xs text-gray-500">คำค้น</div>
                    <div className="font-semibold mt-1">{doc.keywords || "-"}</div>
                  </div>

                  <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                    <div className="text-xs text-gray-500">สถานะ</div>
                    <div className="font-semibold mt-1 uppercase">{doc.status || "-"}</div>
                  </div>

                  <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                    <div className="text-xs text-gray-500">สิทธิ์แก้ไขไฟล์</div>
                    <div className="font-semibold mt-1">
                      {canReplace() ? "แก้ไข/แทนที่ได้" : "ไม่อนุญาต"}
                    </div>
                  </div>
                </div>

                {isLoggedIn() && timeline?.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="text-lg font-black text-gray-800">🕒 ประวัติการอนุมัติ</div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                        {timeline.length} รายการ
                      </span>
                    </div>

                    <div className="rounded-2xl border border-black/5 bg-white">
                      <ul className="text-sm text-gray-700 divide-y divide-black/5">
                        {timeline.map((t) => (
                          <li key={t.approval_id} className="p-3">
                            <div className="font-semibold">
                              • {String(t.status || "").toUpperCase()}{" "}
                              {t.approver_name ? `โดย ${t.approver_name}` : ""}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {t.approved_at ? new Date(t.approved_at).toLocaleString("th-TH") : ""}
                              {t.reason ? ` • เหตุผล: ${t.reason}` : ""}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Files */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl border border-black/5 shadow-lg bg-white overflow-hidden">
              <div className="p-5 md:p-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="text-xl font-black text-gray-800">📁 ไฟล์ทั้งหมด</div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                    {filesForRender.length}
                  </span>
                </div>

                <ul className="space-y-3">
                  {filesForRender.map(({ section, file }, index) => {
                    const sec = normalizeSection(section);
                    const thaiName = displaySectionName(section);

                    const isVideoSec = sec === "presentation_video";
                    const hasVideo = Boolean(videoFile);
                    const hasFile = Boolean(file);

                    return (
                      <li
                        key={`${sec}-${index}`}
                        className="rounded-2xl border border-black/5 bg-black/[0.02] p-3 hover:bg-black/[0.03] transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-gray-800 truncate">
                              {thaiName}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 truncate">
                              {file?.original_name ? (
                                file.original_name
                              ) : (
                                <span className="text-gray-400">ยังไม่ได้อัปโหลด</span>
                              )}
                            </div>
                          </div>

                          <span
                            className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                              hasFile || (isVideoSec && hasVideo)
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                          >
                            {hasFile || (isVideoSec && hasVideo) ? "พร้อมใช้งาน" : "ว่าง"}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {file && isPdfFile(file) && !isVideoSec && (
                            <button
                              type="button"
                              onClick={() => openPdfViewer(file)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-semibold"
                            >
                              เปิดอ่าน
                            </button>
                          )}

                          {isVideoSec && hasVideo && (
                            <>
                              <button
                                type="button"
                                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-semibold"
                              >
                                ดูวิดีโอ
                              </button>

                              {isLoggedIn() ? (
                                <button
                                  type="button"
                                  onClick={handleVideoDownload}
                                  className="px-3 py-1.5 rounded-xl border border-black/10 hover:bg-black/[0.03] transition text-sm font-semibold"
                                >
                                  ดาวน์โหลด
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={goLogin}
                                  className="px-3 py-1.5 rounded-xl border border-black/10 text-gray-600 hover:bg-black/[0.03] transition text-sm font-semibold"
                                  title="ต้องเข้าสู่ระบบเพื่อดาวน์โหลด"
                                >
                                  ดาวน์โหลด (เข้าสู่ระบบก่อน)
                                </button>
                              )}
                            </>
                          )}

                          {file && !isVideoSec &&
                            (isLoggedIn() ? (
                              <button
                                type="button"
                                onClick={() => handleDownload(file)}
                                className="px-3 py-1.5 rounded-xl border border-black/10 hover:bg-black/[0.03] transition text-sm font-semibold"
                              >
                                ดาวน์โหลด
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={goLogin}
                                className="px-3 py-1.5 rounded-xl border border-black/10 text-gray-600 hover:bg-black/[0.03] transition text-sm font-semibold"
                                title="ต้องเข้าสู่ระบบเพื่อดาวน์โหลด"
                              >
                                ดาวน์โหลด (เข้าสู่ระบบก่อน)
                              </button>
                            ))}

                          {canReplace() && (
                            <>
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-xl bg-accent-600 text-white hover:bg-accent-700 transition text-sm font-semibold disabled:opacity-50"
                                onClick={() => triggerReplace(sec)}
                                disabled={replacingSection === sec}
                              >
                                {replacingSection === sec
                                  ? "กำลังอัปโหลด..."
                                  : file
                                  ? "แทนที่ไฟล์"
                                  : "อัปโหลดไฟล์"}
                              </button>

                              <input
                                type="file"
                                accept={
                                  sec === "presentation_video"
                                    ? "video/*"
                                    : ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                }
                                style={{ display: "none" }}
                                ref={(el) => {
                                  fileInputsRef.current[sec] = el;
                                }}
                                onChange={(e) => handleFileSelected(sec, e.target.files?.[0])}
                              />
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {!canReplace() && ["pending", "approved"].includes(String(doc.status || "").toLowerCase()) && (
                  <p className="mt-4 text-sm text-gray-500">
                    * สถานะ {String(doc.status || "").toLowerCase()} ไม่อนุญาตให้แก้ไข/แทนที่ไฟล์
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== PDF Modal ===== */}
        {viewingPdf && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 md:p-4">
            <div className="pdf-modal-root bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-white/10">
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b bg-gradient-to-r from-slate-50 via-white to-slate-50">
                <h3 className="text-base md:text-lg font-black truncate flex-1 mr-4 text-gray-800">
                  {viewingPdf.original_name || "PDF Viewer"}
                </h3>
                <button
                  onClick={closePdfViewer}
                  className="text-gray-500 hover:text-gray-800 text-2xl font-black px-3 py-1 rounded-xl hover:bg-black/[0.04] transition"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-white sticky top-0 z-50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-700 font-semibold">
                    หน้า {currentPage} / {numPages || "..."}
                  </span>

                  <button
                    onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                    className="px-3 py-1.5 rounded-xl bg-white border border-black/10 hover:bg-black/[0.03] disabled:opacity-50 transition"
                    disabled={currentPage <= 1}
                  >
                    ↑ ก่อนหน้า
                  </button>

                  <button
                    onClick={() => scrollToPage(Math.min(numPages || 1, currentPage + 1))}
                    className="px-3 py-1.5 rounded-xl bg-white border border-black/10 hover:bg-black/[0.03] disabled:opacity-50 transition"
                    disabled={!numPages || currentPage >= numPages}
                  >
                    ↓ ถัดไป
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={zoomOut}
                    className="px-3 py-1.5 rounded-xl bg-white border border-black/10 hover:bg-black/[0.03] transition"
                    title="Zoom out"
                  >
                    −
                  </button>

                  <span className="text-gray-700 w-[72px] text-center font-semibold">
                    {Math.round(scale * 100)}%
                  </span>

                  <button
                    onClick={zoomIn}
                    className="px-3 py-1.5 rounded-xl bg-white border border-black/10 hover:bg-black/[0.03] transition"
                    title="Zoom in"
                  >
                    +
                  </button>

                  <button
                    onClick={zoomReset}
                    className="px-3 py-1.5 rounded-xl bg-white border border-black/10 hover:bg-black/[0.03] transition"
                    title="Reset zoom"
                  >
                    100%
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
                    title="Fullscreen"
                  >
                    {isFullscreen ? "ออกเต็มจอ" : "เต็มจอ"}
                  </button>
                </div>
              </div>

              {/* PDF content */}
              <div
                ref={pdfScrollRef}
                className="flex-1 overflow-auto p-4 bg-black/[0.03]"
                style={{ scrollBehavior: "smooth" }}
              >
                <div className="mx-auto w-fit">
                  <Document
                    file={`${API_BASE}/files/view/${viewingPdf.document_file_id}`}
                    options={pdfOptions}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex items-center justify-center h-40">
                        <p className="text-gray-500">กำลังโหลด PDF...</p>
                      </div>
                    }
                  >
                    {Array.from(new Array(numPages || 0), (_, index) => {
                      const page = index + 1;
                      return (
                        <div
                          key={page}
                          data-page={page}
                          ref={(el) => {
                            if (el) pageRefs.current[page] = el;
                          }}
                          className="mb-4 flex justify-center"
                        >
                          <Page
                            pageNumber={page}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            width={baseWidth}
                            scale={scale}
                            className="shadow-lg rounded"
                          />
                        </div>
                      );
                    })}
                  </Document>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentDetailTailwind;