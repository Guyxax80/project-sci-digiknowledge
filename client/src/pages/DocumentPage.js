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
    .filter((doc) => String(doc.status || '').toLowerCase() !== 'draft')
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
      <div className="p-5 text-center text-gray-500">
        กำลังโหลดข้อมูล...
      </div>
    );

  if (error)
    return (
      <div className="p-5 text-center text-red-500 font-semibold">
        {error}
      </div>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-brand-700">
        ค้นหาและดูรายการเอกสาร
      </h2>

      {/* ช่องค้นหา */}
      <div className="mb-6">
        <input
          className="w-full border border-brand-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          type="text"
          value={searchText}
          placeholder="🔍 ค้นหาเอกสาร (ชื่อเรื่อง, หมวดหมู่, คำค้น)"
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      {/* ผลลัพธ์การค้นหา */}
      {filteredDocs.length === 0 ? (
        <p className="text-center text-gray-600">ไม่พบเอกสารที่ค้นหา</p>
      ) : (
        <div className="space-y-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.document_id}
              className="border border-brand-100 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white/80"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-brand-800">
                  {doc.title}
                </h3>
                <span className="text-sm text-gray-500 italic">
                  อัปโหลด: {formatDate(doc.uploaded_at)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-gray-700">
                <p className="col-span-2">
                  <strong>หมวดหมู่:</strong> {doc.category_names || "-"}
                </p>
                <p>
                  <strong>ปีการศึกษา:</strong> {doc.academic_year}
                </p>
                <p className="col-span-2">
                  <strong>คำค้น:</strong> {doc.keywords}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/document-detail/${doc.document_id}`)}
                  className="inline-block border border-brand-600 text-brand-700 px-4 py-2 rounded hover:bg-brand-50 transition-colors duration-200"
                  type="button"
                >
                  ดูรายละเอียด
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentPage;