// src/utils/auth.js
export const getToken = () => (localStorage.getItem("token") || "").trim();

export const getRole = () =>
  (localStorage.getItem("role") || "").trim().toLowerCase();

export const getUserId = () => localStorage.getItem("userId");

export const isLoggedIn = () => Boolean(getToken());

export const isStudent = () => getRole() === "student";

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
};