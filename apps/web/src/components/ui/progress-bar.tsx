import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value:      number; // 0-100
  size?:      'sm' | 'md' | 'lg';
  color?:     'gold' | 'navy' | 'green' | 'blue';
  label?:     string;
  showValue?: boolean;
  className?: string;
}

const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

const fills = {
  gold:  'bg-gold',
  navy:  'bg-navy',
  green: 'bg-emerald-500',
  blue:  'bg-sky-500',
};

export function ProgressBar({
  value,
  size  = 'md',
  color = 'gold',
  label,
  showValue,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label    && <span className="text-xs font-medium text-slate">{label}</span>}
          {showValue && <span className="text-xs font-semibold text-charcoal">{pct}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn('w-full bg-gray-100 rounded-full overflow-hidden', heights[size])}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', fills[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
