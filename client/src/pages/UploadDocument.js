import React, { useState } from "react";

export default function UploadDocument() {
  const [formData, setFormData] = useState({
    user_id: "",
    title: "",
    keywords: "",
    academic_year: "",
    categorie_id: ""
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  // ฟังก์ชันอัปเดตข้อมูลใน formData
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ฟังก์ชันอัปเดตไฟล์
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // ฟังก์ชัน submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    if (file) {
      data.append("file", file);
    }

    try {
      const res = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: data
      });

      const result = await res.json();
      if (res.ok) {
        setMessage(`✅ อัปโหลดสำเร็จ Document ID: ${result.documentId}`);
      } else {
        setMessage(`❌ อัปโหลดไม่สำเร็จ: ${result.message}`);
      }
    } catch (err) {
      setMessage("❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">📂 อัปโหลดเอกสาร</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="user_id"
          placeholder="User ID"
          value={formData.user_id}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          name="title"
          placeholder="ชื่อเอกสาร"
          value={formData.title}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          name="keywords"
          placeholder="Keywords"
          value={formData.keywords}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="academic_year"
          placeholder="ปีการศึกษา"
          value={formData.academic_year}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="categorie_id"
          placeholder="Category ID"
          value={formData.categorie_id}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="file"
          onChange={handleFileChange}
          className="w-full border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          อัปโหลด
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
