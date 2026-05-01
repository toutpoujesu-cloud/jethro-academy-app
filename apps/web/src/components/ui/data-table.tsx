'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

export interface Column<T> {
  key:       string;
  header:    string;
  render?:   (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns:     Column<T>[];
  data:        T[];
  loading?:    boolean;
  emptyText?:  string;
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?:  string;
}

type SortDir = 'asc' | 'desc';

export function DataTable<T extends object>({
  columns,
  data,
  loading,
  emptyText = 'No records found.',
  keyExtractor,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey] as string | number;
        const bv = (b as Record<string, unknown>)[sortKey] as string | number;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data;

  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-gray-100', className)}>
      <table className="w-full text-sm">
        {/* Header */}
        <thead className="bg-gray-50/80">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate',
                  col.sortable && 'cursor-pointer select-none hover:text-charcoal transition-colors',
                  col.className,
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <span className="text-gold">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                <Spinner size="lg" />
              </td>
            </tr>
          ) : sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-sm text-slate"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'bg-white transition-colors duration-100',
                  onRowClick && 'cursor-pointer hover:bg-ivory',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-charcoal', col.className)}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ── Pagination ───────────────────────────────────────────── */
interface PaginationProps {
  page:       number;
  total:      number;
  limit:      number;
  onPage:     (p: number) => void;
}

export function Pagination({ page, total, limit, onPage }: PaginationProps) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;

  const range = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 2,
  );

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-slate">
        Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="px-2.5 py-1.5 rounded-lg text-sm text-slate hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        {range.map((p, i) => {
          const prev = range[i - 1];
          const showDots = prev !== undefined && p - prev > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {showDots && <span className="text-slate px-1">…</span>}
              <button
                onClick={() => onPage(p)}
                className={cn(
                  'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-navy text-white'
                    : 'text-slate hover:bg-gray-100',
                )}
              >
                {p}
              </button>
            </span>
          );
        })}
        <button
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="px-2.5 py-1.5 rounded-lg text-sm text-slate hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
}
