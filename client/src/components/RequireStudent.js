import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, getRole } from "../utils/auth";

export default function RequireStudent({ children }) {
  const token = getToken();
  const role = getRole();
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to={`/signup?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (role !== "student") {
    // จะใช้ toast ก็ได้ แต่ขอแบบสั้น ๆ ก่อน
    alert("ต้องเป็นสถานะ student เท่านั้นจึงจะอัปโหลดได้");
    return <Navigate to="/" replace />;
  }

  return children;
}