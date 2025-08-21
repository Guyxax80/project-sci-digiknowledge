import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Upload from "./pages/Upload";
import DocumentList from "./pages/DocumentList";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
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
              <p className="text-gray-600">เลือกเมนูด้านบนเพื่อเริ่มต้น</p>
            </div>
          }
        />
        <Route path="/upload" element={<Upload />} />
        <Route path="/documents" element={<DocumentList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
