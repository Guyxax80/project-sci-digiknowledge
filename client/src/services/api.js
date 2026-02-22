import axios from "axios";
import { getToken, clearAuth } from "../utils/auth";

const baseURL =
  process.env.REACT_APP_API_URL ||
  "https://project-sci-digiknowledge.onrender.com"; // ✅ fallback กัน env ว่าง

const api = axios.create({
  baseURL,
  timeout:  180000,
});

api.interceptors.request.use((config) => {
  const token = getToken?.();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window === "undefined") return Promise.reject(error);

    // ✅ ถ้าเป็น network error (ไม่มี response) ไม่ต้อง redirect
    const status = error?.response?.status;
    if (!status) return Promise.reject(error);

    const path = window.location.pathname || "/";
    const isAuthPage =
      path.startsWith("/login") ||
      path.startsWith("/signup");

    // ✅ redirect เฉพาะ 401 เท่านั้น
    if (status === 401 && !isAuthPage) {
      try {
        if (typeof clearAuth === "function") clearAuth();
      } catch (_) {}

      const currentPath = `${path}${window.location.search || ""}`;
      const redirect = encodeURIComponent(currentPath || "/");
      window.location.assign(`/login?redirect=${redirect}`);
    }

    // ✅ 403 ปล่อยให้หน้าจัดการเอง (ไม่เด้งออก)
    return Promise.reject(error);
  }
);

export default api;