import { create } from 'zustand';
import type { User } from '../types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.removeItem('authDebugError');
    set({ user, accessToken, isAuthenticated: true, isInitialized: true });
  },
  setAccessToken: (accessToken) => {
    set({ accessToken, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authDebugError');
    set({ user: null, accessToken: null, isAuthenticated: false, isInitialized: true });
  },
  initialize: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      set({ isInitialized: true });
      return;
    }
    try {
      // 1. Get new access token using local authAxios to bypass interceptor loops
      const refreshRes = await authAxios.post('/auth/refresh', { refreshToken });
      const { accessToken } = refreshRes.data.data;
      
      // 2. Fetch user profile with the new token
      const profileRes = await authAxios.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = profileRes.data.data;
      
      // 3. Set auth state
      set({ user, accessToken, isAuthenticated: true, isInitialized: true });
    } catch (err: any) {
      console.error('Session restoration failed:', err);
      try {
        const debugInfo = {
          message: err.message,
          stack: err.stack,
          url: err.config?.url,
          method: err.config?.method,
          status: err.response?.status,
          data: err.response?.data,
        };
        localStorage.setItem('authDebugError', JSON.stringify(debugInfo));
      } catch (logErr) {
        // Ignore serialization issues
      }
      
      // Only delete the refresh token if the server explicitly rejects it (400 Bad Request or 401 Unauthorized)
      const status = err.response?.status;
      if (status === 400 || status === 401) {
        localStorage.removeItem('refreshToken');
      }
      
      set({ user: null, accessToken: null, isAuthenticated: false, isInitialized: true });
    }
  },
}));
