import { api } from '../config/axios';
import type { User } from '../types';

export interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  activeLeaders: number;
  systemStatus: string;
}

export const adminApi = {
  getUsers: async (params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get<{
      success: boolean;
      data: User[];
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>('/admin/users', { params });
    return res.data;
  },

  updateUserRole: async (id: string, role: string) => {
    const res = await api.patch<{ success: boolean; data: User }>(`/admin/users/${id}/role`, { role });
    return res.data.data;
  },

  updateUserStatus: async (id: string, isActive: boolean) => {
    const res = await api.patch<{ success: boolean; data: User }>(`/admin/users/${id}/status`, { isActive });
    return res.data.data;
  },

  getStats: async () => {
    const res = await api.get<{ success: boolean; data: AdminStats }>('/admin/stats');
    return res.data.data;
  },
};
