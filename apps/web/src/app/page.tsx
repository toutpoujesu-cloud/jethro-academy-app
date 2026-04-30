'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardRoute } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';

/**
 * Root page — immediately redirects:
 *   • Authenticated → role-based dashboard
 *   • Anonymous     → /login
 */
export default function RootPage() {
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const dashboardRoute = useDashboardRoute();

  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      router.replace(dashboardRoute);
    } else {
      router.replace('/login');
    }
  }, [hydrated, user, dashboardRoute, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy">
      <div className="flex flex-col items-center gap-4">
        <span className="font-serif text-2xl font-bold text-gold tracking-tight">
          Jethro Academy
        </span>
        <Spinner size="lg" color="gold" />
      </div>
    </div>
  );
}
