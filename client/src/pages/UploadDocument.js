import React, { useEffect, useState } from "react";
import axios from "axios";

export default function UploadDocument() {
  const [formData, setFormData] = useState({
    user_id: "",
    title: "",
    keywords: "",
    academic_year: ""
  });
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
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

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/categories");
        setCategories(res.data || []);
      } catch (err) {
        console.error("โหลดหมวดหมู่ไม่สำเร็จ", err);
      }
    };
    loadCategories();
  }, []);

  // ฟังก์ชัน submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("categorie_ids", JSON.stringify(selectedCategoryIds));
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
