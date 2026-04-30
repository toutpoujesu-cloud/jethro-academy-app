import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-navy px-12 py-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gold flex items-center justify-center">
            <span className="font-serif font-bold text-white text-lg">J</span>
          </div>
          <span className="font-serif font-bold text-ivory text-xl tracking-tight">
            Jethro Academy
          </span>
        </div>

        {/* Quote */}
        <div>
          <blockquote className="font-serif text-2xl font-medium text-ivory/90 leading-snug mb-4">
            "I can do all things through Christ who strengthens me."
          </blockquote>
          <p className="text-sm text-ivory/50">— Philippians 4:13</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '500+', label: 'Courses' },
            { value: '12K+', label: 'Learners' },
            { value: '95%',  label: 'Completion' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-serif text-2xl font-bold text-gold">{s.value}</p>
              <p className="text-xs text-ivory/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-ivory">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-navy flex items-center justify-center">
              <span className="font-serif font-bold text-gold text-sm">J</span>
            </div>
            <span className="font-serif font-bold text-navy text-lg">Jethro Academy</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
