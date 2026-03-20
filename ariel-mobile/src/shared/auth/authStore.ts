import { create } from 'zustand';
import { User } from '@/shared/types/user';
import { STORAGE_KEYS, getItem, setItem, removeItem } from '@/shared/utils/storage';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => Promise<void>;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (token: string, user: User) => {
    await Promise.all([
      setItem<string>(STORAGE_KEYS.AUTH_TOKEN, token),
      setItem<User>(STORAGE_KEYS.USER, user),
    ]);
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await Promise.all([
      removeItem(STORAGE_KEYS.AUTH_TOKEN),
      removeItem(STORAGE_KEYS.USER),
    ]);
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  updateUser: async (partial: Partial<User>) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    await setItem<User>(STORAGE_KEYS.USER, updated);
    set({ user: updated });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const [token, user] = await Promise.all([
        getItem<string>(STORAGE_KEYS.AUTH_TOKEN),
        getItem<User>(STORAGE_KEYS.USER),
      ]);
      if (token && user) {
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// Auto-hydrate on module load
useAuthStore.getState().hydrate();
