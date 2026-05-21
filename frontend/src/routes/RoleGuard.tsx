import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '../types';

interface RoleGuardProps {
  roles: Role[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ roles }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // System ADMIN bypasses role limits
  if (user.role === 'ADMIN') {
    return <Outlet />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
