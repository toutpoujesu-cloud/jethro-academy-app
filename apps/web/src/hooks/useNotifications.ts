'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ['notifications', { unreadOnly }],
    queryFn:  () => api.get<{ data: unknown[]; meta: unknown }>('/notifications', { unreadOnly }),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey:        ['notifications', 'unread-count'],
    queryFn:         () => api.get<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 30_000, // Poll every 30s
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess:  () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
