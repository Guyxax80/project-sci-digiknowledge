import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "@mui/material/Button"; // ✅ อย่าลืม import ปุ่มจาก MUI

const Navbar = ({ role }) => {
  const token = (localStorage.getItem("token") || "").trim();
  const effectiveRole = (role || localStorage.getItem("role") || "").trim().toLowerCase();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <nav className="backdrop-blur bg-brand-700/80 text-white px-4 md:px-6 py-4 shadow sticky top-0 left-0 w-full z-50 border-b border-white/10">
      <div className="container mx-auto flex items-center justify-between">
        {/* โลโก้/ชื่อเว็บ */}
        <Link
          to="/"
          className="text-lg md:text-xl font-bold mr-4 md:mr-8 tracking-wide"
        >
          SCI-DigiKnowledge
        </Link>

        {/* ปุ่มเปิดเมนูมือถือ */}
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

        {/* เมนู Desktop */}
        <div className="hidden md:flex flex-row items-center space-x-6">
          <Link
            to={token ? "/home" : "/login"}
            className={`hover:text-accent-200 transition-colors ${
              !token ? "opacity-60 cursor-not-allowed" : ""
            }`}
            onClick={(e) => {
              if (!token) e.preventDefault();
            }}
          >
            หน้าแรก
          </Link>

          {effectiveRole === "student" && token && location.pathname !== "/login" && (
            <Link to="/upload" className="hover:text-accent-200 transition-colors">
              อัปโหลดไฟล์
            </Link>
          )}

          <Link
            to={token ? "/document" : "/login"}
            className={`hover:text-accent-200 transition-colors ${
              !token ? "opacity-60 cursor-not-allowed" : ""
            }`}
            onClick={(e) => {
              if (!token) e.preventDefault();
            }}
          >
            เอกสารทั้งหมด
          </Link>


          {/* ✅ ปุ่ม "จัดการผู้ใช้งาน" เฉพาะ admin */}
          {effectiveRole === "admin" && token && (
            <Link
              to="/admin"
              className="hover:text-accent-200 transition-colors"
            >
              จัดการผู้ใช้งาน
            </Link>
          )}
          
          <Link
            to={token ? "/profile" : "/login"}
            className={`hover:text-accent-200 transition-colors ${
              !token ? "opacity-60 cursor-not-allowed" : ""
            }`}
            onClick={(e) => {
              if (!token) e.preventDefault();
            }}
          >
            Profile
          </Link>


        </div>

        {/* เมนูมือถือ */}
        {mobileOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-brand-700/95 backdrop-blur border-b border-white/10">
            <div className="px-4 py-3 space-y-2">
              <Link
                to={token ? "/home" : "/login"}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 ${!token ? "opacity-60" : ""}`}
              >
                หน้าแรก
              </Link>

              {effectiveRole === "student" && token && (
                <Link
                  to="/upload"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2"
                >
                  อัปโหลดไฟล์
                </Link>
              )}

              <Link
                to={token ? "/document" : "/login"}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 ${!token ? "opacity-60" : ""}`}
              >
                เอกสารทั้งหมด
              </Link>

              <Link
                to={token ? "/profile" : "/login"}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 ${!token ? "opacity-60" : ""}`}
              >
                Profile
              </Link>

              {/* ✅ ปุ่มสำหรับ mobile เฉพาะ admin */}
              {effectiveRole === "admin" && token && (
                <Link
                to={token ? "/admin" : "/login"}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 ${!token ? "opacity-60" : ""}`}
              >
                จัดการผู้ใช้งาน
              </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
