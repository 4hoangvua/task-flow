import { api } from '../config/axios';
import type { Project, ProjectMember } from '../types';

export const projectApi = {
  getProjects: async (params?: { status?: string; page?: number; limit?: number }) => {
    const res = await api.get<{ success: boolean; data: Project[]; meta: any }>('/projects', { params });
    return res.data;
  },

  createProject: async (data: { name: string; description?: string }) => {
    const res = await api.post<{ success: boolean; data: Project }>('/projects', data);
    return res.data.data;
  },

  getProjectById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Project }>(`/projects/${id}`);
    return res.data.data;
  },

  updateProject: async (id: string, data: { name?: string; description?: string; status?: string }) => {
    const res = await api.patch<{ success: boolean; data: Project }>(`/projects/${id}`, data);
    return res.data.data;
  },

  deleteProject: async (id: string) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },

  getMembers: async (id: string) => {
    const res = await api.get<{ success: boolean; data: ProjectMember[] }>(`/projects/${id}/members`);
    return res.data.data;
  },

  addMember: async (id: string, data: { email: string; role?: string }) => {
    const res = await api.post<{ success: boolean; data: ProjectMember }>(`/projects/${id}/members`, data);
    return res.data.data;
  },

  updateMemberRole: async (id: string, uid: string, data: { role: string }) => {
    const res = await api.patch<{ success: boolean; data: ProjectMember }>(`/projects/${id}/members/${uid}`, data);
    return res.data.data;
  },

  deleteMember: async (id: string, uid: string) => {
    const res = await api.delete(`/projects/${id}/members/${uid}`);
    return res.data;
  },
};
