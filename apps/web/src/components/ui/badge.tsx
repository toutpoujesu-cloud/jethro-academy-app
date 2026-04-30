import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'gold'
  | 'navy'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'draft'
  | 'approved'
  | 'revision';

interface BadgeProps {
  children:   React.ReactNode;
  variant?:   BadgeVariant;
  dot?:       boolean;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-gray-100 text-gray-700',
  gold:     'bg-gold/15 text-gold-dark',
  navy:     'bg-navy/10 text-navy',
  success:  'bg-emerald-100 text-emerald-700',
  warning:  'bg-amber-100 text-amber-700',
  danger:   'bg-red-100 text-red-700',
  info:     'bg-sky-100 text-sky-700',
  draft:    'bg-gray-100 text-gray-600',
  approved: 'bg-emerald-100 text-emerald-700',
  revision: 'bg-amber-100 text-amber-700',
};

const dotColors: Record<BadgeVariant, string> = {
  default:  'bg-gray-500',
  gold:     'bg-gold',
  navy:     'bg-navy',
  success:  'bg-emerald-500',
  warning:  'bg-amber-500',
  danger:   'bg-red-500',
  info:     'bg-sky-500',
  draft:    'bg-gray-400',
  approved: 'bg-emerald-500',
  revision: 'bg-amber-500',
};

export function Badge({ children, variant = 'default', dot, className }: BadgeProps) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

/** Map content status → badge variant */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    DRAFT:            'draft',
    SUBMITTED:        'info',
    APPROVED:         'approved',
    REVISION_NEEDED:  'revision',
    ARCHIVED:         'default',
    ACTIVE:           'success',
    INACTIVE:         'warning',
    SUSPENDED:        'danger',
    PENDING:          'warning',
    COMPLETED:        'success',
    FAILED:           'danger',
    REFUNDED:         'default',
  };
  const variant = map[status] ?? 'default';
  const label   = status.replace(/_/g, ' ');
  return <Badge variant={variant} dot>{label}</Badge>;
}
