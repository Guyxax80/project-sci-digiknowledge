import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-blue-700 text-white px-6 py-4 shadow fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto flex flex-row items-center justify-between">
        <Link to="/" className="text-xl font-bold mr-8">
          SCI-DigiKnowledge
        </Link>
        <div className="flex flex-row space-x-8">
          <Link to="/" className="hover:underline">
            หน้าแรก
          </Link>
          <Link to="/upload" className="hover:underline">
            อัปโหลดไฟล์
          </Link>
          <Link to="/login" className="hover:underline">
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;