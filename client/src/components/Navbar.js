import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

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
        <div className="hidden md:flex flex-row space-x-6">
          <Link to={token ? "/home" : "/login"} className={`hover:text-accent-200 transition-colors ${!token ? "opacity-60 cursor-not-allowed" : ""}`} onClick={(e) => { if (!token) e.preventDefault(); }}>
            หน้าแรก
          </Link>

          {/* เฉพาะ student และไม่ใช่หน้า login เท่านั้น */}
          {effectiveRole === "student" && token && location.pathname !== "/login" && (
            <Link to="/upload" className="hover:text-accent-200 transition-colors">
              อัปโหลดไฟล์
            </Link>
          )}

          <Link to={token ? "/document" : "/login"} className={`hover:text-accent-200 transition-colors ${!token ? "opacity-60 cursor-not-allowed" : ""}`} onClick={(e) => { if (!token) e.preventDefault(); }}>
            เอกสารทั้งหมด
          </Link>
          <Link to={token ? "/profile" : "/login"} className={`hover:text-accent-200 transition-colors ${!token ? "opacity-60 cursor-not-allowed" : ""}`} onClick={(e) => { if (!token) e.preventDefault(); }}>
            Profile
          </Link>
          {/*!token ? (
            <Link to="/login" className="hover:underline">
              Login
            </Link>
          ) : (
            <button
              className="hover:underline"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                window.location.href = "/login";
              }}
            >
              Logout
            </button>
          )}*/}
        </div>
        {mobileOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-brand-700/95 backdrop-blur border-b border-white/10">
            <div className="px-4 py-3 space-y-2">
              <Link to={token ? "/home" : "/login"} onClick={() => setMobileOpen(false)} className={`block py-2 ${!token ? "opacity-60" : ""}`}>หน้าแรก</Link>
              {effectiveRole === "student" && token && location.pathname !== "/login" && (
                <Link to="/upload" onClick={() => setMobileOpen(false)} className="block py-2">อัปโหลดไฟล์</Link>
              )}
              <Link to={token ? "/document" : "/login"} onClick={() => setMobileOpen(false)} className={`block py-2 ${!token ? "opacity-60" : ""}`}>เอกสารทั้งหมด</Link>
              <Link to={token ? "/profile" : "/login"} onClick={() => setMobileOpen(false)} className={`block py-2 ${!token ? "opacity-60" : ""}`}>Profile</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;