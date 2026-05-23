import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const AuthLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md notebook-card rounded-xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-[var(--accent)] rounded-lg flex items-center justify-center shadow-lg mb-3">
              <span className="text-white font-bold text-xl">TF</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-h)]">TaskFlow</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Quản lý dự án & công việc thời gian thực</p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
