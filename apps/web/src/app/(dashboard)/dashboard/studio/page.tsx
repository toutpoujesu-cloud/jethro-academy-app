'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { DashboardShell, PageHeader } from '@/components/layout/dashboard-shell';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface Lesson {
  id:        string;
  title:     string;
  type:      string;
  status:    string;
  updatedAt: string;
  module: { title: string; course: { title: string } };
}

const columns: Column<Lesson>[] = [
  { key: 'title',  header: 'Lesson Title', sortable: true, render: (r) => (
    <Link href={`/dashboard/studio/${r.id}`} className="font-medium text-navy hover:text-gold transition-colors">
      {r.title}
    </Link>
  )},
  { key: 'course', header: 'Course', render: (r) => (
    <span className="text-slate text-xs">{r.module.course.title}</span>
  )},
  { key: 'module', header: 'Module', render: (r) => (
    <span className="text-slate text-xs">{r.module.title}</span>
  )},
  { key: 'type',   header: 'Type', render: (r) => (
    <span className="capitalize text-xs">{r.type.toLowerCase()}</span>
  )},
  { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'updatedAt', header: 'Last Updated', sortable: true, render: (r) => (
    <span className="text-xs text-slate">{formatDate(r.updatedAt)}</span>
  )},
  { key: 'actions', header: '', render: (r) => (
    <Link href={`/dashboard/studio/${r.id}`}>
      <Button size="sm" variant="ghost">Edit →</Button>
    </Link>
  )},
];

export default function StudioPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading } = useQuery<{ items: Lesson[]; total: number }>({
    queryKey: ['studio-lessons', page],
    queryFn:  () => api.get(`/lessons?instructorId=me&page=${page}&limit=${limit}`),
  });

  return (
    <DashboardShell title="My Studio">
      <PageHeader
        title="My Studio"
        description="Manage your lessons and content."
        action={
          <Link href="/dashboard/studio/new">
            <Button variant="gold">+ New Lesson</Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        keyExtractor={(r) => r.id}
        emptyText="You haven't created any lessons yet."
      />
      <Pagination
        page={page}
        total={data?.total ?? 0}
        limit={limit}
        onPage={setPage}
      />
    </DashboardShell>
  );
}
