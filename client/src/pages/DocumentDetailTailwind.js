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
  const zoomIn = () =>
    setScale((s) => Math.min(2.5, Number((s + 0.1).toFixed(2))));
  const zoomOut = () =>
    setScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(2))));
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
    const onFsChange = () =>
      setIsFullscreen(Boolean(window.document.fullscreenElement));
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

  if (loading) return <p className="text-center mt-10">กำลังโหลด...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!doc) return <p className="text-center mt-10">ไม่พบเอกสาร</p>;

  const baseWidth = Math.min(900, window.innerWidth - 80);
  const displaySectionName = (section) => getThaiSectionLabel(section) || section;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {!isLoggedIn() && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          ผู้เยี่ยมชมสามารถดูรายละเอียดและเปิดอ่านเอกสารได้ แต่การดาวน์โหลดต้องเข้าสู่ระบบ/สมัครสมาชิก
          <button onClick={goLogin} className="ml-2 underline font-medium">
            เข้าสู่ระบบ
          </button>
          <button onClick={goSignup} className="ml-2 underline font-medium">
            สมัครสมาชิก
          </button>
        </div>
      )}

      {videoFile && (
        <div className="w-full">
          <video
            className="w-full aspect-video max-h-[70vh] rounded-lg shadow-md"
            controls
            src={`${API_BASE}/files/video/${videoFile.document_file_id}`}
          >
            เบราว์เซอร์ของคุณไม่รองรับแท็กวิดีโอ
          </video>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-2 bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">{doc.title}</h2>

            <p>
              <span className="font-semibold">หมวดหมู่:</span>{" "}
              {categories.length > 0 ? categories.map((c) => c.name).join(", ") : "-"}
            </p>

            <p>
              <span className="font-semibold">คำค้น:</span> {doc.keywords || "-"}
            </p>

            <p>
              <span className="font-semibold">ปีการศึกษา:</span> {doc.academic_year || "-"}
            </p>

            <p className="mt-2">
              <span className="font-semibold">สถานะ:</span>{" "}
              <span className="uppercase">{doc.status || "-"}</span>
            </p>

            {isLoggedIn() && timeline?.length > 0 && (
              <div className="mt-4">
                <div className="font-semibold mb-2">ประวัติการอนุมัติ</div>
                <ul className="text-sm text-gray-700 space-y-1">
                  {timeline.map((t) => (
                    <li key={t.approval_id}>
                      • {String(t.status || "").toUpperCase()}{" "}
                      {t.approver_name ? `โดย ${t.approver_name}` : ""}{" "}
                      {t.approved_at ? `(${new Date(t.approved_at).toLocaleString("th-TH")})` : ""}
                      {t.reason ? ` - เหตุผล: ${t.reason}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white p-4 md:p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">ไฟล์ทั้งหมดของเอกสารนี้</h3>

          <ul className="space-y-2">
            {filesForRender.map(({ section, file }, index) => {
              const sec = normalizeSection(section);
              const thaiName = displaySectionName(section);

              const isVideoSec = sec === "presentation_video";
              const hasVideo = Boolean(videoFile);

              return (
                <li
                  key={`${sec}-${index}`}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 p-2 rounded gap-2"
                >
                  <span className="truncate">
                    {thaiName}:{" "}
                    {file?.original_name ? (
                      file.original_name
                    ) : (
                      <span className="text-gray-400">ยังไม่ได้อัปโหลด</span>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    {file && isPdfFile(file) && !isVideoSec && (
                      <button
                        type="button"
                        onClick={() => openPdfViewer(file)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        เปิดอ่าน
                      </button>
                    )}

                    {isVideoSec && hasVideo && (
                      <>
                        <button
                          type="button"
                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          ดูวิดีโอ
                        </button>

                        {isLoggedIn() ? (
                          <button
                            type="button"
                            onClick={handleVideoDownload}
                            className="text-brand-700 hover:underline"
                          >
                            ดาวน์โหลดวิดีโอ
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={goLogin}
                            className="text-gray-500 hover:text-gray-700 underline"
                            title="ต้องเข้าสู่ระบบเพื่อดาวน์โหลด"
                          >
                            ดาวน์โหลดวิดีโอ (เข้าสู่ระบบก่อน)
                          </button>
                        )}
                      </>
                    )}

                    {file && !isVideoSec && (
                      isLoggedIn() ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="text-brand-700 hover:underline"
                        >
                          ดาวน์โหลด
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={goLogin}
                          className="text-gray-500 hover:text-gray-700 underline"
                          title="ต้องเข้าสู่ระบบเพื่อดาวน์โหลด"
                        >
                          ดาวน์โหลด (เข้าสู่ระบบก่อน)
                        </button>
                      )
                    )}

                    {canReplace() && (
                      <>
                        <button
                          type="button"
                          className="text-sm px-2 py-1 bg-accent-600 text-white rounded hover:bg-accent-700 disabled:opacity-50"
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

          {!canReplace() &&
            ["pending", "approved"].includes(String(doc.status || "").toLowerCase()) && (
              <p className="mt-3 text-sm text-gray-500">
                * สถานะ {String(doc.status || "").toLowerCase()} ไม่อนุญาตให้แก้ไข/แทนที่ไฟล์
              </p>
            )}
        </div>
      </div>

      {viewingPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="pdf-modal-root bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold truncate flex-1 mr-4">
                {viewingPdf.original_name || "PDF Viewer"}
              </h3>
              <button
                onClick={closePdfViewer}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold px-3 py-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 border-b bg-gray-50 sticky top-0 z-50">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-700 font-medium">
                  หน้า {currentPage} / {numPages || "..."}
                </span>

                <button
                  onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                  className="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-50"
                  disabled={currentPage <= 1}
                >
                  ↑ ก่อนหน้า
                </button>

                <button
                  onClick={() => scrollToPage(Math.min(numPages || 1, currentPage + 1))}
                  className="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-50"
                  disabled={!numPages || currentPage >= numPages}
                >
                  ↓ ถัดไป
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={zoomOut}
                  className="px-3 py-1 rounded bg-white border hover:bg-gray-100"
                  title="Zoom out"
                >
                  −
                </button>

                <span className="text-gray-700 w-[70px] text-center">
                  {Math.round(scale * 100)}%
                </span>

                <button
                  onClick={zoomIn}
                  className="px-3 py-1 rounded bg-white border hover:bg-gray-100"
                  title="Zoom in"
                >
                  +
                </button>

                <button
                  onClick={zoomReset}
                  className="px-3 py-1 rounded bg-white border hover:bg-gray-100"
                  title="Reset zoom"
                >
                  100%
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                  title="Fullscreen"
                >
                  {isFullscreen ? "ออกเต็มจอ" : "เต็มจอ"}
                </button>
              </div>
            </div>

            <div
              ref={pdfScrollRef}
              className="flex-1 overflow-auto p-4 bg-gray-100"
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
                          className="shadow-lg"
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
  );
}

export default DocumentDetailTailwind;