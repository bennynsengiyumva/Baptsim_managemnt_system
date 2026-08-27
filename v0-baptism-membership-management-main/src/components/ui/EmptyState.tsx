import { useTranslation } from 'react-i18next';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, message, action, className = '' }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        {icon || <Inbox size={32} className="text-slate-300 dark:text-slate-600" />}
      </div>
      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
        {title || t('common.noData')}
      </h3>
      {message && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
