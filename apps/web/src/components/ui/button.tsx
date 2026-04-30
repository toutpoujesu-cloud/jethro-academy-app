import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'navy' | 'outline' | 'ghost' | 'danger';
  size?:    'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?:    React.ReactNode;
  iconRight?: React.ReactNode;
}

const variants = {
  gold:    'btn-gold',
  navy:    'bg-navy text-white font-semibold rounded-xl shadow-navy hover:bg-navy-light active:scale-[.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
  outline: 'btn-navy',
  ghost:   'btn-ghost',
  danger:  'inline-flex items-center justify-center gap-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 active:scale-[.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
};

const sizes = {
  sm:  'px-3.5 py-1.5 text-xs',
  md:  'px-5 py-2.5 text-sm',
  lg:  'px-7 py-3.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant  = 'gold',
      size     = 'md',
      loading  = false,
      icon,
      iconRight,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-sans',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" color={variant === 'gold' || variant === 'navy' || variant === 'danger' ? 'white' : 'navy'} />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  },
);
Button.displayName = 'Button';
