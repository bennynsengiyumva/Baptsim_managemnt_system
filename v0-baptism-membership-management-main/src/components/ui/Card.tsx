import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export default function Card({ children, className = '', title, icon, onClick }: CardProps) {
  return (
    <div onClick={onClick} className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-4">
          {icon && <div className="text-2xl">{icon}</div>}
          {title && <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
}
