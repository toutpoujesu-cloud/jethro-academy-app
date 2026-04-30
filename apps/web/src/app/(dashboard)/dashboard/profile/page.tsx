'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { DashboardShell, PageHeader } from '@/components/layout/dashboard-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/store/ui.store';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName:  z.string().min(1, 'Required'),
  bio:       z.string().max(500).optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword:     z.string().min(8, 'Minimum 8 characters').regex(/^(?=.*[A-Z])(?=.*[0-9])/, 'Include uppercase and number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const user       = useAuthStore((s) => s.user);
  const qc         = useQueryClient();
  const [tab, setTab] = useState<'profile' | 'security'>('profile');

  /* ── Profile form ────────────────────────────── */
  const {
    register:    regProfile,
    handleSubmit: handleProfile,
    formState:   { errors: pErr, isSubmitting: pSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName, lastName: user?.lastName },
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => api.patch(`/users/${user?.id}`, data),
    onSuccess:  () => {
      toast.success('Profile updated!');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: () => toast.error('Update failed.'),
  });

  /* ── Password form ───────────────────────────── */
  const {
    register:    regPw,
    handleSubmit: handlePw,
    reset:       resetPw,
    formState:   { errors: pwErr, isSubmitting: pwSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const changePassword = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.patch('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      }),
    onSuccess: () => {
      toast.success('Password changed!');
      resetPw();
    },
    onError: () => toast.error('Incorrect current password.'),
  });

  return (
    <DashboardShell title="Profile">
      <PageHeader title="My Profile" description="Manage your account information." />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['profile', 'security'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-navy text-white' : 'bg-white text-slate border border-gray-200 hover:border-navy/30'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Avatar */}
          <div className="lg:col-span-1">
            <div className="card text-center">
              <Avatar
                src={user?.avatarUrl}
                firstName={user?.firstName}
                lastName={user?.lastName}
                size="xl"
                className="mx-auto mb-4"
              />
              <p className="font-semibold text-charcoal">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-slate mt-0.5">{user?.email}</p>
              <Badge variant="navy" className="mt-3 capitalize">
                {user?.role?.toLowerCase().replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="font-serif text-base font-semibold text-charcoal mb-5">
                Personal Information
              </h2>
              <form
                onSubmit={handleProfile((d) => updateProfile.mutate(d))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First name"
                    error={pErr.firstName?.message}
                    {...regProfile('firstName')}
                  />
                  <Input
                    label="Last name"
                    error={pErr.lastName?.message}
                    {...regProfile('lastName')}
                  />
                </div>

                <Input
                  label="Email address"
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  hint="Email cannot be changed."
                />

                <div className="pt-2">
                  <Button type="submit" variant="gold" loading={pSubmitting}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="max-w-md">
          <div className="card">
            <h2 className="font-serif text-base font-semibold text-charcoal mb-5">
              Change Password
            </h2>
            <form
              onSubmit={handlePw((d) => changePassword.mutate(d))}
              className="space-y-4"
            >
              <Input
                label="Current password"
                type="password"
                error={pwErr.currentPassword?.message}
                {...regPw('currentPassword')}
              />
              <Input
                label="New password"
                type="password"
                error={pwErr.newPassword?.message}
                hint="Min 8 chars with uppercase and number"
                {...regPw('newPassword')}
              />
              <Input
                label="Confirm new password"
                type="password"
                error={pwErr.confirmPassword?.message}
                {...regPw('confirmPassword')}
              />
              <Button type="submit" variant="navy" loading={pwSubmitting}>
                Update Password
              </Button>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
