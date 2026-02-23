// src/services/api.js
import axios from "axios";
import { getToken, clearAuth } from "../utils/auth";

// ทำให้ baseURL ลงท้ายด้วย /api เสมอ
function normalizeApiBase(url) {
  const u = (url || "").trim().replace(/\/+$/, ""); // ตัด / ท้าย
  if (!u) return "https://api.sci-digiknowledge.com/api";
  return u.endsWith("/api") ? u : `${u}/api`;
}

// ถ้า .env ใส่เป็น https://api.sci-digiknowledge.com ก็ได้
// หรือใส่เป็น https://api.sci-digiknowledge.com/api ก็ได้
// โค้ดนี้จะ normalize ให้ถูกเอง
const baseURL = normalizeApiBase(process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL,
  timeout: 180000,
});

// แนบ token
api.interceptors.request.use(
  (config) => {
    const token = typeof getToken === "function" ? getToken() : "";
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ถ้า token หมดอายุ/ไม่ถูกต้อง -> clear แล้วไป login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window === "undefined") return Promise.reject(error);

    const status = error?.response?.status;
    if (!status) return Promise.reject(error); // network error

    const path = window.location.pathname || "/";
    const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");

    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "";

    const tokenInvalid =
      status === 401 ||
      (status === 403 && /token.*(invalid|expired)/i.test(String(msg)));

    if (tokenInvalid && !isAuthPage) {
      try {
        if (typeof clearAuth === "function") clearAuth();
      } catch (_) {}

      const currentPath = `${path}${window.location.search || ""}`;
      const redirect = encodeURIComponent(currentPath || "/");
      window.location.assign(`/login?redirect=${redirect}`);
      return;
    }

    return Promise.reject(error);
  }
);

export default api;