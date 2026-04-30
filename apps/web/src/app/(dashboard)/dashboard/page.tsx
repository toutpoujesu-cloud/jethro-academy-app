'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@jethro/shared';
import { DashboardShell, PageHeader } from '@/components/layout/dashboard-shell';
import { StatCard } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

/* ── Learner Dashboard ────────────────────────────────────── */
interface LearnerStats {
  enrolledCourses:    number;
  completedCourses:   number;
  certificates:       number;
  totalLessons:       number;
  completedLessons:   number;
}

interface RecentEnrollment {
  id:          string;
  course: {
    id:         string;
    title:      string;
    thumbnailUrl?: string | null;
    instructor: { firstName: string; lastName: string };
  };
  progress:    number;
  enrolledAt:  string;
}

function LearnerDashboard({ name }: { name: string }) {
  const { data: stats, isLoading: loadingStats } = useQuery<LearnerStats>({
    queryKey: ['learner-stats'],
    queryFn:  () => api.get('/progress/stats'),
  });

  const { data: enrollments, isLoading: loadingEnrolled } = useQuery<RecentEnrollment[]>({
    queryKey: ['my-enrollments'],
    queryFn:  () => api.get('/enrollments/me?limit=4'),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardShell title="Dashboard">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-charcoal">
          {greeting}, {name}! 👋
        </h1>
        <p className="text-sm text-slate mt-1">
          &quot;I can do all things through Christ who strengthens me.&quot; — Phil. 4:13
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-100" />
          ))
        ) : (
          <>
            <StatCard
              label="Enrolled Courses"
              value={stats?.enrolledCourses ?? 0}
              icon={<BookIcon />}
            />
            <StatCard
              label="Completed"
              value={stats?.completedCourses ?? 0}
              icon={<CheckIcon />}
            />
            <StatCard
              label="Certificates"
              value={stats?.certificates ?? 0}
              icon={<CertIcon />}
            />
            <StatCard
              label="Lessons Done"
              value={`${stats?.completedLessons ?? 0} / ${stats?.totalLessons ?? 0}`}
              icon={<PlayIcon />}
            />
          </>
        )}
      </div>

      {/* Continue learning */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-charcoal">Continue Learning</h2>
          <Link href="/dashboard/courses">
            <Button variant="ghost" size="sm">View all →</Button>
          </Link>
        </div>

        {loadingEnrolled ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !enrollments?.length ? (
          <div className="card text-center py-12">
            <p className="text-slate text-sm mb-4">You have no active courses yet.</p>
            <Link href="/dashboard/courses">
              <Button variant="gold">Browse Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {enrollments.map((e) => (
              <Link
                key={e.id}
                href={`/dashboard/courses/${e.course.id}`}
                className="card hover:shadow-md transition-shadow duration-200 block"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail placeholder */}
                  <div className="h-16 w-16 rounded-xl bg-navy/10 flex items-center justify-center shrink-0 text-navy">
                    <BookIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-charcoal line-clamp-2 leading-snug">
                      {e.course.title}
                    </p>
                    <p className="text-xs text-slate mt-0.5 mb-3">
                      {e.course.instructor.firstName} {e.course.instructor.lastName}
                    </p>
                    <ProgressBar value={e.progress} size="sm" showValue />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

/* ── Admin / Super Admin Dashboard ───────────────────────── */
interface PlatformOverview {
  totalUsers:       number;
  totalCourses:     number;
  totalEnrollments: number;
  totalRevenue:     number;
  activeStudents:   number;
  pendingReview:    number;
}

function AdminDashboard({ name }: { name: string }) {
  const { data, isLoading } = useQuery<PlatformOverview>({
    queryKey: ['reports-overview'],
    queryFn:  () => api.get('/reports/overview'),
  });

  return (
    <DashboardShell title="Admin Dashboard">
      <PageHeader
        title={`Welcome, ${name}`}
        description="Platform overview and key metrics"
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse h-24 bg-gray-100" />
            ))
          : [
              { label: 'Total Users',       value: data?.totalUsers       ?? 0, icon: <UsersIcon /> },
              { label: 'Courses',           value: data?.totalCourses     ?? 0, icon: <BookIcon /> },
              { label: 'Enrollments',       value: data?.totalEnrollments ?? 0, icon: <PlayIcon /> },
              { label: 'Revenue',           value: `$${((data?.totalRevenue ?? 0) / 100).toLocaleString()}`, icon: <DollarIcon /> },
              { label: 'Active Students',   value: data?.activeStudents   ?? 0, icon: <CheckIcon /> },
              { label: 'Pending Review',    value: data?.pendingReview    ?? 0, icon: <ClockIcon /> },
            ].map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
            ))}
      </div>

      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <Link href="/dashboard/users">
          <Button variant="navy" className="w-full">Manage Users</Button>
        </Link>
        <Link href="/dashboard/content">
          <Button variant="navy" className="w-full">Review Content</Button>
        </Link>
        <Link href="/dashboard/reports">
          <Button variant="navy" className="w-full">View Reports</Button>
        </Link>
      </div>
    </DashboardShell>
  );
}

/* ── Instructor Dashboard ─────────────────────────────────── */
function InstructorDashboard({ name }: { name: string }) {
  const { data: lessons, isLoading } = useQuery<{ id: string; title: string; status: string; updatedAt: string }[]>({
    queryKey: ['my-lessons'],
    queryFn:  () => api.get('/lessons?instructorId=me&limit=5'),
  });

  return (
    <DashboardShell title="Instructor Studio">
      <PageHeader
        title={`Welcome, ${name}`}
        description="Manage your courses and content"
        action={
          <Link href="/dashboard/studio/new">
            <Button variant="gold">+ New Lesson</Button>
          </Link>
        }
      />

      <div className="card">
        <h2 className="font-serif text-base font-semibold text-charcoal mb-4">Recent Lessons</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !lessons?.length ? (
          <p className="text-sm text-slate text-center py-6">No lessons yet. Create your first!</p>
        ) : (
          <div className="space-y-3">
            {lessons.map((l) => (
              <Link
                key={l.id}
                href={`/dashboard/studio/${l.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-ivory transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-charcoal">{l.title}</p>
                  <p className="text-xs text-slate">{formatDate(l.updatedAt)}</p>
                </div>
                <StatusBadge status={l.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

/* ── Routing by role ──────────────────────────────────────── */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const name = user?.firstName ?? 'there';

  switch (user?.role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.CONTENT_ADMIN:
      return <AdminDashboard name={name} />;
    case UserRole.INSTRUCTOR:
      return <InstructorDashboard name={name} />;
    default:
      return <LearnerDashboard name={name} />;
  }
}

/* ── Inline icon components ───────────────────────────────── */
function BookIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>; }
function CheckIcon()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>; }
function CertIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>; }
function PlayIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function UsersIcon()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>; }
function DollarIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function ClockIcon()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
