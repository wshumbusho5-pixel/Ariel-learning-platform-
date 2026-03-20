import { create } from 'zustand';

// ─── State & Actions ──────────────────────────────────────────────────────────

interface NotificationState {
  unreadCount: number;
}

interface NotificationActions {
  setUnreadCount: (n: number) => void;
  decrementUnread: () => void;
  clearUnread: () => void;
}

export type NotificationStore = NotificationState & NotificationActions;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  unreadCount: 0,

  setUnreadCount: (n: number) => {
    set({ unreadCount: Math.max(0, n) });
  },

  decrementUnread: () => {
    set({ unreadCount: Math.max(0, get().unreadCount - 1) });
  },

  clearUnread: () => {
    set({ unreadCount: 0 });
  },
}));

// Named export of the raw store for non-hook access (e.g. from outside React)
export const notificationStore = useNotificationStore;
