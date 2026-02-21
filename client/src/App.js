import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';

import Home from './pages/Home';
import DocumentPage from './pages/DocumentPage';
import DocumentDetailTailwind from './pages/DocumentDetailTailwind';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Upload from './pages/Upload';
import AdminCRUD from './pages/AdminDashboard';

// ✅ เพิ่มหน้าเหล่านี้ถ้ามี/จะทำ
// import PendingApprovals from './pages/PendingApprovals';
// import DownloadPage from './pages/DownloadPage';

import RequireAuth from './components/RequireAuth';
import RequireStudent from './components/RequireStudent';
// import RequireTeacher from './components/RequireTeacher'; // ถ้ามี role teacher

import './output.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* ===== Public routes (ไม่ต้องล็อกอิน) ===== */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/document" element={<DocumentPage />} />
        <Route path="/document-detail/:id" element={<DocumentDetailTailwind />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ===== Protected routes ===== */}
        {/* นักศึกษาเท่านั้น: อัปโหลด/ส่งงาน */}
        <Route
          path="/upload"
          element={
            <RequireStudent>
              <Upload />
            </RequireStudent>
          }
        />

        {/* ผู้ใช้ที่ล็อกอินแล้ว: โปรไฟล์ */}
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        {/* แอดมิน/อาจารย์ (แล้วแต่ RequireAuth ของคุณตรวจ role ยังไง) */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminCRUD />
            </RequireAuth>
          }
        />

        {/* ✅ ตัวอย่าง: หน้า “รออนุมัติ” สำหรับอาจารย์ */}
        {/*
        <Route
          path="/approvals"
          element={
            <RequireTeacher>
              <PendingApprovals />
            </RequireTeacher>
          }
        />
        */}

        {/* ✅ สำคัญ: ถ้าคุณมีปุ่มดาวน์โหลด ให้พาไป route นี้แล้วค่อยเรียก API ดาวน์โหลด (ล็อกอินก่อน) */}
        {/*
        <Route
          path="/download/:fileId"
          element={
            <RequireAuth>
              <DownloadPage />
            </RequireAuth>
          }
        />
        */}

        {/* ===== Fallback ===== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;