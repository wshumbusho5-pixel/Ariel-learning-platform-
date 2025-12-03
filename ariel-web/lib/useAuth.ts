import { create } from 'zustand';
import { authAPI } from './api';

interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  profile_picture?: string;
  role: string;
  total_points: number;
  level: number;
  current_streak: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user, token) => {
    localStorage.setItem('auth_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const user = await authAPI.getCurrentUser();
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('auth_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
