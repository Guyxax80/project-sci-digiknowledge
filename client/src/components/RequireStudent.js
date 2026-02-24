import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, isStudent } from "../utils/auth";

export default function RequireStudent({ children }) {
  const token = (getToken() || "").trim();
  const location = useLocation();

  // ✅ ยังไม่ล็อกอิน → ไปหน้า login และพก redirect กลับมาหน้าเดิม
  if (!token) {
    const currentPath = `${location.pathname}${location.search || ""}${location.hash || ""}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(currentPath || "/")}`}
        replace
      />
    );
  }

  // ✅ ล็อกอินแล้วแต่ไม่ใช่ student → ส่งกลับหน้าแรก (หรือจะส่งไป /profile ก็ได้)
  if (!isStudent()) {
    return (
      <Navigate
        to="/"
        replace
        state={{ message: "บัญชีนี้ไม่ใช่นักศึกษา จึงไม่สามารถเข้าใช้งานหน้านี้ได้" }}
      />
    );
  }

  return children;
}