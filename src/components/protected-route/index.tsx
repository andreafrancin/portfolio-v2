import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ensureFreshToken, secondsLeft } from '../../api-client/api-client';
import Spinner from '../spinner';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [state, setState] = useState<'checking' | 'ok' | 'out'>(() =>
    secondsLeft(localStorage.getItem('access_token')) > 60 ? 'ok' : 'checking'
  );

  useEffect(() => {
    if (state !== 'checking') return;
    let alive = true;
    ensureFreshToken().then((token) => {
      if (alive) setState(token ? 'ok' : 'out');
    });
    return () => {
      alive = false;
    };
  }, [state]);

  if (state === 'out') return <Navigate to="/login" replace />;
  if (state === 'checking') {
    return (
      <div className="admin-state" aria-busy="true">
        <Spinner size={24} />
      </div>
    );
  }
  return children;
};

export default ProtectedRoute;
