import axios from "axios";
import { getToken } from "../utils/auth";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      const path = window.location.pathname || "/";
      const isAuthPage = path.startsWith("/signup") || path.startsWith("/login");
      if (!isAuthPage) {
        const currentPath = `${path}${window.location.search || ""}`;
        const redirect = encodeURIComponent(currentPath || "/");
        window.location.assign(`/signup?redirect=${redirect}`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;