import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  src?:       string | null;
  firstName?: string;
  lastName?:  string;
  name?:      string;          // fallback — first letter used
  size?:      'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  online?:    boolean;
}

const sizes = {
  xs:  { wrapper: 'h-6 w-6',   text: 'text-[10px]', ring: 'h-2 w-2 -bottom-px -right-px' },
  sm:  { wrapper: 'h-8 w-8',   text: 'text-xs',      ring: 'h-2.5 w-2.5 -bottom-px -right-px' },
  md:  { wrapper: 'h-10 w-10', text: 'text-sm',      ring: 'h-3 w-3 -bottom-px -right-px' },
  lg:  { wrapper: 'h-14 w-14', text: 'text-base',    ring: 'h-3.5 w-3.5 bottom-0 right-0' },
  xl:  { wrapper: 'h-20 w-20', text: 'text-xl',      ring: 'h-4 w-4 bottom-0.5 right-0.5' },
};

export function Avatar({ src, firstName, lastName, name, size = 'md', className, online }: AvatarProps) {
  const { wrapper, text, ring } = sizes[size];

  let initials = '';
  if (firstName && lastName) {
    initials = getInitials(firstName, lastName);
  } else if (name) {
    const parts = name.trim().split(' ');
    initials = parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (parts[0][0] ?? '').toUpperCase();
  }

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center',
          'bg-navy text-ivory font-semibold select-none',
          wrapper,
          text,
        )}
      >
        {src ? (
          <Image src={src} alt={initials || 'Avatar'} fill className="object-cover" sizes="80px" />
        ) : (
          initials || '?'
        )}
      </div>

      {online !== undefined && (
        <span
          className={cn(
            'absolute rounded-full border-2 border-white',
            ring,
            online ? 'bg-emerald-500' : 'bg-gray-300',
          )}
        />
      )}
    </div>
  );
}

/* ── Avatar group ─────────────────────────────────────────── */
interface AvatarGroupProps {
  users:      Array<{ firstName?: string; lastName?: string; avatarUrl?: string | null }>;
  max?:       number;
  size?:      AvatarProps['size'];
}

export function AvatarGroup({ users, max = 5, size = 'sm' }: AvatarGroupProps) {
  const visible  = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center">
      {visible.map((u, i) => (
        <div key={i} className={cn('ring-2 ring-white rounded-full', i > 0 && '-ml-2')}>
          <Avatar
            src={u.avatarUrl}
            firstName={u.firstName}
            lastName={u.lastName}
            size={size}
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            '-ml-2 ring-2 ring-white rounded-full',
            'flex items-center justify-center bg-gray-100 text-slate font-semibold',
            sizes[size].wrapper,
            sizes[size].text,
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
