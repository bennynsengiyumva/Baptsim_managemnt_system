import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  title,
  children,
  onClose,
  actionLabel,
  onAction,
  isLoading,
  size = 'md',
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {actionLabel && (
          <div className="flex gap-4 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={onAction}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ Fix: added default export so both import styles work
export default Modal;