'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { DashboardShell, PageHeader } from '@/components/layout/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';

interface Certificate {
  id:               string;
  verificationCode: string;
  issuedAt:         string;
  course: {
    id:    string;
    title: string;
    instructor: { firstName: string; lastName: string };
  };
}

export default function CertificatesPage() {
  const user = useAuthStore((s) => s.user);

  const { data: certs, isLoading } = useQuery<Certificate[]>({
    queryKey: ['certificates'],
    queryFn:  () => api.get('/certificates/me'),
  });

  return (
    <DashboardShell title="Certificates">
      <PageHeader
        title="My Certificates"
        description="Your earned certificates of completion."
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : !certs?.length ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🏅</p>
          <p className="font-serif text-lg font-semibold text-charcoal mb-1">No certificates yet</p>
          <p className="text-sm text-slate">Complete a course to earn your first certificate!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {certs.map((cert) => (
            <CertificateCard key={cert.id} cert={cert} userName={`${user?.firstName} ${user?.lastName}`} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function CertificateCard({
  cert,
  userName,
}: {
  cert: Certificate;
  userName: string;
}) {
  function handleDownload() {
    // Print/PDF via browser print dialog
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate — ${cert.course.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter&display=swap');
          body { margin: 0; background: #0B1C3E; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: Inter, sans-serif; }
          .cert { background: #FAF8F3; width: 780px; padding: 60px; border: 8px solid #C9A84C; text-align: center; }
          h1 { font-family: 'Playfair Display', serif; color: #0B1C3E; font-size: 36px; margin: 0 0 8px; }
          .sub { color: #64748B; font-size: 14px; }
          .name { font-family: 'Playfair Display', serif; font-size: 32px; color: #C9A84C; margin: 24px 0 8px; }
          .course { font-family: 'Playfair Display', serif; font-size: 22px; color: #1E293B; }
          .code { margin-top: 32px; font-size: 12px; color: #94A3B8; letter-spacing: 2px; }
          .date { color: #64748B; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="cert">
          <p class="sub">JETHRO ACADEMY</p>
          <h1>Certificate of Completion</h1>
          <p class="sub">This is to certify that</p>
          <p class="name">${userName}</p>
          <p class="sub">has successfully completed</p>
          <p class="course">${cert.course.title}</p>
          <p class="sub" style="margin-top:8px">Instructed by ${cert.course.instructor.firstName} ${cert.course.instructor.lastName}</p>
          <p class="date" style="margin-top:24px">Issued on ${formatDate(cert.issuedAt)}</p>
          <p class="code">${cert.verificationCode}</p>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="card border-2 border-gold/20 relative overflow-hidden">
      {/* Gold accent corner */}
      <div className="absolute top-0 right-0 h-16 w-16 bg-gold/10 rounded-bl-3xl" />

      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🏅</span>
        <Badge variant="gold">Certificate</Badge>
      </div>

      <h3 className="font-serif text-base font-semibold text-charcoal line-clamp-2 mb-1 leading-snug">
        {cert.course.title}
      </h3>
      <p className="text-xs text-slate mb-4">
        {cert.course.instructor.firstName} {cert.course.instructor.lastName}
      </p>

      <div className="bg-ivory rounded-xl p-3 mb-4 font-mono text-xs text-charcoal text-center tracking-widest">
        {cert.verificationCode}
      </div>

      <p className="text-xs text-slate mb-4">Issued {formatDate(cert.issuedAt)}</p>

      <div className="flex gap-2">
        <Button size="sm" variant="gold" className="flex-1" onClick={handleDownload}>
          Download PDF
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(cert.verificationCode);
          }}
        >
          Copy Code
        </Button>
      </div>
    </div>
  );
}
