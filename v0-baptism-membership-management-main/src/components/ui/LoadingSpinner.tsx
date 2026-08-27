import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
  fullPage?: boolean;
  className?: string;
}

export default function LoadingSpinner({ size = 24, text, fullPage = false, className = '' }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const displayText = text || t('common.loading');

  if (fullPage) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
        <Loader2 size={size} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        {displayText && (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{displayText}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 size={size} className="animate-spin text-indigo-600 dark:text-indigo-400" />
      {displayText && (
        <span className="text-sm text-slate-500 dark:text-slate-400">{displayText}</span>
      )}
    </div>
  );
}
