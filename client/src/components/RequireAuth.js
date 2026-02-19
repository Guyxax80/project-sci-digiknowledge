import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../utils/auth';

export default function RequireAuth({ children }) {
  const location = useLocation();
  if (!isLoggedIn()) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search || ''}`);
    return <Navigate to={`/signup?redirect=${redirect}`} replace />;
  }
  return children;
}