
import React, { memo } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'hoverable';
  noPadding?: boolean;
}

export const Card = memo<CardProps>(({ 
  children, 
  className = '', 
  variant = 'default',
  noPadding = false,
  ...props 
}) => {
  const baseClasses = "rounded-2xl border transition-all duration-300";
  
  const variants = {
    default: "glass-panel border-slate-700/50 bg-slate-900/50",
    flat: "bg-slate-900 border-slate-800",
    hoverable: "glass-panel border-slate-700/50 bg-slate-900/50 hover:border-indigo-500/30 group relative"
  };

  const paddingClass = noPadding ? '' : 'p-4 md:p-6';

  return (
    <div className={`${baseClasses} ${variants[variant]} ${paddingClass} ${className}`} {...props}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';
