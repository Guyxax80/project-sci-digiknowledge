import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, clearAuth } from "../utils/auth";

export default function RequireAuth({ children }) {
  const token = getToken();
  const location = useLocation();

  const currentPath = `${location.pathname}${location.search || ""}${location.hash || ""}`;
  const redirect = encodeURIComponent(currentPath || "/");

  // ✅ ไม่มี token -> ล้าง auth ทั้งหมด กัน role ค้าง
  if (!token) {
    clearAuth();
    return <Navigate to={`/signup?redirect=${redirect}`} replace />;
  }

  // ✅ ถ้าต้องการเข้มขึ้น: token ต้องดูเหมือน JWT (3 ส่วนคั่นด้วย .)
  // กันเคส token เป็น "undefined" หรือค่าแปลก ๆ
  const looksLikeJwt = token.split(".").length === 3;
  if (!looksLikeJwt) {
    clearAuth();
    return <Navigate to={`/signup?redirect=${redirect}`} replace />;
  }

  return children;
}