import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function DocumentDetailTailwind() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [downloadFiles, setDownloadFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [replacingSection, setReplacingSection] = useState(null);
  const fileInputsRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getThaiSectionLabel = (sectionRaw) => {
    if (!sectionRaw) return '';
    const section = String(sectionRaw).toLowerCase();
    const sectionToThaiMap = {
      cover: 'ปก',
      'front-cover': 'ปก',
      frontcover: 'ปก',
      intro: 'บทนำ',
      introduction: 'บทนำ',
      toc: 'สารบัญ',
      'table-of-contents': 'สารบัญ',
      table_of_contents: 'สารบัญ',
      abstract: 'บทคัดย่อ',
      acknowledgement: 'กิตติกรรมประกาศ'
    };
    if (sectionToThaiMap[section]) return sectionToThaiMap[section];
    const chapterMatch = section.match(/chapter[\s\-_]*(\d+)/);
    if (chapterMatch) {
      const chapterNumber = Number(chapterMatch[1]);
      if (!Number.isNaN(chapterNumber) && chapterNumber >= 1 && chapterNumber <= 99) {
        return `บทที่ ${chapterNumber}`;
      }
    }
    return '';
  };

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) {
        setError("ไม่พบรหัสเอกสาร");
        setLoading(false);
        return;
      }
      try {
        const docRes = await axios.get(`http://localhost:3000/api/documents/${id}`);
        setDocument(docRes.data.document);
        setVideoFile(docRes.data.videoFile);
        setDownloadFiles(docRes.data.downloadFiles);
        try {
          const catRes = await axios.get(`http://localhost:3000/api/documents/${id}/categories`);
          setCategories(catRes.data || []);
        } catch (_) {
          // fallback หาก endpoint ไม่มี ใช้ categories ที่แนบมากับ document (ถ้ามี)
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
    if (!document) return false;
    const statusOk = String(document.status || '').toLowerCase() === 'draft';
    const currentUserId = localStorage.getItem('userId');
    const ownerOk = currentUserId && String(currentUserId) === String(document.user_id || '');
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
      form.append('file', file);
      await fetch(`http://localhost:3000/api/documents/${document.document_id}/sections/${section}`, {
        method: 'PUT',
        body: form
      });
      // refresh details
      const docRes = await axios.get(`http://localhost:3000/api/documents/${id}`);
      setDocument(docRes.data.document);
      setVideoFile(docRes.data.videoFile);
      setDownloadFiles(docRes.data.downloadFiles);
      setReplacingSection(null);
    } catch (e) {
      console.error(e);
      alert('แทนที่ไฟล์ไม่สำเร็จ');
      setReplacingSection(null);
    }
  };

  if (loading) return <p className="text-center mt-10">กำลังโหลด...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!document) return <p className="text-center mt-10">ไม่พบเอกสาร</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* วิดีโอแนะนำ */}
      {videoFile && (
      <div className="w-full">
          <video
            className="w-full aspect-video max-h-[70vh] rounded-lg shadow-md"
            controls
            src={`http://localhost:3000/files/video/${videoFile.document_file_id}`}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* รายละเอียดเอกสาร + ไฟล์ดาวน์โหลด */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - รายละเอียดเอกสาร (เฉพาะ Categorie, Keywords, Academic Year) */}
        <div className="flex-2 bg-white p-4 md:p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">{document.title}</h2>
          <p><span className="font-semibold">หมวดหมู่:</span> {categories.length > 0 ? categories.map(c => c.name).join(", ") : "-"}</p>
          <p><span className="font-semibold">คำค้น:</span> {document.keywords || "-"}</p>
          <p><span className="font-semibold">ปีการศึกษา:</span> {document.academic_year || "-"}</p>
        </div>

        {/* Right Column - ไฟล์ดาวน์โหลด */}
        <div className="flex-1 bg-white p-4 md:p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">ไฟล์ทั้งหมดของเอกสารนี้</h3>
          {downloadFiles.length === 0 ? (
            <p className="text-gray-500">ไม่มีไฟล์ให้ดาวน์โหลด</p>
          ) : (
            <ul className="space-y-2">
              {downloadFiles.map((file, index) => (
                <li key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 p-2 rounded gap-2">
                  <span className="truncate">
                    {(file.section || 'main') === 'main' ? 'ไฟล์หลัก' : `${file.section}${getThaiSectionLabel(file.section) ? ` (${getThaiSectionLabel(file.section)})` : ''}`}: {file.original_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`http://localhost:3000/files/download/${file.document_file_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 hover:underline"
                    >
                      ดาวน์โหลด
                    </a>
                    {canReplace() && (
                      <>
                        <button
                          className="text-sm px-2 py-1 bg-accent-600 text-white rounded hover:bg-accent-700"
                          onClick={() => triggerReplace(file.section || 'main')}
                          disabled={replacingSection === (file.section || 'main')}
                        >
                          {replacingSection === (file.section || 'main') ? 'กำลังอัปโหลด...' : 'แทนที่ไฟล์'}
                        </button>
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          ref={(el) => { fileInputsRef.current[file.section || 'main'] = el; }}
                          onChange={(e) => handleFileSelected(file.section || 'main', e.target.files?.[0])}
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
    </div>
  );
}

export default DocumentDetailTailwind;