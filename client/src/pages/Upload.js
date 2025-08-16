import React, { useState } from 'react';
import axios from 'axios';

function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [userId, setUserId] = useState(''); // เริ่มต้นเป็นค่าว่าง

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('กรุณาเลือกไฟล์');
    if (!userId) return alert('กรุณากรอก User ID');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('keywords', keywords);
    formData.append('academic_year', academicYear);
    formData.append('user_id', userId);

    try {
      const res = await axios.post('http://localhost:3000/api/upload', formData);
      alert('อัปโหลดสำเร็จ: ' + res.data.message);
      // เคลียร์ฟอร์มถ้าต้องการ
      setFile(null);
      setTitle('');
      setCategory('');
      setKeywords('');
      setAcademicYear('');
      setUserId('');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
      console.error(err);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">อัปโหลดเอกสาร</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
        <input type="text" placeholder="ชื่อเอกสาร" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input type="text" placeholder="หมวดหมู่" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input type="text" placeholder="คำค้นหา (คั่นด้วย ,)" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
        <input type="text" placeholder="ปีการศึกษา (เช่น 2567)" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
        <input
          type="number"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          min="1"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">อัปโหลด</button>
      </form>
    </div>
  );
}

export default Upload;
