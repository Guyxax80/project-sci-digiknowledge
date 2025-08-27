import React, { useState, useEffect } from "react";
import axios from "axios";

const sections = [
  "ปก",
  "บทคัดย่อ",
  "กิตติกรรมประกาศ",
  "สารบัญ",
  "บทที่1",
  "บทที่2",
  "บทที่3",
  "บทที่4",
  "บทที่5",
  "บรรณานุกรม",
  "ภาคผนวก",
  "ประวัติผู้จัดทำปริญญานิพนธ์",
];

const UploadDocument = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [files, setFiles] = useState({}); // เก็บไฟล์ตาม section
  const [isDraft, setIsDraft] = useState(false);

  // สมมติ userId จาก login (localStorage)
  const userId = localStorage.getItem("userId"); // ต้องมีตอน login

  const handleFileChange = (section, file) => {
    setFiles((prev) => ({ ...prev, [section]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title) return alert("กรุณากรอกชื่อเอกสาร");
    if (!userId) return alert("กรุณา login ก่อนอัปโหลด");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("keywords", keywords);
    formData.append("academic_year", academicYear);
    formData.append("user_id", userId);
    formData.append("is_draft", isDraft);

    // เพิ่มไฟล์แต่ละ section
    Object.entries(files).forEach(([section, file]) => {
      if (file) formData.append(`files[${section}]`, file);
    });

    try {
      const res = await axios.post("http://localhost:3000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("อัปโหลดสำเร็จ: " + res.data.message);

      // เคลียร์ฟอร์ม
      setTitle("");
      setCategory("");
      setKeywords("");
      setAcademicYear("");
      setFiles({});
      setIsDraft(false);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการอัปโหลด");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto border rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">อัปโหลดเอกสารปริญญานิพนธ์</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="ชื่อเอกสาร"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="text"
          placeholder="หมวดหมู่"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="text"
          placeholder="คำค้นหา (คั่นด้วย ,)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="text"
          placeholder="ปีการศึกษา (เช่น 2567)"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        <h3 className="font-semibold mt-4">เลือกไฟล์แต่ละหัวข้อ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sections.map((section) => (
            <div key={section} className="flex flex-col">
              <label className="font-medium">{section}</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(section, e.target.files[0])}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-4">
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
