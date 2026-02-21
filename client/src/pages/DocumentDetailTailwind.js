import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import api from "../services/api";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// ✅ ตั้งค่า PDF.js worker แบบ local
// วางไฟล์ให้ "เวอร์ชันตรงกับ pdfjs.version ของ react-pdf" (ตอนนี้คือ 5.4.296)
// path: client/public/pdf.worker.min.mjs
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

function DocumentDetailTailwind() {
  const { id } = useParams();

  const [doc, setDoc] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [downloadFiles, setDownloadFiles] = useState([]);
  const [categories, setCategories] = useState([]);
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

  const API_BASE = useMemo(
    () => (process.env.REACT_APP_API_URL || "").replace(/\/+$/, ""),
    []
  );

  // ✅ ถ้าจะใช้ cmaps แนะนำให้ชี้ไป local จะนิ่งกว่า
  // แต่ของเดิมใช้ unpkg ก็ได้ (ถ้าไม่มีปัญหา)
  const pdfOptions = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
    }),
    []
  );

  const zoomIn = () =>
    setScale((s) => Math.min(2.5, Number((s + 0.1).toFixed(2))));
  const zoomOut = () =>
    setScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(2))));
  const zoomReset = () => setScale(1.0);

  const scrollToPage = (p) => {
    const el = pageRefs.current[p];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
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
    return () =>
      window.document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const getThaiSectionLabel = (sectionRaw) => {
    if (!sectionRaw) return "";
    const section = String(sectionRaw).toLowerCase();
    const sectionToThaiMap = {
      cover: "ปก",
      "front-cover": "ปก",
      frontcover: "ปก",
      intro: "บทนำ",
      introduction: "บทนำ",
      toc: "สารบัญ",
      "table-of-contents": "สารบัญ",
      table_of_contents: "สารบัญ",
      abstract: "บทคัดย่อ",
      acknowledgement: "กิตติกรรมประกาศ",
      acknowledgements: "กิตติกรรมประกาศ",
      acknowledgments: "กิตติกรรมประกาศ",
      references: "บรรณานุกรม",
      reference: "บรรณานุกรม",
      bibliography: "บรรณานุกรม",
      "works-cited": "บรรณานุกรม",
      works_cited: "บรรณานุกรม",
      appendix: "ภาคผนวก",
      appendices: "ภาคผนวก",
      annex: "ภาคผนวก",
      annexes: "ภาคผนวก",
      "author-bio": "ประวัติผู้จัดทำปริญญานิพนธ์",
      author_bio: "ประวัติผู้จัดทำปริญญานิพนธ์",
      author: "ประวัติผู้จัดทำปริญญานิพนธ์",
      biography: "ประวัติผู้จัดทำปริญญานิพนธ์",
      bio: "ประวัติผู้จัดทำปริญญานิพนธ์",
      contributor: "ประวัติผู้จัดทำปริญญานิพนธ์",
      contributors: "ประวัติผู้จัดทำปริญญานิพนธ์",
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

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) {
        setError("ไม่พบรหัสเอกสาร");
        setLoading(false);
        return;
      }
      try {
        const docRes = await api.get(`/api/documents/${id}`);
        setDoc(docRes.data.document);
        setVideoFile(docRes.data.videoFile);
        setDownloadFiles(docRes.data.downloadFiles);

        try {
          const catRes = await api.get(`/api/documents/${id}/categories`);
          setCategories(catRes.data || []);
        } catch (_) {
          setCategories(docRes.data.categories || []);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching document details:", err);
        setError("ไม่สามารถดึงรายละเอียดเอกสารได้");
        setLoading(false);
      }
    };
    fetchDocument();
  }, [id]);

  const canReplace = () => {
    if (!doc) return false;
    const statusOk = String(doc.status || "").toLowerCase() === "draft";
    const currentUserId = localStorage.getItem("userId");
    const ownerOk =
      currentUserId && String(currentUserId) === String(doc.user_id || "");
    return statusOk && ownerOk;
  };

  const triggerReplace = (section) => {
    if (!fileInputsRef.current[section]) return;
    setReplacingSection(section);
    fileInputsRef.current[section].click();
  };

  const handleFileSelected = async (section, file) => {
    if (!file) return;
    try {
      const form = new FormData();
      form.append("file", file);
      await api.put(`/api/documents/${doc.document_id}/sections/${section}`, form);

      const docRes = await api.get(`/api/documents/${id}`);
      setDoc(docRes.data.document);
      setVideoFile(docRes.data.videoFile);
      setDownloadFiles(docRes.data.downloadFiles);
      setReplacingSection(null);
    } catch (e) {
      console.error(e);
      alert("แทนที่ไฟล์ไม่สำเร็จ");
      setReplacingSection(null);
    }
  };

  const isPdfFile = (file) => {
    const fileName = file.original_name || "";
    const fileType = file.file_type || "";
    return fileName.toLowerCase().endsWith(".pdf") || fileType === "application/pdf";
  };

  const handleDownload = async (file) => {
  try {
    const res = await api.get(`/download/${file.document_file_id}`, {
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

  const openPdfViewer = (file) => {
    setViewingPdf(file);
    setNumPages(null);
    setCurrentPage(1);
    setScale(1.0);
    pageRefs.current = {}; // ✅ ต้องเป็น object
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

    setTimeout(() => {
      if (pdfScrollRef.current) pdfScrollRef.current.scrollTop = 0;
    }, 0);
  };

  // ✅ Observer ตัวเดียวพอ (แก้เลขหน้าเพี้ยน)
  useEffect(() => {
    if (!viewingPdf || !numPages) return;

    const container = pdfScrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // เลือกหน้าที่เห็น “มากสุด”
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

        const p = visible?.target?.dataset?.page;
        if (p) setCurrentPage(Number(p));
      },
      {
        root: container,
        threshold: [0.2, 0.35, 0.5, 0.65, 0.8],
        rootMargin: "-30% 0px -55% 0px", // ✅ โฟกัสกลางจอ
      }
    );

    for (let p = 1; p <= numPages; p++) {
      const el = pageRefs.current[p];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [viewingPdf, numPages]);

  const onDocumentLoadError = (error) => {
    console.error("Error loading PDF:", error);
    alert(`ไม่สามารถโหลดไฟล์ PDF ได้: ${error.message || "Unknown error"}`);
  };

  if (loading) return <p className="text-center mt-10">กำลังโหลด...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!doc) return <p className="text-center mt-10">ไม่พบเอกสาร</p>;

  const baseWidth = Math.min(900, window.innerWidth - 80);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {videoFile && (
        <div className="w-full">
          <video
            className="w-full aspect-video max-h-[70vh] rounded-lg shadow-md"
            controls
            src={`${API_BASE}/files/video/${videoFile.document_file_id}`}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

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
            <span className="font-semibold">ปีการศึกษา:</span>{" "}
            {doc.academic_year || "-"}
          </p>
        </div>

        <div className="flex-1 bg-white p-4 md:p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">ไฟล์ทั้งหมดของเอกสารนี้</h3>
          {downloadFiles.length === 0 ? (
            <p className="text-gray-500">ไม่มีไฟล์ให้ดาวน์โหลด</p>
          ) : (
            <ul className="space-y-2">
              {downloadFiles.map((file, index) => (
                <li
                  key={index}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 p-2 rounded gap-2"
                >
                  <span className="truncate">
                    {(file.section || "main") === "main"
                      ? "ไฟล์หลัก"
                      : `${file.section}${
                          getThaiSectionLabel(file.section)
                            ? ` (${getThaiSectionLabel(file.section)})`
                            : ""
                        }`}
                    : {file.original_name}
                  </span>

                  <div className="flex items-center gap-2">
                    {isPdfFile(file) && (
                      <button
                        onClick={() => openPdfViewer(file)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        เปิดอ่าน
                      </button>
                    )}

                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="text-brand-700 hover:underline"
                      >
                        ดาวน์โหลด
                      </button>

                    {canReplace() && (
                      <>
                        <button
                          className="text-sm px-2 py-1 bg-accent-600 text-white rounded hover:bg-accent-700"
                          onClick={() => triggerReplace(file.section || "main")}
                          disabled={replacingSection === (file.section || "main")}
                        >
                          {replacingSection === (file.section || "main")
                            ? "กำลังอัปโหลด..."
                            : "แทนที่ไฟล์"}
                        </button>

                        <input
                          type="file"
                          style={{ display: "none" }}
                          ref={(el) => {
                            fileInputsRef.current[file.section || "main"] = el;
                          }}
                          onChange={(e) =>
                            handleFileSelected(file.section || "main", e.target.files?.[0])
                          }
                        />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
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

            <div className="flex items-center justify-between gap-3 p-3 border-b bg-gray-50">
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