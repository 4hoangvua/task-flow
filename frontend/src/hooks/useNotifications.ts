import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { notificationApi } from '../api/notificationApi';
import { useSocket } from '../providers/SocketProvider';
import { useAuthStore } from '../stores/authStore';
import { message as antdMessage } from 'antd';
import type { Notification } from '../types';

export const useNotifications = (params?: { page?: number; limit?: number }) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationApi.getNotifications(params),
    enabled: isAuthenticated,
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      antdMessage.success('Đã đánh dấu tất cả thông báo là đã đọc');
    },
  });

  // Real-time Notification Listener
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      // Invalidate queries so TanStack Query refetches from backend
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Trigger user-facing browser alert/toast
      antdMessage.info({
        message: notification.title,
        description: notification.message,
        duration: 4.5,
      } as any);
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, queryClient]);

  return {
    notifications: notificationsQuery.data?.data || [],
    unreadCount: notificationsQuery.data?.unreadCount || 0,
    meta: notificationsQuery.data?.meta,
    isLoading: notificationsQuery.isLoading,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
  };
};
