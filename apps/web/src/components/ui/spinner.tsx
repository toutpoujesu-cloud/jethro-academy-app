import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?:  'sm' | 'md' | 'lg' | 'xl';
  color?: 'gold' | 'navy' | 'white' | 'slate';
  className?: string;
}

const sizes = {
  sm:  'h-4 w-4 border-2',
  md:  'h-6 w-6 border-2',
  lg:  'h-9 w-9 border-[3px]',
  xl:  'h-14 w-14 border-4',
};

const colors = {
  gold:  'border-gold/30 border-t-gold',
  navy:  'border-navy/20 border-t-navy',
  white: 'border-white/30 border-t-white',
  slate: 'border-slate/20 border-t-slate',
};

export function Spinner({ size = 'md', color = 'navy', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block rounded-full animate-spin',
        sizes[size],
        colors[color],
        className,
      )}
    />
  );
}
