import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = ({ role }) => {
  const token = (localStorage.getItem("token") || "").trim();
  const effectiveRole = (role || localStorage.getItem("role") || "").trim().toLowerCase();
  const location = useLocation();

  return (
    <nav className="bg-blue-700 text-white px-6 py-4 shadow fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto flex flex-row items-center justify-between">
        <Link to="/" className="text-xl font-bold mr-8">
          SCI-DigiKnowledge
        </Link>
        <div className="flex flex-row space-x-8">
          <Link to={token ? "/home" : "/login"} className={`hover:underline ${!token ? "opacity-60 cursor-not-allowed" : ""}`} onClick={(e) => { if (!token) e.preventDefault(); }}>
            หน้าแรก
          </Link>

          {/* เฉพาะ student และไม่ใช่หน้า login เท่านั้น */}
          {effectiveRole === "student" && token && location.pathname !== "/login" && (
            <Link to="/upload" className="hover:underline">
              อัปโหลดไฟล์
            </Link>
          )}

          <Link to={token ? "/document/1" : "/login"} className={`hover:underline ${!token ? "opacity-60 cursor-not-allowed" : ""}`} onClick={(e) => { if (!token) e.preventDefault(); }}>
            เอกสารทั้งหมด
          </Link>
          <Link to={token ? "/profile" : "/login"} className={`hover:underline ${!token ? "opacity-60 cursor-not-allowed" : ""}`} onClick={(e) => { if (!token) e.preventDefault(); }}>
            Profile
          </Link>
          {!token ? (
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
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
