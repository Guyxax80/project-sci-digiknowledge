import React, { useState } from "react";
import axios from "axios";

const UploadDocument = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [file, setFile] = useState(null);
  const [isDraft, setIsDraft] = useState(false);
  const [userId, setUserId] = useState("1"); // ใช้ state สำหรับ user_id

  // const userId = localStorage.getItem("userId"); // สมมติ login แล้วเก็บ

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !file) return alert("กรุณากรอกชื่อเอกสารและเลือกไฟล์");
    if (!userId) return alert("กรุณา login ก่อนอัปโหลด");

    try {
      // ส่ง multipart เพียงครั้งเดียวให้ตรงกับ server: /api/upload (upload.single("file"))
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("keywords", keywords);
      formData.append("academic_year", academicYear);
      formData.append("user_id", userId);
      formData.append("status", isDraft ? "draft" : "published");
      formData.append("section", category || "อื่นๆ");

      console.log("=== FRONTEND DATA ===");
      console.log("Title:", title);
      console.log("Keywords:", keywords);
      console.log("Academic Year:", academicYear);
      console.log("User ID:", userId);
      console.log("Status:", isDraft ? "draft" : "published");
      console.log("Section:", category || "อื่นๆ");
      console.log("File name:", file.name);
      console.log("====================");

      const response = await axios.post("http://localhost:3000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      console.log("Server response:", response.data);

      alert("อัปโหลดเอกสารและไฟล์สำเร็จ");

      // เคลียร์ฟอร์ม
      setTitle("");
      setCategory("");
      setKeywords("");
      setAcademicYear("");
      setFile(null);
      setIsDraft(false);

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
        <input
          type="text"
          placeholder="หมวดหมู่"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="text"
          placeholder="คำค้นหา"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="text"
          placeholder="ปีการศึกษา"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />

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
