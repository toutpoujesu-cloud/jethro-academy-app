import { create } from 'zustand';

interface Toast {
  id:      string;
  type:    'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface UiState {
  sidebarOpen:        boolean;
  notificationsOpen:  boolean;
  toasts:             Toast[];

  toggleSidebar:          () => void;
  setSidebarOpen:         (open: boolean) => void;
  toggleNotifications:    () => void;
  setNotificationsOpen:   (open: boolean) => void;
  addToast:               (type: Toast['type'], message: string) => void;
  removeToast:            (id: string) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen:       false,
  notificationsOpen: false,
  toasts:            [],

  toggleSidebar:       () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen:      (open) => set({ sidebarOpen: open }),
  toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen })),
  setNotificationsOpen:(open) => set({ notificationsOpen: open }),

  addToast: (type, message) => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string) => useUiStore.getState().addToast('success', message),
  error:   (message: string) => useUiStore.getState().addToast('error', message),
  warning: (message: string) => useUiStore.getState().addToast('warning', message),
  info:    (message: string) => useUiStore.getState().addToast('info', message),
};
