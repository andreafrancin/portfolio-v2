import React from 'react';
import { Navigate } from 'react-router-dom';

function isTokenValid(token: string | null) {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    return exp > now;
  } catch {
    return false;
  }
}

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const accessToken = localStorage.getItem('access_token');

  if (!isTokenValid(accessToken)) {
    // Redirect to login if no valid token
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
