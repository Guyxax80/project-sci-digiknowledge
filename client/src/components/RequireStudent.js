import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, isStudent } from "../utils/auth";

export default function RequireStudent({ children }) {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    const currentPath = `${location.pathname}${location.search || ""}${location.hash || ""}`;
    return (
      <Navigate
        to={`/signup?redirect=${encodeURIComponent(currentPath || "/")}`}
        replace
      />
    );
  }

  if (!isStudent()) {
    return (
      <Navigate
        to="/"
        replace
        state={{ message: "บัญชีนี้ไม่ใช่นักศึกษา จึงไม่สามารถเข้าใช้งานหน้าอัปโหลดได้" }}
      />
    );
  }

  return children;
}