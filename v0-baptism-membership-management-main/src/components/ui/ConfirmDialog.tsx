import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen, title, message, confirmLabel, cancelLabel, variant = 'danger',
  onConfirm, onCancel, loading = false
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const colors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    info: 'bg-indigo-600 hover:bg-indigo-700',
  };

  const iconColors = {
    danger: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    warning: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    info: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconColors[variant]}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel || t('common.cancel')}
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${colors[variant]}`}
          >
            {loading ? t('common.loading') : confirmLabel || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
