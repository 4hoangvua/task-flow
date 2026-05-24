import { api } from '../config/axios';
import type { User } from '../types';

export const authApi = {
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (data: any) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  getMe: async () => {
    const res = await api.get< { success: boolean; data: User } >('/auth/me');
    return res.data.data;
  },

  updateMe: async (data: any) => {
    const res = await api.patch< { success: boolean; data: User } >('/auth/me', data);
    return res.data.data;
  },

  changePassword: async (data: any) => {
    const res = await api.patch('/auth/password', data);
    return res.data;
  },

  searchUsers: async (query: string) => {
    const res = await api.get<{ success: boolean; data: User[] }>('/auth/users/search', { params: { query } });
    return res.data.data;
  },
};
