import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, getRole } from "../utils/auth";

export default function RequireTeacher({ children }) {
  const location = useLocation();
  const token = (getToken() || "").trim();
  const role = (getRole() || "").trim().toLowerCase();

  if (!token) {
    const redirect = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (role !== "teacher") {
    return <Navigate to="/" replace />;
  }

  return children;
}