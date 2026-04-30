'use client';

import { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth.store';

/**
 * Sets the "jethro_auth_check" cookie for the middleware to read.
 * Cookie cannot be set server-side because auth lives in localStorage.
 */
function AuthCookieSync() {
  const user = useAuthStore((s) => s.user);
  const prevRef = useRef<boolean | null>(null);

  useEffect(() => {
    const loggedIn = Boolean(user);
    if (prevRef.current === loggedIn) return;
    prevRef.current = loggedIn;

    if (loggedIn) {
      document.cookie = 'jethro_auth_check=1; path=/; SameSite=Lax';
    } else {
      document.cookie = 'jethro_auth_check=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }, [user]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthCookieSync />
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
