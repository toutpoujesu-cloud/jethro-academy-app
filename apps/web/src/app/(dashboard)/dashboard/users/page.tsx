'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DashboardShell, PageHeader } from '@/components/layout/dashboard-shell';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input, Select } from '@/components/ui/input';
import { toast } from '@/store/ui.store';
import { formatDate } from '@/lib/utils';

interface User {
  id:        string;
  firstName: string;
  lastName:  string;
  email:     string;
  role:      string;
  status:    string;
  createdAt: string;
  avatarUrl?: string | null;
}

export default function UsersPage() {
  const qc     = useQueryClient();
  const [page, setPage]   = useState(1);
  const [role, setRole]   = useState('');
  const [status, setStatus] = useState('');
  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const limit = 20;

  const { data, isLoading } = useQuery<{ items: User[]; total: number }>({
    queryKey: ['users', page, role, status],
    queryFn:  () => {
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(limit),
        ...(role   && { role }),
        ...(status && { status }),
      });
      return api.get(`/users?${params.toString()}`);
    },
  });

  const invite = useMutation({
    mutationFn: (email: string) =>
      api.post('/users/invite-instructor', { email }),
    onSuccess: () => {
      toast.success('Invitation sent!');
      setInviteOpen(false);
      setInviteEmail('');
    },
    onError: () => toast.error('Failed to send invitation.'),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/users/${id}`, { status }),
    onSuccess: () => {
      toast.success('User updated!');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const columns: Column<User>[] = [
    {
      key: 'name', header: 'User', render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar firstName={r.firstName} lastName={r.lastName} src={r.avatarUrl} size="sm" />
          <div>
            <p className="font-medium text-sm text-charcoal">{r.firstName} {r.lastName}</p>
            <p className="text-xs text-slate">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role', header: 'Role', render: (r) => (
        <Badge variant="navy" className="capitalize text-[10px]">
          {r.role.toLowerCase().replace('_', ' ')}
        </Badge>
      ),
    },
    { key: 'status',    header: 'Status',   render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', header: 'Joined',   sortable: true, render: (r) => (
      <span className="text-xs text-slate">{formatDate(r.createdAt)}</span>
    )},
    {
      key: 'actions', header: '', render: (r) => (
        <div className="flex gap-2">
          {r.status === 'ACTIVE' ? (
            <Button
              size="sm" variant="ghost"
              className="text-red-500 hover:text-red-700"
              onClick={() => toggleStatus.mutate({ id: r.id, status: 'SUSPENDED' })}
            >
              Suspend
            </Button>
          ) : (
            <Button
              size="sm" variant="ghost"
              className="text-emerald-600"
              onClick={() => toggleStatus.mutate({ id: r.id, status: 'ACTIVE' })}
            >
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardShell title="Users">
      <PageHeader
        title="User Management"
        description="View and manage all platform users."
        action={
          <Button variant="gold" onClick={() => setInviteOpen(true)}>
            Invite Instructor
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <Select
          options={[
            { value: '', label: 'All Roles' },
            { value: 'SUPER_ADMIN',   label: 'Super Admin' },
            { value: 'CONTENT_ADMIN', label: 'Content Admin' },
            { value: 'INSTRUCTOR',    label: 'Instructor' },
            { value: 'LEARNER',       label: 'Learner' },
          ]}
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="w-44"
        />
        <Select
          options={[
            { value: '',          label: 'All Statuses' },
            { value: 'ACTIVE',    label: 'Active' },
            { value: 'INACTIVE',  label: 'Inactive' },
            { value: 'SUSPENDED', label: 'Suspended' },
          ]}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-44"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        keyExtractor={(r) => r.id}
        emptyText="No users found."
      />
      <Pagination page={page} total={data?.total ?? 0} limit={limit} onPage={setPage} />

      {/* Invite modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Instructor" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate">
            An invitation link will be sent to the instructor&apos;s email. They&apos;ll use it to set their password and activate their account.
          </p>
          <Input
            label="Email address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="instructor@example.com"
          />
          <div className="flex gap-3">
            <Button
              variant="gold"
              loading={invite.isPending}
              disabled={!inviteEmail.includes('@')}
              onClick={() => invite.mutate(inviteEmail)}
            >
              Send Invitation
            </Button>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
