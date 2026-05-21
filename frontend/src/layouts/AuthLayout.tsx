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
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
              <span className="text-white font-bold text-xl">TF</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">TaskFlow</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý dự án & công việc thời gian thực</p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
