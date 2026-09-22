import React from 'react';
import { Link } from 'react-router-dom';

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
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)]',
    secondary: 'bg-surface text-[var(--color-primary)] border border-border hover:bg-bg',
    accent: 'bg-[var(--color-accent)] text-white hover:brightness-110',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'text-text-secondary hover:bg-bg hover:text-text-primary',
    white: 'bg-surface text-text-primary hover:bg-bg shadow-sm',
  };
  
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
    icon: 'p-2',
  };

  const classes = `${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
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
