import { cn } from '@/lib/utils';

/* ── Card ─────────────────────────────────────────────────── */
interface CardProps {
  children:   React.ReactNode;
  className?: string;
  hover?:     boolean;
  onClick?:   () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'card',
        hover && 'cursor-pointer transition-shadow duration-200 hover:shadow-md',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── Card sub-components ──────────────────────────────────── */
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('font-serif text-lg font-semibold text-charcoal', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm text-slate mt-1', className)}>{children}</p>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mt-6 pt-4 border-t border-gray-100 flex items-center gap-3', className)}>
      {children}
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────────── */
interface StatCardProps {
  label:      string;
  value:      string | number;
  icon?:      React.ReactNode;
  trend?:     { value: string; up: boolean };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('flex items-start gap-4', className)}>
      {icon && (
        <div className="h-11 w-11 rounded-xl bg-navy/5 flex items-center justify-center text-navy shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate truncate">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-charcoal tabular-nums">{value}</p>
        {trend && (
          <p className={cn('mt-1 text-xs font-medium', trend.up ? 'text-emerald-600' : 'text-red-500')}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </Card>
  );
}
