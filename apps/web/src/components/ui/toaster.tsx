'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore, type Toast } from '@/store/ui.store';

const ICONS: Record<Toast['type'], React.ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 text-emerald-600">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 text-red-600">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 text-amber-600">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 text-sky-600">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const bg: Record<Toast['type'], string> = {
  success: 'border-l-emerald-500',
  error:   'border-l-red-500',
  warning: 'border-l-amber-500',
  info:    'border-l-sky-500',
};

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useUIStore((s) => s.removeToast);

  useEffect(() => {
    const t = setTimeout(() => remove(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, remove]);

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 bg-white rounded-xl shadow-modal border border-gray-100 border-l-4',
        'px-4 py-3 min-w-[280px] max-w-[360px]',
        'animate-slide-up',
        bg[toast.type],
      )}
    >
      <span className="mt-0.5 shrink-0">{ICONS[toast.type]}</span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-charcoal">{toast.title}</p>
        )}
        <p className="text-sm text-slate leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={() => remove(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 text-slate/50 hover:text-slate transition-colors mt-0.5"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 items-end"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
