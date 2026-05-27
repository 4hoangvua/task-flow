import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      auth: {
        token: accessToken,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', async (err) => {
      console.error('Socket connection error:', err.message);
      
      // If it's an authentication error, try to refresh the token
      if (err.message.includes('Authentication error')) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          useAuthStore.getState().logout();
          return;
        }

        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const refreshRes = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken: newAccessToken } = refreshRes.data.data;
          
          // Update store with new token, which will trigger useEffect to reconnect
          useAuthStore.getState().setAccessToken(newAccessToken);
        } catch (refreshErr: any) {
          console.error('Failed to refresh token after socket auth error:', refreshErr);
          const status = refreshErr.response?.status;
          if (status === 400 || status === 401) {
            useAuthStore.getState().logout();
          }
        }
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
