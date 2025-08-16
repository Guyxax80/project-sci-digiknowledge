import React, { useEffect, useState } from "react";
import axios from "axios";

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3000/documents")
      .then((res) => {
        setDocuments(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("ไม่สามารถดึงข้อมูลเอกสารได้");
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateStr).toLocaleDateString("th-TH", options);
  };

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
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-indigo-700">
        รายการเอกสารที่อัปโหลด
      </h2>
      {documents.length === 0 ? (
        <p className="text-center text-gray-600">ยังไม่มีเอกสารที่อัปโหลด</p>
      ) : (
        <div className="space-y-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
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
                  <strong>หมวดหมู่:</strong> {doc.category}
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

export default DocumentList;
