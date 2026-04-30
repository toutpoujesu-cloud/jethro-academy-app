'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Avatar } from '@/components/ui/avatar';
import { NotificationPanel } from './notification-panel';

interface TopBarProps {
  title?:        string;
  onMenuToggle?: () => void;
}

export function TopBar({ title, onMenuToggle }: TopBarProps) {
  const user            = useAuthStore((s) => s.user);
  const unread          = useUIStore((s) => s.unreadCount);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="h-14 flex items-center gap-4 px-4 lg:px-6 bg-white border-b border-gray-100 shrink-0 relative z-30">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        aria-label="Toggle menu"
        className="lg:hidden p-1.5 rounded-lg text-slate hover:bg-gray-100 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Title */}
      {title && (
        <h1 className="font-serif text-base font-semibold text-charcoal hidden sm:block">
          {title}
        </h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-slate/70 w-56 cursor-text">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-slate/50 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search…</span>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen((o) => !o)}
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
          className="relative p-2 rounded-xl text-slate hover:bg-gray-100 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold animate-pulse" />
          )}
        </button>

        {notifOpen && (
          <NotificationPanel onClose={() => setNotifOpen(false)} />
        )}
      </div>

      {/* User avatar */}
      <Link href="/dashboard/profile" className="shrink-0">
        <Avatar
          src={user?.avatarUrl}
          firstName={user?.firstName}
          lastName={user?.lastName}
          size="sm"
          className="ring-2 ring-transparent hover:ring-gold transition-all"
        />
      </Link>
    </header>
  );
}
