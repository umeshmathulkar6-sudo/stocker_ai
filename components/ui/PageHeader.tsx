
import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6 md:mb-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm md:text-base text-slate-400 max-w-2xl">{description}</p>
      </div>
      {action && (
        <div className="flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
};
