
import React, { memo } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const baseClasses = "w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 md:p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 text-sm leading-relaxed";

export const Input = memo<InputProps>(({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">{label}</label>}
    <input className={`${baseClasses} ${error ? 'border-red-500/50 focus:ring-red-500' : ''} ${className}`} {...props} />
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
));

Input.displayName = 'Input';

export const Textarea = memo<TextareaProps>(({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">{label}</label>}
    <textarea className={`${baseClasses} resize-none ${error ? 'border-red-500/50 focus:ring-red-500' : ''} ${className}`} {...props} />
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
));

Textarea.displayName = 'Textarea';
