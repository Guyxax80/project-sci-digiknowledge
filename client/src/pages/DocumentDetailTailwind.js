import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function DocumentDetailTailwind() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [downloadFiles, setDownloadFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) {
        setError("ไม่พบรหัสเอกสาร");
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`http://localhost:3000/api/documents/${id}`);
        setDocument(res.data.document);
        setCategories(res.data.categories || []);
        setVideoFile(res.data.videoFile);
        setDownloadFiles(res.data.downloadFiles);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching document details:", err);
        setError("ไม่สามารถดึงรายละเอียดเอกสารได้");
        setLoading(false);
      }
    };
    fetchDocument();
  }, [id]);

  if (loading) return <p className="text-center mt-10">กำลังโหลด...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!document) return <p className="text-center mt-10">ไม่พบเอกสาร</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">{document.title}</h2>
        <div className="space-y-2">
          <p>
            <span className="font-semibold">Categorie:</span>{" "}
            {categories.length > 0 ? categories.map(c => c.name).join(", ") : "-"}
          </p>
          <p>
            <span className="font-semibold">Keywords:</span>{" "}
            {document.keywords || "-"}
          </p>
          <p>
            <span className="font-semibold">Academic Year:</span>{" "}
            {document.academic_year || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DocumentDetailTailwind;
