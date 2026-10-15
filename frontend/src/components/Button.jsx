import React from 'react';
import { Link } from '@inertiajs/react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  to,
  onClick,
  disabled,
  type = 'button',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-action active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const variants = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)]',
    secondary: 'bg-surface text-text-primary border border-border hover:bg-bg',
    accent: 'bg-[var(--color-accent)] text-[#0B1F3A] hover:brightness-110',
    danger: 'bg-error text-white hover:bg-red-600',
    ghost: 'text-text-secondary hover:bg-bg hover:text-text-primary',
    white: 'bg-surface text-text-primary hover:bg-bg shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px]',
    md: 'text-sm px-4 py-2 min-h-[44px]',
    lg: 'text-base px-6 py-3 min-h-[48px]',
    icon: 'p-2 min-w-[44px] min-h-[44px]',
  };

  const classes = `${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;

  if (to) {
    return (
      <Link href={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
