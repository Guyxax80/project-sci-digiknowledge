import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const DocumentPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    api
      .get("/documents")
      .then((res) => {
        setDocuments(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API error:", err);
        setError("ไม่สามารถดึงข้อมูลเอกสารได้");
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateStr).toLocaleDateString("th-TH", options);
  };

  // ฟิลเตอร์เอกสารตาม searchText
  const filteredDocs = documents
    // กัน draft ออกเสมอสำหรับหน้าค้นหาเอกสารสาธารณะ (ปล่อยว่าง/NULL แสดงได้)
    .filter((doc) => String(doc.status || "").toLowerCase() !== "draft")
    .filter((doc) => {
      const text = searchText.toLowerCase();
      const title = (doc.title || "").toLowerCase();
      const keywords = (doc.keywords || "").toLowerCase();
      const academic = (doc.academic_year || "").toString().toLowerCase();
      const status = (doc.status || "").toLowerCase();
      const categories = (doc.category_names || "").toLowerCase();
      return (
        title.includes(text) ||
        keywords.includes(text) ||
        categories.includes(text) ||
        academic.includes(text) ||
        status.includes(text)
      );
    });

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/80 border border-black/5 shadow-md rounded-2xl p-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-brand-100/60 flex items-center justify-center">
            ⏳
          </div>
          <div className="text-gray-700 font-semibold">กำลังโหลดข้อมูล...</div>
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

  return (
    <div className="min-h-screen bg-black/[0.02] py-6">
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {/* ===== Header / Hero ===== */}
        <div className="rounded-3xl border border-black/5 shadow-lg overflow-hidden bg-white">
          <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-brand-50/60">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-brand-800 tracking-tight">
                  ค้นหาและดูรายการเอกสาร
                </h2>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  ค้นหาจากชื่อเรื่อง, หมวดหมู่, คำค้น, ปีการศึกษา หรือสถานะ
                </p>
              </div>

              {/* mini summary */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                  ทั้งหมด: {documents.length}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 border border-brand-100/70 text-brand-800">
                  แสดงผล: {filteredDocs.length}
                </span>
              </div>
            </div>

            {/* ===== Search bar ===== */}
            <div className="mt-5">
              <div className="flex items-center gap-3 rounded-2xl border border-brand-100/80 bg-white shadow-sm px-4 py-3 focus-within:ring-2 focus-within:ring-brand-400">
                <div className="text-lg">🔍</div>
                <input
                  className="w-full bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                  type="text"
                  value={searchText}
                  placeholder="ค้นหาเอกสาร (ชื่อเรื่อง, หมวดหมู่, คำค้น, ปีการศึกษา, สถานะ)"
                  onChange={(event) => setSearchText(event.target.value)}
                />
                {searchText ? (
                  <button
                    type="button"
                    onClick={() => setSearchText("")}
                    className="text-sm px-3 py-1 rounded-xl border border-black/10 hover:bg-black/[0.03] transition"
                    title="ล้างคำค้น"
                  >
                    ล้าง
                  </button>
                ) : null}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                * เอกสารสถานะ <span className="font-semibold">draft</span> จะไม่แสดงในหน้านี้
              </div>
            </div>
          </div>
        </div>

        {/* ===== Results ===== */}
        <div className="mt-6">
          {filteredDocs.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-8 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-black/[0.04] flex items-center justify-center">
                🔎
              </div>
              <p className="text-gray-700 font-semibold">ไม่พบเอกสารที่ค้นหา</p>
              <p className="text-sm text-gray-500 mt-1">
                ลองเปลี่ยนคำค้น เช่น ชื่อเรื่อง / หมวดหมู่ / ปีการศึกษา
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.document_id}
                  className="rounded-2xl border border-black/5 bg-white shadow-md hover:shadow-xl transition overflow-hidden"
                >
                  {/* top accent */}
                  <div className="h-1.5 bg-gradient-to-r from-brand-300 via-purple-300 to-pink-300" />

                  <div className="p-5 md:p-6">
                    {/* title row */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xl md:text-2xl font-black text-brand-800 leading-snug line-clamp-2">
                          {doc.title}
                        </h3>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                            ปีการศึกษา: {doc.academic_year || "-"}
                          </span>
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                            สถานะ: {doc.status || "-"}
                          </span>
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.04] border border-black/5">
                            ดาวน์โหลด: {Number(doc.download_count || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 italic whitespace-nowrap">
                        อัปโหลด: {doc.uploaded_at ? formatDate(doc.uploaded_at) : "-"}
                      </div>
                    </div>

                    <div className="my-4 h-px bg-black/5" />

                    {/* details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                      <p className="md:col-span-2">
                        <span className="font-semibold">หมวดหมู่:</span>{" "}
                        <span className="text-gray-700">{doc.category_names || "-"}</span>
                      </p>

                      <p className="md:col-span-2">
                        <span className="font-semibold">คำค้น:</span>{" "}
                        <span className="text-gray-700">{doc.keywords || "-"}</span>
                      </p>
                    </div>

                    {/* actions */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/document-detail/${doc.document_id}`)}
                        className="inline-flex items-center gap-2 border border-brand-600 text-brand-700 px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors duration-200 font-semibold"
                        type="button"
                      >
                        ดูรายละเอียด <span className="text-base">→</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText?.(String(doc.title || ""))}
                        className="inline-flex items-center gap-2 border border-black/10 text-gray-700 px-4 py-2 rounded-xl hover:bg-black/[0.03] transition font-semibold"
                        title="คัดลอกชื่อเอกสาร"
                      >
                        คัดลอกชื่อ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* bottom spacer */}
          <div className="h-10" />
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;