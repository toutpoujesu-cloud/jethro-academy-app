'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DashboardShell, PageHeader } from '@/components/layout/dashboard-shell';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/store/ui.store';
import { formatDate } from '@/lib/utils';

interface PendingLesson {
  id:         string;
  title:      string;
  type:       string;
  status:     string;
  submittedAt?: string | null;
  updatedAt:  string;
  instructor: { firstName: string; lastName: string };
  module:     { title: string; course: { title: string } };
  description?: string | null;
  textContent?: string | null;
}

export default function ContentReviewPage() {
  const qc   = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PendingLesson | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [action, setAction] = useState<'approve' | 'revision' | null>(null);
  const limit = 15;

  const { data, isLoading } = useQuery<{ items: PendingLesson[]; total: number }>({
    queryKey: ['content-review', page],
    queryFn:  () =>
      api.get(`/review/pending?page=${page}&limit=${limit}`),
  });

  const decide = useMutation({
    mutationFn: ({ lessonId, decision, revisionNotes }: { lessonId: string; decision: string; revisionNotes?: string }) =>
      api.patch(`/review/${lessonId}/decide`, { decision, revisionNotes }),
    onSuccess: () => {
      const msg = action === 'approve' ? 'Lesson approved!' : 'Revision requested!';
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ['content-review'] });
      setSelected(null);
      setRevisionNotes('');
      setAction(null);
    },
    onError: () => toast.error('Action failed.'),
  });

  const columns: Column<PendingLesson>[] = [
    {
      key: 'title', header: 'Lesson', sortable: true, render: (r) => (
        <div>
          <p className="font-medium text-sm text-charcoal">{r.title}</p>
          <p className="text-xs text-slate">{r.module.course.title} › {r.module.title}</p>
        </div>
      ),
    },
    {
      key: 'instructor', header: 'Instructor', render: (r) => (
        <span className="text-sm">{r.instructor.firstName} {r.instructor.lastName}</span>
      ),
    },
    { key: 'type',   header: 'Type', render: (r) => <span className="capitalize text-xs">{r.type.toLowerCase()}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'updatedAt', header: 'Updated', sortable: true, render: (r) => (
        <span className="text-xs text-slate">{formatDate(r.updatedAt)}</span>
      ),
    },
    {
      key: 'actions', header: '', render: (r) => (
        <Button size="sm" variant="gold" onClick={() => setSelected(r)}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <DashboardShell title="Content Review">
      <PageHeader
        title="Content Review"
        description="Review and approve submitted lessons."
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        keyExtractor={(r) => r.id}
        emptyText="No lessons pending review."
      />
      <Pagination page={page} total={data?.total ?? 0} limit={limit} onPage={setPage} />

      {/* Review modal */}
      <Modal
        open={Boolean(selected)}
        onClose={() => { setSelected(null); setAction(null); setRevisionNotes(''); }}
        title={selected?.title ?? 'Review Lesson'}
        size="xl"
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate uppercase tracking-wide mb-1">Course</p>
                <p className="text-charcoal">{selected.module.course.title}</p>
              </div>
              <div>
                <p className="text-xs text-slate uppercase tracking-wide mb-1">Module</p>
                <p className="text-charcoal">{selected.module.title}</p>
              </div>
              <div>
                <p className="text-xs text-slate uppercase tracking-wide mb-1">Instructor</p>
                <p className="text-charcoal">{selected.instructor.firstName} {selected.instructor.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-slate uppercase tracking-wide mb-1">Type</p>
                <p className="text-charcoal capitalize">{selected.type.toLowerCase()}</p>
              </div>
            </div>

            {selected.description && (
              <div>
                <p className="text-xs text-slate uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-charcoal">{selected.description}</p>
              </div>
            )}

            {selected.textContent && (
              <div className="bg-ivory rounded-xl p-4 max-h-64 overflow-y-auto">
                <p className="text-xs text-slate uppercase tracking-wide mb-2">Content</p>
                <div
                  className="text-sm text-charcoal prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selected.textContent }}
                />
              </div>
            )}

            {/* Action selection */}
            {!action ? (
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button
                  variant="gold"
                  onClick={() => {
                    setAction('approve');
                    decide.mutate({ lessonId: selected.id, decision: 'APPROVED' });
                  }}
                  loading={decide.isPending && action === 'approve'}
                >
                  ✓ Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAction('revision')}
                >
                  ✏️ Request Revision
                </Button>
              </div>
            ) : action === 'revision' ? (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <Textarea
                  label="Revision notes for instructor"
                  placeholder="Please clarify the section on... The video audio quality needs..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-3">
                  <Button
                    variant="gold"
                    loading={decide.isPending}
                    disabled={!revisionNotes.trim()}
                    onClick={() =>
                      decide.mutate({
                        lessonId: selected.id,
                        decision: 'REVISION_NEEDED',
                        revisionNotes,
                      })
                    }
                  >
                    Send Revision Request
                  </Button>
                  <Button variant="ghost" onClick={() => setAction(null)}>
                    Back
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
