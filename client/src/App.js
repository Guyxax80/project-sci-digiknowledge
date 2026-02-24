import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import DocumentPage from "./pages/DocumentPage";
import DocumentDetailTailwind from "./pages/DocumentDetailTailwind";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Upload from "./pages/Upload";
import AdminCRUD from "./pages/AdminDashboard";

// ✅ หน้าใหม่: ผลงานของฉัน (Student)
import MyDocuments from "./pages/MyDocuments";

// ✅ หน้า "ประวัติการอนุมัติ" (Teacher)
import TeacherApprovalHistory from "./pages/TeacherApprovalHistory";

// ✅ Guards
import RequireAuth from "./components/RequireAuth";
import RequireStudent from "./components/RequireStudent";
import RequireTeacher from "./components/RequireTeacher";

import "./output.css";

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

        {/* ✅ นักศึกษาเท่านั้น: ผลงานของฉัน */}
        <Route
          path="/my-documents"
          element={
            <RequireStudent>
              <MyDocuments />
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

        {/* แอดมิน */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminCRUD />
            </RequireAuth>
          }
        />

        {/* ครู: ประวัติการอนุมัติ (Timeline) */}
        <Route
          path="/teacher/history"
          element={
            <RequireTeacher>
              <TeacherApprovalHistory />
            </RequireTeacher>
          }
        />

        {/* ===== Fallback ===== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;