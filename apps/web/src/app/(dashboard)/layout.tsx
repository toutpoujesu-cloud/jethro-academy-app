'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Spinner } from '@/components/ui/spinner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router    = useRouter();
  const user      = useAuthStore((s) => s.user);
  const hydrated  = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/login');
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <Spinner size="xl" color="gold" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
