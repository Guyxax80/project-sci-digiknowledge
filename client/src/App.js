import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Upload from "./pages/Upload";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/studentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard"; // หากมีหน้า teacher
import Home from "./pages/Home";
import DocumentPage from "./pages/DocumentPage";
import './output.css'
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import UploadDocument from "./pages/UploadDocument";
import DocumentDetailTailwind from "./pages/DocumentDetailTailwind";
function App() {
  return (
    <Router>
      <Navbar />
      <Routes>

        <Route path="/upload" element={<Upload />} />
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/document" element={<DocumentPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/upload-document" element={<UploadDocument />} />
        <Route path="/document-detail/:id" element={<DocumentDetailTailwind />} />
      </Routes>
    </Router>
  );
}

export default App;
