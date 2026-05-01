'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardRoute } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/store/ui.store';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

// Inner component reads useSearchParams — must be inside <Suspense>
function LoginForm() {
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const next           = searchParams.get('next') ?? '';
  const login          = useAuthStore((s) => s.login);
  const user           = useAuthStore((s) => s.user);
  const dashboardRoute = useDashboardRoute();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) router.replace(next || dashboardRoute);
  }, [user, router, next, dashboardRoute]);

  async function onSubmit(data: FormValues) {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      router.replace(next || dashboardRoute);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid email or password.';
      toast.error(msg);
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="font-serif text-3xl font-bold text-charcoal mb-1">Welcome back</h2>
      <p className="text-sm text-slate mb-8">Sign in to continue your journey.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPw ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          suffix={
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="text-slate hover:text-charcoal transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          }
          {...register('password')}
        />

        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="text-xs text-gold hover:text-gold-dark transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="gold" size="lg" loading={isSubmitting} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-navy font-semibold hover:text-gold transition-colors">
          Create one free
        </Link>
      </p>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-xs text-slate/60">
          By signing in, you agree to our{' '}
          <a href="#" className="underline hover:text-slate">Terms</a> and{' '}
          <a href="#" className="underline hover:text-slate">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner /></div>}>
      <LoginForm />
    </Suspense>
  );
}
