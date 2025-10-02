import React, { useEffect, useState } from "react";
import axios from "axios";

function DocumentDetailTailwind({ documentId }) {
  const [document, setDocument] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [downloadFiles, setDownloadFiles] = useState([]);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/documents/${documentId}`);
        setDocument(res.data.document);
        setVideoFile(res.data.videoFile);
        setDownloadFiles(res.data.downloadFiles);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocument();
  }, [documentId]);

  if (!document) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* วิดีโอแนะนำ */}
      {videoFile && (
        <div className="w-full">
          <video
            className="w-full h-96 rounded-lg shadow-md"
            controls
            src={`http://localhost:3000/files/video/${videoFile.document_file_id}`}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* รายละเอียดเอกสาร + ไฟล์ดาวน์โหลด */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - รายละเอียดเอกสาร */}
        <div className="flex-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">{document.title}</h2>
          <p><span className="font-semibold">Uploader:</span> {document.uploader}</p>
          <p><span className="font-semibold">Academic Year:</span> {document.academic_year}</p>
          <p><span className="font-semibold">Keywords:</span> {document.keywords}</p>
          <p><span className="font-semibold">Status:</span> {document.status}</p>
          <p><span className="font-semibold">Uploaded at:</span> {new Date(document.uploaded_at).toLocaleString()}</p>
        </div>

        {/* Right Column - ไฟล์ดาวน์โหลด */}
        <div className="flex-1 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Download Files</h3>
          <ul className="space-y-2">
            {downloadFiles.map(file => (
              <li key={file.document_file_id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span className="truncate">{file.original_name || file.file_path}</span>
                <a
                  href={`http://localhost:3000/files/download/${file.document_file_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DocumentDetailTailwind;
