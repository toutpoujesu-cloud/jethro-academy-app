'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Input, Textarea, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/store/ui.store';

const schema = z.object({
  title:       z.string().min(1, 'Title is required'),
  type:        z.enum(['VIDEO', 'AUDIO', 'TEXT', 'MIXED']),
  description: z.string().optional(),
  textContent: z.string().optional(),
  duration:    z.coerce.number().optional(),
  moduleId:    z.string().min(1, 'Module is required'),
});
type FormValues = z.infer<typeof schema>;

interface LessonEditorData {
  id:           string;
  title:        string;
  type:         string;
  description?: string | null;
  textContent?: string | null;
  duration?:    number | null;
  status:       string;
  revisionNotes?: string | null;
  moduleId:     string;
  module: { title: string; course: { id: string; title: string } };
}

interface Module { id: string; title: string; course: { id: string; title: string } }

export default function LessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const isNew = lessonId === 'new';
  const router = useRouter();
  const qc = useQueryClient();
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  /* ── Load lesson ────────────────────────────── */
  const { data: lesson, isLoading } = useQuery<LessonEditorData>({
    queryKey: ['lesson-edit', lessonId],
    queryFn:  () => api.get(`/lessons/${lessonId}`),
    enabled:  !isNew,
  });

  /* ── Load modules for selector ──────────────── */
  const { data: modules } = useQuery<Module[]>({
    queryKey: ['instructor-modules'],
    queryFn:  () => api.get('/modules?instructorId=me&limit=100'),
  });

  /* ── Form ────────────────────────────────────── */
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (lesson) {
      reset({
        title:       lesson.title,
        type:        lesson.type as FormValues['type'],
        description: lesson.description ?? '',
        textContent: lesson.textContent ?? '',
        duration:    lesson.duration ?? undefined,
        moduleId:    lesson.moduleId,
      });
    }
  }, [lesson, reset]);

  /* ── Mutations ───────────────────────────────── */
  const save = useMutation({
    mutationFn: (data: FormValues) =>
      isNew
        ? api.post<{ id: string }>('/lessons', data)
        : api.patch<{ id: string }>(`/lessons/${lessonId}`, data),
    onSuccess: (saved: { id: string }) => {
      toast.success(isNew ? 'Lesson created!' : 'Saved!');
      qc.invalidateQueries({ queryKey: ['studio-lessons'] });
      if (isNew) router.replace(`/dashboard/studio/${saved.id}`);
      else qc.invalidateQueries({ queryKey: ['lesson-edit', lessonId] });
    },
    onError: () => toast.error('Failed to save.'),
  });

  const submitForReview = useMutation({
    mutationFn: () => api.patch(`/lessons/${lessonId}/submit`),
    onSuccess:  () => {
      toast.success('Submitted for review!');
      qc.invalidateQueries({ queryKey: ['lesson-edit', lessonId] });
      setConfirmSubmit(false);
    },
    onError: () => toast.error('Submission failed.'),
  });

  if (!isNew && isLoading) {
    return (
      <DashboardShell>
        <div className="flex justify-center py-24"><Spinner size="xl" /></div>
      </DashboardShell>
    );
  }

  const canEdit = isNew || ['DRAFT', 'REVISION_NEEDED'].includes(lesson?.status ?? '');
  const canSubmit = !isNew && lesson?.status === 'DRAFT';

  return (
    <DashboardShell title={isNew ? 'New Lesson' : lesson?.title ?? 'Edit Lesson'}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate mb-6">
        <button onClick={() => router.push('/dashboard/studio')} className="hover:text-navy transition-colors">
          My Studio
        </button>
        <span>›</span>
        <span className="text-charcoal font-medium">{isNew ? 'New Lesson' : lesson?.title}</span>
        {lesson && <StatusBadge status={lesson.status} />}
      </div>

      {/* Revision notes */}
      {lesson?.revisionNotes && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 mb-1">Revision Requested:</p>
          <p className="text-sm text-amber-700">{lesson.revisionNotes}</p>
        </div>
      )}

      <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-6 max-w-2xl">
        <Select
          label="Module"
          error={errors.moduleId?.message}
          disabled={!canEdit}
          options={(modules ?? []).map((m) => ({
            value: m.id,
            label: `${m.course.title} › ${m.title}`,
          }))}
          placeholder="Select a module…"
          {...register('moduleId')}
        />

        <Input
          label="Lesson Title"
          placeholder="e.g. Introduction to Leadership"
          error={errors.title?.message}
          disabled={!canEdit}
          {...register('title')}
        />

        <Select
          label="Lesson Type"
          error={errors.type?.message}
          disabled={!canEdit}
          options={[
            { value: 'VIDEO', label: 'Video' },
            { value: 'AUDIO', label: 'Audio' },
            { value: 'TEXT',  label: 'Text / Article' },
            { value: 'MIXED', label: 'Mixed' },
          ]}
          {...register('type')}
        />

        <Textarea
          label="Description (optional)"
          placeholder="Brief summary of this lesson…"
          disabled={!canEdit}
          {...register('description')}
        />

        <Textarea
          label="Text Content"
          placeholder="Lesson text, HTML supported…"
          rows={12}
          disabled={!canEdit}
          hint="You can use basic HTML for formatting."
          {...register('textContent')}
        />

        <Input
          label="Duration (seconds)"
          type="number"
          placeholder="e.g. 600 for 10 minutes"
          disabled={!canEdit}
          {...register('duration')}
        />

        {canEdit && (
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="navy"
              loading={isSubmitting}
              disabled={!isDirty && !isNew}
            >
              {isNew ? 'Create Lesson' : 'Save Changes'}
            </Button>

            {canSubmit && (
              <Button
                type="button"
                variant="gold"
                onClick={() => setConfirmSubmit(true)}
              >
                Submit for Review →
              </Button>
            )}
          </div>
        )}

        {!canEdit && (
          <div className="p-4 bg-gray-50 rounded-xl text-sm text-slate border border-gray-100">
            This lesson is <strong>{lesson?.status?.toLowerCase()}</strong> and cannot be edited until revision is requested or it's returned to draft.
          </div>
        )}
      </form>

      <ConfirmDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={() => submitForReview.mutate()}
        loading={submitForReview.isPending}
        title="Submit for Review?"
        message="This lesson will be sent to admins for review. You won't be able to edit it while it's pending approval."
        confirmText="Submit"
      />
    </DashboardShell>
  );
}
