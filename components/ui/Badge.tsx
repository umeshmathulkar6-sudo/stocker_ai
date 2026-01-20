
import React, { memo } from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'photo' | 'vector' | 'illustration';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge = memo<BadgeProps>(({ 
  children, 
  variant = 'default', 
  className = '',
  size = 'md'
}) => {
  const variants = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/10",
    error: "bg-red-500/10 text-red-400 border-red-500/10",
    info: "bg-indigo-500/10 text-indigo-400 border-indigo-500/10",
    // Categories
    photo: "bg-blue-500/10 text-blue-400 border-blue-500/10",
    vector: "bg-purple-500/10 text-purple-400 border-purple-500/10",
    illustration: "bg-pink-500/10 text-pink-400 border-pink-500/10",
  };

  const sizes = {
    sm: "text-[9px] px-1.5 py-0.5",
    md: "text-[10px] px-2.5 py-1",
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-bold uppercase tracking-wider border ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
