import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getToken, getRole, clearAuth } from "../utils/auth";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const token = (getToken() || "").trim();
  const role = (getRole() || "").trim().toLowerCase();

  const isLoggedIn = Boolean(token);
  const isStudent = isLoggedIn && role === "student";
  const isTeacher = isLoggedIn && role === "teacher";
  const isAdmin = isLoggedIn && role === "admin";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const goAuth = (redirectTo) => {
    const redirect = encodeURIComponent(redirectTo || "/");
    // จะไป login หรือ signup ก็ได้ แล้วแต่ระบบคุณ
    navigate(`/login?redirect=${redirect}`);
    // ถ้าใช้ signup เป็นหน้าเดียว: navigate(`/signup?redirect=${redirect}`);
  };

  const handleUploadClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) return goAuth("/upload");
    if (!isStudent) return alert("ต้องเป็นสถานะ student เท่านั้นจึงจะอัปโหลดได้");
    navigate("/upload");
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) return goAuth("/profile");
    navigate("/profile");
  };

  const handleAdminClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) return goAuth("/admin");
    if (!isAdmin) return alert("ต้องเป็น admin เท่านั้น");
    navigate("/admin");
  };

  const handleApproveClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) return goAuth("/approve");
    if (!isTeacher) return alert("ต้องเป็น teacher เท่านั้น");
    navigate("/approve");
  };

  {const handleLogout = (e) => {
    e.preventDefault();
    clearAuth();
    navigate("/");
  };}

  // ===== เมนูตามเงื่อนไขของคุณ =====
  // ยังไม่ login: หน้าแรก / เอกสารทั้งหมด / อัปโหลดไฟล์ / Profile
  // student: หน้าแรก / เอกสารทั้งหมด / อัปโหลดไฟล์ / Profile
  // admin: หน้าแรก / เอกสารทั้งหมด / จัดการผู้ใช้งาน / Profile
  // teacher: หน้าแรก / เอกสารทั้งหมด / อนุมัติผลงาน / Profile

  return (
    <nav className="backdrop-blur bg-brand-700/80 text-white px-4 md:px-6 py-4 shadow sticky top-0 left-0 w-full z-50 border-b border-white/10">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-lg md:text-xl font-bold mr-4 md:mr-8 tracking-wide">
          SCI-DigiKnowledge
        </Link>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          className="md:hidden cursor-pointer p-2 -mr-2"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="block w-6 h-0.5 bg-white mb-1"></span>
          <span className="block w-6 h-0.5 bg-white mb-1"></span>
          <span className="block w-6 h-0.5 bg-white"></span>
        </button>

        {/* ===== Desktop ===== */}
        <div className="hidden md:flex flex-row items-center space-x-6">
          {/* แสดงเสมอ */}
          <Link to="/home" className="hover:text-accent-200 transition-colors">
            หน้าแรก
          </Link>

          <Link to="/document" className="hover:text-accent-200 transition-colors">
            เอกสารทั้งหมด
          </Link>

          {/* student หรือยังไม่ login: แสดง "อัปโหลดไฟล์" */}
          {(!isLoggedIn || isStudent) && (
            <Link
              to="/upload"
              className="hover:text-accent-200 transition-colors"
              onClick={handleUploadClick}
              title={!isLoggedIn ? "ต้องเข้าสู่ระบบ" : !isStudent ? "ต้องเป็น student" : ""}
            >
              อัปโหลดไฟล์
            </Link>
          )}

          {/* teacher: แสดง "อนุมัติผลงาน" */}
          {isTeacher && (
            <Link
              to="/approve"
              className="hover:text-accent-200 transition-colors"
              onClick={handleApproveClick}
            >
              อนุมัติผลงาน
            </Link>
          )}

          {/* admin: แสดง "จัดการผู้ใช้งาน" */}
          {isAdmin && (
            <Link
              to="/admin"
              className="hover:text-accent-200 transition-colors"
              onClick={handleAdminClick}
            >
              จัดการผู้ใช้งาน
            </Link>
          )}

          {/* แสดง Profile เสมอ */}
          <Link
            to="/profile"
            className="hover:text-accent-200 transition-colors"
            onClick={handleProfileClick}
          >
            Profile
          </Link>

          {/* ปุ่มออกจากระบบ (แสดงเฉพาะตอน login) */}
          {/*isLoggedIn && (
            <button
              onClick={handleLogout}
              className="hover:text-accent-200 transition-colors"
            >
              ออกจากระบบ
            </button>
          )*/}
        </div>

        {/* ===== Mobile ===== */}
        {mobileOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-brand-700/95 backdrop-blur border-b border-white/10">
            <div className="px-4 py-3 space-y-2">
              <Link to="/home" className="block py-2" onClick={() => setMobileOpen(false)}>
                หน้าแรก
              </Link>

              <Link to="/document" className="block py-2" onClick={() => setMobileOpen(false)}>
                เอกสารทั้งหมด
              </Link>

              {(!isLoggedIn || isStudent) && (
                <Link
                  to="/upload"
                  className="block py-2"
                  onClick={(e) => {
                    setMobileOpen(false);
                    handleUploadClick(e);
                  }}
                >
                  อัปโหลดไฟล์
                </Link>
              )}

              {isTeacher && (
                <Link
                  to="/approve"
                  className="block py-2"
                  onClick={(e) => {
                    setMobileOpen(false);
                    handleApproveClick(e);
                  }}
                >
                  อนุมัติผลงาน
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className="block py-2"
                  onClick={(e) => {
                    setMobileOpen(false);
                    handleAdminClick(e);
                  }}
                >
                  จัดการผู้ใช้งาน
                </Link>
              )}

              <Link
                to="/profile"
                className="block py-2"
                onClick={(e) => {
                  setMobileOpen(false);
                  handleProfileClick(e);
                }}
              >
                Profile
              </Link>

              {/*isLoggedIn && (
                <button
                  className="block py-2 text-left w-full"
                  onClick={(e) => {
                    setMobileOpen(false);
                    handleLogout(e);
                  }}
                >
                  ออกจากระบบ
                </button>
              )*/}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;