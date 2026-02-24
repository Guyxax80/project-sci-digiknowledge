// src/services/api.js
import axios from "axios";
import { getToken, clearAuth } from "../utils/auth";

// ทำให้ baseURL ลงท้ายด้วย /api เสมอ
function normalizeApiBase(url) {
  const u = (url || "").trim().replace(/\/+$/, ""); // ตัด / ท้าย
  if (!u) return "https://api.sci-digiknowledge.com/api";
  return u.endsWith("/api") ? u : `${u}/api`;
}

// ===== Toast helper (ยิง event ไปให้ UI ฟัง) =====
function emitToast({ message, severity = "warning" }) {
  try {
    if (typeof window === "undefined") return;
    if (!message) return;

    window.dispatchEvent(
      new CustomEvent("app-toast", {
        detail: { message, severity },
      })
    );
  } catch (_) {}
}

function pickErrorMessage(error) {
  const data = error?.response?.data;

  // รองรับหลายรูปแบบ
  const msg =
    data?.message ||
    data?.error ||
    data?.detail ||
    data?.msg ||
    (typeof data === "string" ? data : "") ||
    error?.message ||
    "เกิดข้อผิดพลาด";

  // ถ้ามี missing sections ให้ต่อท้ายให้รู้ว่าขาดอะไร
  // (server ควรส่ง { missing: [...] } หรือ { missingSections: [...] })
  const missing =
    data?.missing ||
    data?.missingSections ||
    data?.missing_sections ||
    null;

  if (Array.isArray(missing) && missing.length) {
    return `${msg}\nขาด: ${missing.join(", ")}`;
  }

  return String(msg);
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

    // ===== Network error (ไม่มี status) =====
    if (!status) {
      emitToast({
        severity: "error",
        message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (Network error)",
      });
      return Promise.reject(error);
    }

    const path = window.location.pathname || "/";
    const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");

    const msg = pickErrorMessage(error);

    const tokenInvalid =
      status === 401 ||
      (status === 403 && /token.*(invalid|expired)/i.test(String(msg)));

    // ===== Token invalid -> redirect login (เดิมของคุณ) =====
    if (tokenInvalid && !isAuthPage) {
      try {
        if (typeof clearAuth === "function") clearAuth();
      } catch (_) {}

      // (เลือกว่าจะ toast ก่อน redirect ได้)
      emitToast({
        severity: "warning",
        message: "กรุณาเข้าสู่ระบบใหม่ (Token หมดอายุ/ไม่ถูกต้อง)",
      });

      const currentPath = `${path}${window.location.search || ""}`;
      const redirect = encodeURIComponent(currentPath || "/");
      window.location.assign(`/login?redirect=${redirect}`);
      return;
    }

    // ===== แจ้งเตือนทุก error ที่เหลือ (รวม 400 เอกสารไม่ครบ) =====
    // 5xx ให้เป็น error, 4xx ให้เป็น warning
    emitToast({
      severity: status >= 500 ? "error" : "warning",
      message: msg,
    });

    return Promise.reject(error);
  }
);

export default api;