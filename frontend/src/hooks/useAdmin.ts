/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { message } from '../utils/antd';

export const useAdminUsers = (params?: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['adminUsers', params],
    queryFn: () => adminApi.getUsers(params),
  });
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getStats(),
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminApi.updateUserRole(id, role),
    onSuccess: () => {
      message.success('Cập nhật vai trò hệ thống thành công!');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Cập nhật vai trò thất bại!');
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateUserStatus(id, isActive),
    onSuccess: (data) => {
      const statusText = data.isActive ? 'mở khóa' : 'khóa';
      message.success(`Đã ${statusText} tài khoản người dùng thành công!`);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Thay đổi trạng thái thất bại!');
    },
  });
};
