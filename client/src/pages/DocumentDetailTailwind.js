import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import {
  CalendarDays,
  Download,
  Eye,
  FileImage,
  FileText,
  Film,
  FolderOpen,
  Layers,
  Tag,
  UploadCloud,
} from "lucide-react";
import api from "../services/api";
import { getToken } from "../utils/auth";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

if (typeof window !== "undefined") {
  const pdfjsVersion = pdfjs.version || "5.4.296";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
}

function DocumentDetailTailwind() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [document, setDocument] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [downloadFiles, setDownloadFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [replacingSection, setReplacingSection] = useState(null);
  const fileInputsRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingPdf, setViewingPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const getThaiSectionLabel = (sectionRaw) => {
    if (!sectionRaw) return "";
    const section = String(sectionRaw).toLowerCase();
    const sectionToThaiMap = {
      cover: "ปก",
      abstract: "บทคัดย่อ",
      acknowledgement: "กิตติกรรมประกาศ",
      toc: "สารบัญ",
      bibliography: "บรรณานุกรม",
      appendix: "ภาคผนวก",
      author_bio: "ประวัติผู้จัดทำ",
      presentation_video: "วิดีโอนำเสนอ",
    };
    if (sectionToThaiMap[section]) return sectionToThaiMap[section];
    const chapterMatch = section.match(/chapter[\s\-_]*(\d+)/);
    if (chapterMatch) return `บทที่${Number(chapterMatch[1])}`;
    return "";
  };

  const fetchDocument = async () => {
    if (!id) {
      setError("ไม่พบรหัสเอกสาร");
      setLoading(false);
      return;
    }
    try {
      const docRes = await api.get(`/api/documents/${id}`);
      setDocument(docRes.data.document);
      setVideoFile(docRes.data.videoFile);
      setDownloadFiles(docRes.data.downloadFiles || []);
      try {
        const catRes = await api.get(`/api/documents/${id}/categories`);
        setCategories(catRes.data || []);
      } catch {
        setCategories(docRes.data.categories || []);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching document details:", err);
      setError("ไม่สามารถดึงรายละเอียดเอกสารได้");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canReplace = () => {
    if (!document) return false;
    const statusOk = String(document.status || "").toLowerCase() === "draft";
    const currentUserId = localStorage.getItem("userId");
    const ownerOk = currentUserId && String(currentUserId) === String(document.user_id || "");
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
      await api.put(`/api/documents/${document.document_id}/sections/${section}`, form);
      await fetchDocument();
      setReplacingSection(null);
    } catch (e) {
      console.error(e);
      alert("แทนที่ไฟล์ไม่สำเร็จ");
      setReplacingSection(null);
    }
  };

  const isPdfFile = (file) => {
    const fileName = String(file.original_name || "").toLowerCase();
    return fileName.endsWith(".pdf") || file.file_type === "application/pdf";
  };

  const getFileIcon = (file) => {
    const fileName = String(file.original_name || "").toLowerCase();
    const section = String(file.section || "").toLowerCase();
    if (fileName.match(/\.(png|jpg|jpeg|webp)$/) || section === "cover") return FileImage;
    if (section === "presentation_video" || fileName.match(/\.(mp4|mov|avi|mkv)$/)) return Film;
    return FileText;
  };

  const handleDownload = async (file) => {
    if (!getToken()) {
      navigate(`/signup?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    try {
      const response = await api.get(`/files/download/${file.document_file_id}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.original_name || "document-file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed", err);
      alert(err?.response?.data?.message || "ดาวน์โหลดไม่สำเร็จ");
    }
  };

  const onDocumentLoadSuccess = ({ numPages: total }) => setNumPages(total);
  const onDocumentLoadError = (err) => {
    console.error("Error loading PDF:", err);
    alert(`ไม่สามารถโหลดไฟล์ PDF ได้: ${err.message || "Unknown error"}`);
  };

  if (loading) return <p className="text-center mt-10">กำลังโหลด...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!document) return <p className="text-center mt-10">ไม่พบเอกสาร</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-indigo-100 via-sky-100 to-cyan-100 flex items-center px-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{document.title}</h1>
              <p className="text-slate-500 text-sm mt-1">รายละเอียดเอกสารและไฟล์แนบทั้งหมด</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
            <p className="flex items-center gap-2"><Layers size={16} /> หมวดหมู่: {categories.length ? categories.map((c) => c.name).join(", ") : "-"}</p>
            <p className="flex items-center gap-2"><Tag size={16} /> คำค้น: {document.keywords || "-"}</p>
            <p className="flex items-center gap-2"><CalendarDays size={16} /> ปีการศึกษา: {document.academic_year || "-"}</p>
            <p className="flex items-center gap-2"><FolderOpen size={16} /> สถานะ: {document.status || "-"}</p>
          </div>
        </section>

        {videoFile && (
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><Film size={18} /> วิดีโอนำเสนอ</h3>
            <video
              className="w-full aspect-video max-h-[70vh] rounded-xl"
              controls
              src={`${process.env.REACT_APP_API_URL}/files/video/${videoFile.document_file_id}`}
            >
              Your browser does not support the video tag.
            </video>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-slate-800">ไฟล์แนบและส่วนต่าง ๆ ของเอกสาร</h3>
          {downloadFiles.length === 0 ? (
            <p className="text-slate-500">ไม่มีไฟล์ให้ดาวน์โหลด</p>
          ) : (
            <ul className="space-y-3">
              {downloadFiles.map((file) => {
                const section = file.section || "main";
                const sectionLabel = section === "main" ? "ไฟล์หลัก" : `${section}${getThaiSectionLabel(section) ? ` (${getThaiSectionLabel(section)})` : ""}`;
                const Icon = getFileIcon(file);
                return (
                  <li key={file.document_file_id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <Icon size={18} className="text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">{sectionLabel}</p>
                          <p className="text-sm text-slate-500 truncate">{file.original_name || "file"}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {isPdfFile(file) && (
                          <button
                            type="button"
                            onClick={() => {
                              setViewingPdf(file);
                              setPageNumber(1);
                              setNumPages(null);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm"
                          >
                            <Eye size={15} /> เปิดอ่าน
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                        >
                          <Download size={15} /> ดาวน์โหลด
                        </button>
                        {canReplace() && (
                          <>
                            <button
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                              onClick={() => triggerReplace(section)}
                              disabled={replacingSection === section}
                            >
                              <UploadCloud size={15} />
                              {replacingSection === section ? "กำลังอัปโหลด..." : "แทนที่ไฟล์"}
                            </button>
                            <input
                              type="file"
                              style={{ display: "none" }}
                              ref={(el) => {
                                fileInputsRef.current[section] = el;
                              }}
                              onChange={(e) => handleFileSelected(section, e.target.files?.[0])}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {viewingPdf && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold truncate pr-4">{viewingPdf.original_name || "PDF Viewer"}</h3>
                <button onClick={() => setViewingPdf(null)} className="text-slate-500 hover:text-slate-700 text-2xl">×</button>
              </div>

              <div className="flex items-center justify-center gap-4 p-3 border-b bg-slate-50">
                <button
                  onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                  disabled={pageNumber <= 1}
                  className="px-4 py-2 bg-indigo-600 text-white rounded disabled:bg-slate-300"
                >
                  ก่อนหน้า
                </button>
                <span className="text-slate-700">หน้า {pageNumber} / {numPages || "..."}</span>
                <button
                  onClick={() => setPageNumber((prev) => Math.min(numPages, prev + 1))}
                  disabled={pageNumber >= numPages}
                  className="px-4 py-2 bg-indigo-600 text-white rounded disabled:bg-slate-300"
                >
                  ถัดไป
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 flex justify-center bg-slate-100">
                <Document
                  file={`${process.env.REACT_APP_API_URL}/files/view/${viewingPdf.document_file_id}`}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                >
                  <Page pageNumber={pageNumber} width={Math.min(820, window.innerWidth - 100)} className="shadow-lg" />
                </Document>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentDetailTailwind;