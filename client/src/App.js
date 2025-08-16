import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Upload from "./pages/Upload";
import DocumentList from "./pages/DocumentList";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import './input.css'
import './output.css'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <div className="p-5 text-center space-y-4">
              <h1 className="text-2xl font-bold">ยินดีต้อนรับสู่ SCI-DigiKnowledge</h1>
              <p className="text-gray-600">เลือกเมนูด้านบนเพื่อเริ่มต้นใช้งาน</p>
              <div className="flex justify-center gap-4">
                <Link
                  to="/upload"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
                >
                  อัปโหลดไฟล์
                </Link>
                <Link
                  to="/documents"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl"
                >
                  เอกสารทั้งหมด
                </Link>
                <Link
                  to="/login"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
            </div>
          }
        />
        <Route path="/upload" element={<Upload />} />
        <Route path="/documents" element={<DocumentList />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
