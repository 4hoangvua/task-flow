import { api } from '../config/axios';
import type { Notification } from '../types';

export const notificationApi = {
  getNotifications: async (params?: { page?: number; limit?: number }) => {
    const res = await api.get<{ success: boolean; data: Notification[]; unreadCount: number; meta: any }>('/notifications', { params });
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};
