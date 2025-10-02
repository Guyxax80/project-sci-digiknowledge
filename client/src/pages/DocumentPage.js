import React, { useEffect, useState } from "react";
import axios from "axios";

const DocumentPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/documents")
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
  const filteredDocs = documents.filter((doc) => {
    const text = searchText.toLowerCase();
    const title = (doc.title || "").toLowerCase();
    const keywords = (doc.keywords || "").toLowerCase();
    const academic = (doc.academic_year || "").toString().toLowerCase();
    const status = (doc.status || "").toLowerCase();
    return (
      title.includes(text) ||
      keywords.includes(text) ||
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
      <h2 className="text-3xl font-bold mb-6 text-center text-indigo-700">
        ค้นหาและดูรายการเอกสาร
      </h2>

      {/* ช่องค้นหา */}
      <div className="mb-6">
        <input
          className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="border rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-gray-800">
                  {doc.title}
                </h3>
                <span className="text-sm text-gray-500 italic">
                  อัปโหลด: {formatDate(doc.uploaded_at)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-gray-700">
                <p>
                  <strong>สถานะ:</strong> {doc.status || "-"}
                </p>
                <p>
                  <strong>ปีการศึกษา:</strong> {doc.academic_year}
                </p>
                <p className="col-span-2">
                  <strong>คำค้น:</strong> {doc.keywords}
                </p>
              </div>
              <a
                href={`http://localhost:3000/${doc.file_path}`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors duration-200"
              >
                ดาวน์โหลดไฟล์
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentPage;
