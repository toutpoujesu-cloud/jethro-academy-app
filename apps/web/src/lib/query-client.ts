'use client';
import { QueryClient } from '@tanstack/react-query';

export function getQueryClient() { return queryClient; }

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          60 * 1000,      // 1 minute
      retry:              1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        console.error('[Mutation error]', error);
      },
    },
  },
});
