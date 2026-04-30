'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DashboardShell, PageHeader } from '@/components/layout/dashboard-shell';
import { StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/store/ui.store';

interface Overview {
  totalUsers:            number;
  totalInstructors:      number;
  totalLearners:         number;
  totalCourses:          number;
  totalLessons:          number;
  totalEnrollments:      number;
  totalRevenue:          number;
  activeStudents:        number;
  pendingReview:         number;
  certificatesIssued:    number;
  completionRate:        number;
}

interface CourseRevenue {
  courseId:   string;
  courseTitle: string;
  totalRevenue: number;
  enrollments:  number;
}

export default function ReportsPage() {
  const [tab, setTab] = useState<'overview' | 'revenue'>('overview');
  const [exporting, setExporting] = useState(false);

  const { data: overview, isLoading: loadingOverview } = useQuery<Overview>({
    queryKey: ['reports-overview'],
    queryFn:  () => api.get('/reports/overview'),
  });

  const { data: revenue, isLoading: loadingRevenue } = useQuery<CourseRevenue[]>({
    queryKey: ['reports-revenue'],
    queryFn:  () => api.get('/reports/revenue'),
    enabled:  tab === 'revenue',
  });

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await api.get<string>('/reports/export/enrollments');
      const blob = new Blob([csv as unknown as string], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `jethro-enrollments-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded!');
    } catch {
      toast.error('Export failed.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <DashboardShell title="Reports">
      <PageHeader
        title="Platform Reports"
        description="Insights and analytics for the Jethro Academy platform."
        action={
          <Button variant="outline" loading={exporting} onClick={handleExport}>
            Export CSV
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overview', 'revenue'] as const).map((t) => (
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

      {tab === 'overview' && (
        <>
          {loadingOverview ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users',         value: overview?.totalUsers         ?? 0 },
                { label: 'Instructors',          value: overview?.totalInstructors   ?? 0 },
                { label: 'Learners',             value: overview?.totalLearners      ?? 0 },
                { label: 'Active Students',      value: overview?.activeStudents     ?? 0 },
                { label: 'Courses',              value: overview?.totalCourses       ?? 0 },
                { label: 'Lessons',              value: overview?.totalLessons       ?? 0 },
                { label: 'Enrollments',          value: overview?.totalEnrollments   ?? 0 },
                { label: 'Certificates Issued',  value: overview?.certificatesIssued ?? 0 },
                { label: 'Total Revenue',        value: formatPrice(overview?.totalRevenue ?? 0) },
                { label: 'Pending Review',       value: overview?.pendingReview      ?? 0 },
                { label: 'Completion Rate',      value: `${overview?.completionRate ?? 0}%` },
              ].map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'revenue' && (
        <>
          {loadingRevenue ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : !revenue?.length ? (
            <div className="card text-center py-10">
              <p className="text-slate text-sm">No revenue data yet.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {['Course', 'Enrollments', 'Revenue'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {revenue
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map((r) => (
                      <tr key={r.courseId} className="hover:bg-ivory transition-colors">
                        <td className="px-4 py-3 font-medium text-charcoal">{r.courseTitle}</td>
                        <td className="px-4 py-3 text-slate">{r.enrollments}</td>
                        <td className="px-4 py-3 font-semibold text-charcoal">
                          {formatPrice(r.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="border-t border-gray-100 bg-gray-50/80">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-charcoal">Total</td>
                    <td className="px-4 py-3 font-semibold text-charcoal">
                      {revenue.reduce((a, r) => a + r.enrollments, 0)}
                    </td>
                    <td className="px-4 py-3 font-bold text-charcoal">
                      {formatPrice(revenue.reduce((a, r) => a + r.totalRevenue, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
