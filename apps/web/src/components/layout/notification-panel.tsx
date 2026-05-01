'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useUIStore } from '@/store/ui.store';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

interface Notification {
  id:        string;
  type:      string;
  title:     string;
  message:   string;
  isRead:    boolean;
  createdAt: string;
}

interface PaginatedNotifications {
  data:  Notification[];
  meta:  { total: number };
}

const TYPE_ICON: Record<string, string> = {
  LESSON_APPROVED:       '✅',
  REVISION_REQUESTED:    '✏️',
  LESSON_SUBMITTED:      '📤',
  COURSE_COMPLETED:      '🎓',
  CERTIFICATE_ISSUED:    '🏅',
  ASSIGNMENT_GRADED:     '📝',
  PAYMENT_CONFIRMED:     '💳',
  GENERAL:               '🔔',
};

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const qc       = useQueryClient();
  const setNotificationsOpen = useUIStore((s) => s.setNotificationsOpen);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const { data, isLoading } = useQuery<PaginatedNotifications>({
    queryKey: ['notifications'],
    queryFn:  () => api.get<PaginatedNotifications>('/notifications?limit=20'),
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['notifications-unread'],
    queryFn:  () => api.get<{ count: number }>('/notifications/unread-count'),
  });

  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const unreadCount = unreadData?.count ?? 0;
  const notifications = data?.data ?? [];

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute right-0 top-full mt-2 w-80 sm:w-96',
        'bg-white rounded-2xl shadow-lg border border-gray-100',
        'overflow-hidden z-50',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-sm text-charcoal">
          Notifications {unreadCount > 0 && <span className="text-gold">({unreadCount})</span>}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate()}
            className="text-xs text-gold hover:text-gold-dark transition-colors"
            disabled={markAll.isPending}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : !notifications.length ? (
          <div className="py-10 text-center text-sm text-slate">
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => { if (!n.isRead) markOne.mutate(n.id); }}
              className={cn(
                'w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-ivory',
                !n.isRead && 'bg-gold/5',
              )}
            >
              <span className="text-xl shrink-0 mt-0.5">
                {TYPE_ICON[n.type] ?? TYPE_ICON.GENERAL}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-charcoal leading-snug">{n.title}</p>
                <p className="text-xs text-slate mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-slate/60 mt-1">{formatDate(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <span className="h-2 w-2 rounded-full bg-gold shrink-0 mt-1.5" />
              )}
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 text-center">
        <button
          onClick={() => { onClose(); setNotificationsOpen(false); }}
          className="text-xs text-slate hover:text-charcoal transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
