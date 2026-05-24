import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../stores/authStore';
import { message } from '../utils/antd';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logoutStore = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      const { user, accessToken, refreshToken } = data.data;
      setAuth(user, accessToken, refreshToken);
      message.success('Đăng nhập thành công!');
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      const { user, accessToken, refreshToken } = data.data;
      setAuth(user, accessToken, refreshToken);
      message.success('Đăng ký tài khoản thành công!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Đăng ký thất bại. Vui lòng kiểm tra lại!');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
      message.success('Đăng xuất thành công!');
    },
    onError: () => {
      // Even if API logout fails, clear local session
      logoutStore();
      queryClient.clear();
    },
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (updatedUser) => {
      // Merge with store user
      const currentAccessToken = useAuthStore.getState().accessToken;
      const currentRefreshToken = localStorage.getItem('refreshToken') || '';
      setAuth(updatedUser, currentAccessToken!, currentRefreshToken);
      message.success('Cập nhật thông tin cá nhân thành công!');
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Cập nhật thông tin thất bại!');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      message.success('Đổi mật khẩu thành công!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Đổi mật khẩu thất bại!');
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    user: meQuery.data || useAuthStore.getState().user,
    isLoadingUser: meQuery.isLoading && isAuthenticated,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
  };
};
