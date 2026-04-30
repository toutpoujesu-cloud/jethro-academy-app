'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DashboardShell, PageHeader } from '@/components/layout/dashboard-shell';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/store/ui.store';
import { formatDate } from '@/lib/utils';

interface PendingSubmission {
  id:         string;
  submission: string;
  submittedAt: string;
  score?:     number | null;
  feedback?:  string | null;
  gradedAt?:  string | null;
  user:       { firstName: string; lastName: string; email: string };
  lesson:     { id: string; title: string; assignment: { maxScore: number; title: string } | null };
}

export default function GradingPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<PendingSubmission | null>(null);
  const [score,    setScore]    = useState('');
  const [feedback, setFeedback] = useState('');
  const [tab, setTab] = useState<'pending' | 'graded'>('pending');

  const { data, isLoading } = useQuery<PendingSubmission[]>({
    queryKey: ['grading', tab],
    queryFn:  () =>
      api.get(`/progress/submissions?graded=${tab === 'graded'}&limit=50`),
  });

  const grade = useMutation({
    mutationFn: ({ lessonId, userId, score, feedback }: { lessonId: string; userId: string; score: number; feedback: string }) =>
      api.post(`/progress/${lessonId}/grade`, { userId, score, feedback }),
    onSuccess: () => {
      toast.success('Assignment graded!');
      qc.invalidateQueries({ queryKey: ['grading'] });
      setSelected(null);
      setScore('');
      setFeedback('');
    },
    onError: () => toast.error('Grading failed.'),
  });

  function openGrade(sub: PendingSubmission) {
    setSelected(sub);
    setScore(sub.score != null ? String(sub.score) : '');
    setFeedback(sub.feedback ?? '');
  }

  return (
    <DashboardShell title="Grading">
      <PageHeader
        title="Assignment Grading"
        description="Review and grade student submissions."
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'graded'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-navy text-white' : 'bg-white text-slate border border-gray-200 hover:border-navy/30'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !data?.length ? (
        <div className="card text-center py-14">
          <p className="text-slate text-sm">
            {tab === 'pending' ? 'No pending submissions.' : 'No graded submissions yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((sub) => (
            <div key={sub.id} className="card flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-sm text-charcoal">
                    {sub.user.firstName} {sub.user.lastName}
                  </p>
                  <span className="text-slate/50 text-xs">·</span>
                  <p className="text-xs text-slate">{sub.user.email}</p>
                </div>
                <p className="text-xs text-slate mb-1">
                  Lesson: <span className="text-charcoal">{sub.lesson.title}</span>
                </p>
                <p className="text-xs text-slate line-clamp-2">{sub.submission}</p>
                {sub.score != null && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="gold">{sub.score} / {sub.lesson.assignment?.maxScore ?? '?'}</Badge>
                    <span className="text-xs text-slate">Graded {formatDate(sub.gradedAt!)}</span>
                  </div>
                )}
              </div>
              <Button size="sm" variant={sub.score != null ? 'ghost' : 'gold'} onClick={() => openGrade(sub)}>
                {sub.score != null ? 'Edit Grade' : 'Grade'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Grade modal */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Grade — ${selected?.lesson.title ?? ''}`}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="bg-ivory rounded-xl p-4">
              <p className="text-xs font-semibold text-slate mb-1 uppercase tracking-wide">
                Student Submission
              </p>
              <p className="text-sm text-charcoal whitespace-pre-wrap">{selected.submission}</p>
            </div>

            <div className="flex gap-4">
              <Input
                label={`Score (max ${selected.lesson.assignment?.maxScore ?? 100})`}
                type="number"
                min={0}
                max={selected.lesson.assignment?.maxScore ?? 100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-32"
              />
            </div>

            <Textarea
              label="Feedback for student"
              placeholder="Great work! Your analysis of..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />

            <div className="flex gap-3">
              <Button
                variant="gold"
                loading={grade.isPending}
                disabled={!score.trim()}
                onClick={() =>
                  grade.mutate({
                    lessonId: selected.lesson.id,
                    userId:   selected.user.email, // server resolves by email or id
                    score:    Number(score),
                    feedback,
                  })
                }
              >
                Submit Grade
              </Button>
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
