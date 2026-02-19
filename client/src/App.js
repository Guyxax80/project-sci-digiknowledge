import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Upload from './pages/Upload';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import AdminCRUD from './pages/AdminDashboard';
import Home from './pages/Home';
import DocumentPage from './pages/DocumentPage';
import './output.css';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import DocumentDetailTailwind from './pages/DocumentDetailTailwind';
import RequireAuth from './components/RequireAuth';
import RequireStudent from './components/RequireStudent';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/upload" element={<RequireStudent><Upload /></RequireStudent>} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<RequireAuth><AdminCRUD /></RequireAuth>} />
        <Route path="/document" element={<DocumentPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/document-detail/:id" element={<DocumentDetailTailwind />} />
      </Routes>
    </Router>
  );
}

export default App;