'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';

interface DashboardShellProps {
  children:   React.ReactNode;
  title?:     string;
  className?: string;
}

export function DashboardShell({ children, title, className }: DashboardShellProps) {
  const [collapsed,    setCollapsed]    = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-ivory">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-navy/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto flex-shrink-0',
          'transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          title={title}
          onMenuToggle={() => setMobileOpen((o) => !o)}
        />

        <main
          className={cn(
            'flex-1 overflow-y-auto px-4 py-6 lg:px-6 lg:py-8',
            'page-enter',
            className,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── Page header ──────────────────────────────────────────── */
interface PageHeaderProps {
  title:       string;
  description?: string;
  action?:     React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-charcoal">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
