import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserRole } from '@jethro/shared';
import { api } from '@/lib/api-client';

export interface AuthUser {
  id:         string;
  email:      string;
  firstName:  string;
  lastName:   string;
  role:       UserRole;
  avatarUrl?: string | null;
  status?:    string;
}

interface AuthState {
  user:          AuthUser | null;
  accessToken:   string | null;
  refreshToken:  string | null;
  isLoading:     boolean;
  _hasHydrated:  boolean;

  login:     (email: string, password: string) => Promise<void>;
  register:  (data: { email: string; firstName: string; lastName: string; password: string }) => Promise<void>;
  logout:    () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
  clearAuth: () => void;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isLoading:    false,
      _hasHydrated: false,

      setHydrated: (v) => set({ _hasHydrated: v }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await api.post<{
            user:   AuthUser;
            tokens: { accessToken: string; refreshToken: string };
          }>('/auth/login', { email, password });

          localStorage.setItem('jethro_access_token',  data.tokens.accessToken);
          localStorage.setItem('jethro_refresh_token', data.tokens.refreshToken);
          set({
            user:         data.user,
            accessToken:  data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const data = await api.post<{
            user:   AuthUser;
            tokens: { accessToken: string; refreshToken: string };
          }>('/auth/register', formData);

          localStorage.setItem('jethro_access_token',  data.tokens.accessToken);
          localStorage.setItem('jethro_refresh_token', data.tokens.refreshToken);
          set({
            user:         data.user,
            accessToken:  data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch { /* ignore network errors */ }
        get().clearAuth();
      },

      setTokens: (access, refresh) => {
        localStorage.setItem('jethro_access_token',  access);
        localStorage.setItem('jethro_refresh_token', refresh);
        set({ accessToken: access, refreshToken: refresh });
      },

      clearAuth: () => {
        localStorage.removeItem('jethro_access_token');
        localStorage.removeItem('jethro_refresh_token');
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name:    'jethro-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user:         state.user,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/* ── Role helpers ─────────────────────────────────────────── */
export const useIsAdmin      = () => useAuthStore((s) =>
  s.user?.role === UserRole.SUPER_ADMIN || s.user?.role === UserRole.CONTENT_ADMIN,
);
export const useIsSuperAdmin  = () => useAuthStore((s) => s.user?.role === UserRole.SUPER_ADMIN);
export const useIsInstructor  = () => useAuthStore((s) => s.user?.role === UserRole.INSTRUCTOR);
export const useIsLearner     = () => useAuthStore((s) => s.user?.role === UserRole.LEARNER);
export const useCurrentUser   = () => useAuthStore((s) => s.user);
