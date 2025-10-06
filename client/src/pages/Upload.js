import React, { useEffect, useState } from "react";
import axios from "axios";

const UploadDocument = () => {
  const [title, setTitle] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [keywords, setKeywords] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [academicYearDate, setAcademicYearDate] = useState("");
  const [file, setFile] = useState(null);
  const [isDraft, setIsDraft] = useState(false);
  // ดึง userId จาก localStorage (ต้องมีตอนล็อกอิน)

  // ไฟล์รายส่วน
  const [coverFile, setCoverFile] = useState(null);
  const [abstractFile, setAbstractFile] = useState(null);
  const [ackFile, setAckFile] = useState(null);
  const [tocFile, setTocFile] = useState(null);
  const [chapter1File, setChapter1File] = useState(null);
  const [chapter2File, setChapter2File] = useState(null);
  const [chapter3File, setChapter3File] = useState(null);
  const [chapter4File, setChapter4File] = useState(null);
  const [chapter5File, setChapter5File] = useState(null);
  const [referenceFile, setReferenceFile] = useState(null);
  const [appendixFile, setAppendixFile] = useState(null);
  const [authorBioFile, setAuthorBioFile] = useState(null);
  const [presentationVideoFile, setPresentationVideoFile] = useState(null);

  // โหลดรายการหมวดหมู่จาก API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/categories");
        setCategories(res.data || []);
      } catch (err) {
        console.error("โหลดหมวดหมู่ไม่สำเร็จ", err);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !file) return alert("กรุณากรอกชื่อเอกสารและเลือกไฟล์");
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) return alert("กรุณา login ก่อนอัปโหลด");

    try {
      // ส่ง multipart เพียงครั้งเดียวให้ตรงกับ server: /api/upload (upload.single("file"))
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("keywords", keywords);
      formData.append("academic_year", academicYear);
      formData.append("user_id", storedUserId);
      formData.append("status", isDraft ? "draft" : "published");
      // ส่งหมวดหมู่หลายค่าเป็น categorie_ids[]
      selectedCategoryIds.forEach((id) => formData.append("categorie_ids[]", id));

      console.log("=== FRONTEND DATA ===");
      console.log("Title:", title);
      console.log("Keywords:", keywords);
      console.log("Academic Year:", academicYear);
      console.log("User ID:", storedUserId);
      console.log("Status:", isDraft ? "draft" : "published");
      console.log("Categorie IDs:", selectedCategoryIds);
      console.log("File name:", file.name);
      console.log("====================");

      const response = await axios.post("http://localhost:3000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      console.log("Server response:", response.data);
      
      // หลังสร้างเอกสารแล้ว อัปโหลดไฟล์รายส่วน (ถ้ามี)
      const { documentId } = response.data || {};
      if (documentId) {
        const sections = new FormData();
        if (coverFile) sections.append("cover", coverFile);
        if (abstractFile) sections.append("abstract", abstractFile);
        if (ackFile) sections.append("acknowledgement", ackFile);
        if (tocFile) sections.append("toc", tocFile);
        if (chapter1File) sections.append("chapter1", chapter1File);
        if (chapter2File) sections.append("chapter2", chapter2File);
        if (chapter3File) sections.append("chapter3", chapter3File);
        if (chapter4File) sections.append("chapter4", chapter4File);
        if (chapter5File) sections.append("chapter5", chapter5File);
        if (referenceFile) sections.append("reference", referenceFile);
        if (appendixFile) sections.append("appendix", appendixFile);
        if (authorBioFile) sections.append("author_bio", authorBioFile);
        if (presentationVideoFile) sections.append("presentation_video", presentationVideoFile);

        if ([...sections.keys()].length > 0) {
          await axios.post(`http://localhost:3000/api/documents/${documentId}/sections`, sections, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
      }

      alert("อัปโหลดเอกสารและไฟล์สำเร็จ");

      // เคลียร์ฟอร์ม
      setTitle("");
      setSelectedCategoryIds([]);
      setKeywords("");
      setAcademicYear("");
      setAcademicYearDate("");
      setFile(null);
      setIsDraft(false);
      setCoverFile(null);
      setAbstractFile(null);
      setAckFile(null);
      setTocFile(null);
      setChapter1File(null);
      setChapter2File(null);
      setChapter3File(null);
      setChapter4File(null);
      setChapter5File(null);
      setReferenceFile(null);
      setAppendixFile(null);
      setAuthorBioFile(null);
      setPresentationVideoFile(null);

    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto border rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">อัปโหลดเอกสาร</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="ชื่อเอกสาร"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          required
        />
        <div>
          <p className="font-semibold mb-2">เลือกหมวดหมู่ (เลือกได้หลายรายการ)</p>
          <div className="flex flex-col gap-2 max-h-40 overflow-auto border rounded p-2">
            {categories.map((cat) => {
              const idStr = String(cat.categorie_id);
              const checked = selectedCategoryIds.includes(idStr);
              return (
                <label key={idStr} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategoryIds((prev) => [...prev, idStr]);
                      } else {
                        setSelectedCategoryIds((prev) => prev.filter((x) => x !== idStr));
                      }
                    }}
                  />
                  <span>{cat.name}</span>
                </label>
              );
            })}
            {categories.length === 0 && (
              <span className="text-sm text-gray-500">ไม่มีหมวดหมู่</span>
            )}
          </div>
        </div>
        <input
          type="text"
          placeholder="คำค้นหา"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <div className="flex flex-col">
          <label className="mb-1">ปีการศึกษา</label>
          <input
            type="date"
            value={academicYearDate}
            onChange={(e) => {
              const val = e.target.value;
              setAcademicYearDate(val);
              const gYear = val ? new Date(val).getFullYear() : null;
              const thaiYear = gYear ? (gYear + 543).toString() : "";
              setAcademicYear(thaiYear);
            }}
            className="border rounded px-3 py-2 w-full"
          />
          {academicYear && (
            <span className="text-sm text-gray-600 mt-1">เลือกปี (พ.ศ.): {academicYear}</span>
          )}
        </div>
        <div className="mt-2">
          <p className="font-semibold mb-2">ไฟล์หลักของเอกสาร</p>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </div>

        <hr className="my-2" />
        <div className="grid grid-cols-1 gap-3">
          <label className="flex flex-col">
            <span className="mb-1">ปก (cover)</span>
            <input type="file" onChange={(e) => setCoverFile(e.target.files[0])} />
          </label>
          <label className="flex flex-col">
            <span className="mb-1">บทคัดย่อ (abstract)</span>
            <input type="file" onChange={(e) => setAbstractFile(e.target.files[0])} />
          </label>
          <label className="flex flex-col">
            <span className="mb-1">กิตติกรรมประกาศ (acknowledgement)</span>
            <input type="file" onChange={(e) => setAckFile(e.target.files[0])} />
          </label>
          <label className="flex flex-col">
            <span className="mb-1">สารบัญ (toc)</span>
            <input type="file" onChange={(e) => setTocFile(e.target.files[0])} />
          </label>
          <label className="flex flex-col">
            <span className="mb-1">บทที่ 1 (chapter1)</span>
            <input type="file" onChange={(e) => setChapter1File(e.target.files[0])} />
          </label>
          <label className="flex flex-col">
            <span className="mb-1">บทที่ 2 (chapter2)</span>
            <input type="file" onChange={(e) => setChapter2File(e.target.files[0])} />
          </label>
          <label className="flex flex-col">
            <span className="mb-1">บทที่ 3 (chapter3)</span>
            <input type="file" onChange={(e) => setChapter3File(e.target.files[0])} />
          </label>
          <label className="flex flex-col">
            <span className="mb-1">บทที่ 4 (chapter4)</span>
            <input type="file" onChange={(e) => setChapter4File(e.target.files[0])} />
          </label>
          <label className="flex flex-col">
            <span className="mb-1">บทที่ 5 (chapter5)</span>
            <input type="file" onChange={(e) => setChapter5File(e.target.files[0])} />
          </label>
          <label className="flex flex-col">
            <span className="mb-1">บรรณานุกรม (reference)</span>
            <input type="file" onChange={(e) => setReferenceFile(e.target.files[0])} />
          </label>
          <label className="flex flex-col">
            <span className="mb-1">ภาคผนวก (appendix)</span>
            <input type="file" onChange={(e) => setAppendixFile(e.target.files[0])} />
          </label>
          <label className="flex flex-col">
            <span className="mb-1">ประวัติผู้จัดทำ (author_bio)</span>
            <input type="file" onChange={(e) => setAuthorBioFile(e.target.files[0])} />
          </label>
          <label className="flex flex-col">
            <span className="mb-1">วิดีโอนำเสนอ (presentation_video)</span>
            <input type="file" accept="video/*" onChange={(e) => setPresentationVideoFile(e.target.files[0])} />
          </label>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <input
            type="checkbox"
            id="draft"
            checked={isDraft}
            onChange={(e) => setIsDraft(e.target.checked)}
          />
          <label htmlFor="draft">บันทึกเป็นแบบร่าง</label>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
        >
          อัปโหลดเอกสาร
        </button>
      </form>
    </div>
  );
};

export default UploadDocument;