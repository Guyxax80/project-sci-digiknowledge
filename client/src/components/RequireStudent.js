import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn, isStudent } from '../utils/auth';

export default function RequireStudent({ children }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search || ''}`);
    return <Navigate to={`/signup?redirect=${redirect}`} replace />;
  }

  if (!isStudent()) {
    return <Navigate to="/" replace state={{ message: 'เฉพาะนักศึกษาเท่านั้นที่สามารถอัปโหลดเอกสารได้' }} />;
  }

  return children;
}