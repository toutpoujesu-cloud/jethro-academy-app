'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@jethro/shared';

/**
 * Redirect to `redirectTo` (default: /login) if not authenticated.
 * Must be used inside a Client Component.
 */
export function useRequireAuth(redirectTo = '/login') {
  const router    = useRouter();
  const user      = useAuthStore((s) => s.user);
  const hydrated  = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(redirectTo);
    }
  }, [hydrated, user, redirectTo, router]);

  return { user, isLoading: !hydrated };
}

/**
 * Redirect if user doesn't have one of the allowed roles.
 */
export function useRequireRole(roles: UserRole[], redirectTo = '/dashboard') {
  const router    = useRouter();
  const user      = useAuthStore((s) => s.user);
  const hydrated  = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!user || !roles.includes(user.role as UserRole)) {
      router.replace(redirectTo);
    }
  }, [hydrated, user, roles, redirectTo, router]);

  return { user, isLoading: !hydrated };
}

/**
 * Returns the role-based default dashboard route.
 */
export function useDashboardRoute(): string {
  const user = useAuthStore((s) => s.user);
  return dashboardRouteForRole(user?.role as UserRole | undefined);
}

export function dashboardRouteForRole(role?: UserRole): string {
  // All roles land on /dashboard — the page component forks by role
  return '/dashboard';
}

/**
 * Legacy default export for backward compat
 */
export function useAuth() {
  const store  = useAuthStore();
  const router = useRouter();

  const requireAuth = (redirectTo = '/login') => {
    if (!store.user) { router.push(redirectTo); return false; }
    return true;
  };

  const requireRole = (roles: UserRole[], redirectTo = '/') => {
    if (!store.user || !roles.includes(store.user.role as UserRole)) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  return { ...store, requireAuth, requireRole, dashboardRoute: () => '/dashboard' };
}
