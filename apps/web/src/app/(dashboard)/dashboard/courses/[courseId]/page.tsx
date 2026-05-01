'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/store/ui.store';
import { formatDuration, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface LessonProgress {
  lessonId:   string;
  status:     string;
  score?:     number | null;
  feedback?:  string | null;
}

interface Lesson {
  id:         string;
  title:      string;
  type:       string;
  duration?:  number | null;
  order:      number;
  status:     string;
  progress?:  LessonProgress | null;
}

interface Module {
  id:       string;
  title:    string;
  order:    number;
  lessons:  Lesson[];
}

interface CourseDetail {
  id:           string;
  title:        string;
  description?: string | null;
  thumbnailUrl?: string | null;
  price:        number;
  modules:      Module[];
  instructor:   { firstName: string; lastName: string };
  enrollment?:  { progress: number; completed: boolean; enrolledAt: string } | null;
  totalLessons: number;
  completedLessons: number;
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const { data: course, isLoading } = useQuery<CourseDetail>({
    queryKey: ['course', courseId],
    queryFn:  () => api.get(`/courses/${courseId}`),
    enabled:  Boolean(courseId),
  });

  const enroll = useMutation({
    mutationFn: () => api.post<{ url?: string }>(`/payments/checkout`, { courseId }),
    onSuccess:  (data: { url?: string }) => {
      if (data.url) window.location.href = data.url;
    },
    onError: () => toast.error('Failed to initiate checkout.'),
  });

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex justify-center py-24">
          <Spinner size="xl" />
        </div>
      </DashboardShell>
    );
  }

  if (!course) {
    return (
      <DashboardShell>
        <div className="text-center py-16">
          <p className="text-slate">Course not found.</p>
          <Link href="/dashboard/courses" className="mt-4 inline-block text-gold hover:underline">
            ← Back to Courses
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const enrolled    = Boolean(course.enrollment);
  const progress    = course.enrollment?.progress ?? 0;
  const totalDuration = course.modules
    .flatMap((m) => m.lessons)
    .reduce((acc, l) => acc + (l.duration ?? 0), 0);

  return (
    <DashboardShell title={course.title}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate mb-6">
        <Link href="/dashboard/courses" className="hover:text-navy transition-colors">
          My Courses
        </Link>
        <span>›</span>
        <span className="text-charcoal font-medium line-clamp-1">{course.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left — course info + modules */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-charcoal mb-2">
              {course.title}
            </h1>
            <p className="text-sm text-slate">
              By {course.instructor.firstName} {course.instructor.lastName}
            </p>
            {course.description && (
              <p className="mt-3 text-sm text-charcoal/80 leading-relaxed">
                {course.description}
              </p>
            )}
          </div>

          {enrolled && (
            <ProgressBar
              value={progress}
              label="Your progress"
              showValue
              size="md"
            />
          )}

          {/* Modules accordion */}
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-charcoal">Course Content</h2>
            {course.modules.sort((a, b) => a.order - b.order).map((mod) => {
              const open = expandedModules.has(mod.id);
              const modCompleted = mod.lessons.every(
                (l) => l.progress?.status === 'COMPLETED',
              );

              return (
                <div key={mod.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-ivory transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                        modCompleted ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300',
                      )}>
                        {modCompleted && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="h-3 w-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="font-semibold text-sm text-charcoal text-left">{mod.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate hidden sm:block">
                        {mod.lessons.length} lessons
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className={cn('h-4 w-4 text-slate transition-transform', open && 'rotate-180')}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {open && (
                    <div className="divide-y divide-gray-50 border-t border-gray-100">
                      {mod.lessons.sort((a, b) => a.order - b.order).map((lesson) => {
                        const done = lesson.progress?.status === 'COMPLETED';
                        const canPlay = enrolled && lesson.status === 'APPROVED';

                        return (
                          <div
                            key={lesson.id}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 bg-white',
                              canPlay && 'hover:bg-ivory cursor-pointer transition-colors',
                            )}
                            onClick={() =>
                              canPlay && router.push(`/dashboard/lessons/${lesson.id}`)
                            }
                          >
                            {/* Status icon */}
                            <span className={cn(
                              'h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs',
                              done
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-gray-100 text-slate',
                            )}>
                              {done ? '✓' : lesson.order}
                            </span>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-charcoal">{lesson.title}</p>
                              <p className="text-[11px] text-slate capitalize">
                                {lesson.type.toLowerCase()} · {lesson.duration ? formatDuration(lesson.duration) : '—'}
                              </p>
                            </div>

                            {lesson.progress?.score != null && (
                              <Badge variant="gold">{lesson.progress.score}%</Badge>
                            )}
                            {!enrolled && <Badge variant="default">🔒</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — enrollment card */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            {course.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-40 object-cover rounded-xl mb-4"
              />
            )}

            <div className="space-y-2 mb-4 text-sm text-slate">
              <div className="flex justify-between">
                <span>Lessons</span>
                <span className="font-semibold text-charcoal">{course.totalLessons}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-semibold text-charcoal">{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span>Instructor</span>
                <span className="font-semibold text-charcoal">
                  {course.instructor.firstName} {course.instructor.lastName}
                </span>
              </div>
            </div>

            {enrolled ? (
              <div className="space-y-3">
                <p className="text-xs text-slate text-center">
                  Enrolled {formatDate(course.enrollment!.enrolledAt)}
                </p>
                <Link href={`/dashboard/lessons/${course.modules[0]?.lessons[0]?.id ?? ''}`}>
                  <Button variant="gold" className="w-full">
                    {progress > 0 ? 'Continue Learning' : 'Start Course'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-2xl font-bold text-charcoal text-center">
                  {course.price === 0
                    ? 'Free'
                    : `$${(course.price / 100).toFixed(2)}`}
                </p>
                <Button
                  variant="gold"
                  className="w-full"
                  loading={enroll.isPending}
                  onClick={() => enroll.mutate()}
                >
                  Enroll Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
