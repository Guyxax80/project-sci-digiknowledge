import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../utils/auth";

export default function RequireAuth({ children }) {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to={`/signup?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return children;
}