'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { DashboardShell, PageHeader } from '@/components/layout/dashboard-shell';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';

interface EnrolledCourse {
  id:         string;
  enrolledAt: string;
  progress:   number;
  completed:  boolean;
  course: {
    id:           string;
    title:        string;
    slug:         string;
    thumbnailUrl?: string | null;
    totalLessons: number;
    instructor:   { firstName: string; lastName: string };
    expertiseAreas: { name: string }[];
  };
}

export default function CoursesPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const { data, isLoading } = useQuery<EnrolledCourse[]>({
    queryKey: ['my-enrollments', 'all'],
    queryFn:  () => api.get('/enrollments/me?limit=100'),
  });

  const filtered = (data ?? []).filter((e) => {
    if (filter === 'active')    return !e.completed;
    if (filter === 'completed') return e.completed;
    return true;
  });

  return (
    <DashboardShell title="My Courses">
      <PageHeader
        title="My Courses"
        description="All your enrolled courses in one place."
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-navy text-white'
                : 'bg-white text-slate border border-gray-200 hover:border-navy/30'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : !filtered.length ? (
        <div className="card text-center py-16">
          <p className="text-slate text-sm mb-4">
            {filter === 'completed'
              ? "You haven't completed any courses yet. Keep going!"
              : filter === 'active'
              ? 'No active courses. Browse the catalog!'
              : "You're not enrolled in any courses yet."}
          </p>
          <Button variant="gold">Browse Courses</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((e) => (
            <Link
              key={e.id}
              href={`/dashboard/courses/${e.course.id}`}
              className="card hover:shadow-md transition-shadow duration-200 flex flex-col"
            >
              {/* Thumbnail */}
              <div className="h-36 rounded-xl bg-gradient-to-br from-navy to-navy-light flex items-center justify-center mb-4 overflow-hidden">
                {e.course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.course.thumbnailUrl}
                    alt={e.course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-4xl text-gold/30 font-bold">J</span>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {e.course.expertiseAreas.slice(0, 2).map((a) => (
                  <Badge key={a.name} variant="navy" className="text-[10px]">{a.name}</Badge>
                ))}
              </div>

              {/* Title */}
              <h3 className="font-serif font-semibold text-charcoal line-clamp-2 leading-snug flex-1">
                {e.course.title}
              </h3>
              <p className="text-xs text-slate mt-1 mb-4">
                {e.course.instructor.firstName} {e.course.instructor.lastName}
              </p>

              {/* Progress */}
              <ProgressBar value={e.progress} size="sm" showValue />
              <p className="mt-1 text-[11px] text-slate/70">
                Enrolled {formatDate(e.enrolledAt)}
              </p>

              {e.completed && (
                <Badge variant="success" className="mt-3 self-start">Completed</Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
