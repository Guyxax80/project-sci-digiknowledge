import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Upload from "./pages/Upload";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/studentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard"; // หากมีหน้า teacher
import Home from "./pages/Home";
import DocumentPage from "./pages/DocumentPage";
import './output.css'

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
        <Route path="/document/:id" element={<DocumentPage />} />
      </Routes>
    </Router>
  );
}

export default App;
