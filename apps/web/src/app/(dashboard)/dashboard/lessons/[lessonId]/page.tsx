'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/input';
import { toast } from '@/store/ui.store';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  id:       string;
  question: string;
  type:     string;
  options?: string[] | null;
  order:    number;
}

interface Assignment {
  id:          string;
  title:       string;
  description?: string | null;
  maxScore:    number;
  dueInDays?:  number | null;
}

interface LessonDetail {
  id:           string;
  title:        string;
  type:         string;
  description?: string | null;
  videoUrl?:    string | null;
  vimeoId?:     string | null;
  s3Key?:       string | null;
  textContent?: string | null;
  duration?:    number | null;
  moduleId:     string;
  module: {
    title:  string;
    courseId: string;
    course: { title: string };
  };
  quiz?:        { id: string; passingScore: number; questions: QuizQuestion[] } | null;
  assignment?:  Assignment | null;
  progress?: {
    status:              string;
    videoWatched:        boolean;
    quizSubmitted:       boolean;
    assignmentSubmitted: boolean;
    quizScore?:          number | null;
    assignmentScore?:    number | null;
    assignmentFeedback?: string | null;
    gradedAt?:           string | null;
  } | null;
}

export default function LessonPlayerPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [quizAnswers,        setQuizAnswers]        = useState<Record<string, string>>({});
  const [assignmentText,     setAssignmentText]     = useState('');
  const [quizSubmitted,      setQuizSubmitted]      = useState(false);
  const [quizScore,          setQuizScore]          = useState<number | null>(null);

  const { data: lesson, isLoading } = useQuery<LessonDetail>({
    queryKey: ['lesson', lessonId],
    queryFn:  () => api.get(`/lessons/${lessonId}`),
    enabled:  Boolean(lessonId),
  });

  // Mark video watched
  const markWatched = useMutation({
    mutationFn: () =>
      api.patch(`/progress/${lessonId}/video-watched`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['lesson', lessonId] }),
  });

  // Submit quiz
  const submitQuiz = useMutation({
    mutationFn: (answers: Record<string, string>) =>
      api.post<{ score: number; passed: boolean }>(`/progress/${lessonId}/quiz`, { answers }),
    onSuccess: (data) => {
      setQuizSubmitted(true);
      setQuizScore(data.score);
      qc.invalidateQueries({ queryKey: ['lesson', lessonId] });
      if (data.passed) {
        toast.success(`Quiz passed! Score: ${data.score}%`);
      } else {
        toast.error(`Score: ${data.score}% — below passing. Review and try again.`);
      }
    },
    onError: () => toast.error('Failed to submit quiz.'),
  });

  // Submit assignment
  const submitAssignment = useMutation({
    mutationFn: (submission: string) =>
      api.post(`/progress/${lessonId}/assignment`, { submission }),
    onSuccess: () => {
      toast.success('Assignment submitted for grading!');
      qc.invalidateQueries({ queryKey: ['lesson', lessonId] });
    },
    onError: () => toast.error('Failed to submit assignment.'),
  });

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex justify-center py-24">
          <Spinner size="xl" />
        </div>
      </DashboardShell>
    );
  }

  if (!lesson) {
    return (
      <DashboardShell>
        <div className="text-center py-16">
          <p className="text-slate">Lesson not found or not yet approved.</p>
          <button onClick={() => router.back()} className="mt-4 text-gold hover:underline text-sm">
            ← Go back
          </button>
        </div>
      </DashboardShell>
    );
  }

  const p = lesson.progress;

  return (
    <DashboardShell title={lesson.title}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate mb-4 flex-wrap">
        <button onClick={() => router.back()} className="hover:text-navy transition-colors">
          {lesson.module.course.title}
        </button>
        <span>›</span>
        <span className="text-slate">{lesson.module.title}</span>
        <span>›</span>
        <span className="text-charcoal font-medium">{lesson.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video player */}
          {(lesson.vimeoId || lesson.videoUrl) && (
            <div className="card p-0 overflow-hidden">
              <div className="aspect-video bg-black">
                {lesson.vimeoId ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${lesson.vimeoId}?autoplay=0&color=C9A84C`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={lesson.title}
                    onEnded={() => !p?.videoWatched && markWatched.mutate()}
                  />
                ) : (
                  <video
                    src={lesson.videoUrl ?? ''}
                    controls
                    className="w-full h-full"
                    onEnded={() => !p?.videoWatched && markWatched.mutate()}
                  />
                )}
              </div>
              {!p?.videoWatched && (
                <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex items-center justify-between">
                  <p className="text-xs text-amber-700">Watch the full video to mark it complete</p>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={markWatched.isPending}
                    onClick={() => markWatched.mutate()}
                  >
                    Mark Watched
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Text content */}
          {lesson.textContent && (
            <div className="card prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: lesson.textContent }} />
            </div>
          )}

          {/* Quiz */}
          {lesson.quiz && (
            <div className="card">
              <h2 className="font-serif text-lg font-semibold text-charcoal mb-1">Quiz</h2>
              <p className="text-xs text-slate mb-4">
                Passing score: {lesson.quiz.passingScore}%
              </p>

              {(p?.quizSubmitted || quizSubmitted) ? (
                <div className="text-center py-6">
                  <p className="text-3xl font-bold text-charcoal">
                    {p?.quizScore ?? quizScore ?? 0}%
                  </p>
                  <p className="text-sm text-slate mt-1">Quiz Score</p>
                  {(p?.quizScore ?? quizScore ?? 0) >= lesson.quiz.passingScore ? (
                    <Badge variant="success" className="mt-3">Passed ✓</Badge>
                  ) : (
                    <Badge variant="danger" className="mt-3">Not Passed</Badge>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {lesson.quiz.questions
                    .sort((a, b) => a.order - b.order)
                    .map((q, idx) => (
                      <div key={q.id}>
                        <p className="text-sm font-medium text-charcoal mb-3">
                          {idx + 1}. {q.question}
                        </p>
                        {q.type === 'MULTIPLE_CHOICE' && q.options ? (
                          <div className="space-y-2">
                            {q.options.map((opt) => (
                              <label
                                key={opt}
                                className={cn(
                                  'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                                  quizAnswers[q.id] === opt
                                    ? 'border-gold bg-gold/5'
                                    : 'border-gray-200 hover:border-navy/30',
                                )}
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={opt}
                                  checked={quizAnswers[q.id] === opt}
                                  onChange={() =>
                                    setQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                  }
                                  className="accent-gold"
                                />
                                <span className="text-sm text-charcoal">{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <Textarea
                            placeholder="Your answer…"
                            value={quizAnswers[q.id] ?? ''}
                            onChange={(e) =>
                              setQuizAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                          />
                        )}
                      </div>
                    ))}

                  <Button
                    variant="gold"
                    loading={submitQuiz.isPending}
                    disabled={
                      lesson.quiz.questions.some((q) => !quizAnswers[q.id]?.trim())
                    }
                    onClick={() => submitQuiz.mutate(quizAnswers)}
                  >
                    Submit Quiz
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Assignment */}
          {lesson.assignment && (
            <div className="card">
              <h2 className="font-serif text-lg font-semibold text-charcoal mb-1">
                {lesson.assignment.title}
              </h2>
              {lesson.assignment.description && (
                <p className="text-sm text-slate mb-4">{lesson.assignment.description}</p>
              )}

              {p?.assignmentSubmitted ? (
                <div className="space-y-3">
                  <Badge variant="info">Submitted — awaiting grading</Badge>
                  {p.assignmentScore != null && (
                    <div className="bg-ivory rounded-xl p-4">
                      <p className="text-sm font-semibold text-charcoal">
                        Score: {p.assignmentScore} / {lesson.assignment.maxScore}
                      </p>
                      {p.assignmentFeedback && (
                        <p className="text-sm text-slate mt-1">{p.assignmentFeedback}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    label="Your submission"
                    placeholder="Write your assignment response here…"
                    value={assignmentText}
                    onChange={(e) => setAssignmentText(e.target.value)}
                    rows={8}
                  />
                  <Button
                    variant="navy"
                    loading={submitAssignment.isPending}
                    disabled={!assignmentText.trim()}
                    onClick={() => submitAssignment.mutate(assignmentText)}
                  >
                    Submit Assignment
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar — progress checklist */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h3 className="font-serif text-base font-semibold text-charcoal mb-4">
              Lesson Progress
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: 'Watch Video',
                  done:  p?.videoWatched ?? false,
                  show:  Boolean(lesson.vimeoId || lesson.videoUrl),
                },
                {
                  label: 'Complete Quiz',
                  done:  p?.quizSubmitted ?? false,
                  show:  Boolean(lesson.quiz),
                },
                {
                  label: 'Submit Assignment',
                  done:  p?.assignmentSubmitted ?? false,
                  show:  Boolean(lesson.assignment),
                },
              ]
                .filter((item) => item.show)
                .map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                        item.done
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300',
                      )}
                    >
                      {item.done && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="h-3 w-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className={cn('text-sm', item.done ? 'text-charcoal line-through' : 'text-charcoal')}>
                      {item.label}
                    </span>
                  </div>
                ))}
            </div>

            {p?.status === 'COMPLETED' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Badge variant="success" dot>Lesson Complete!</Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
