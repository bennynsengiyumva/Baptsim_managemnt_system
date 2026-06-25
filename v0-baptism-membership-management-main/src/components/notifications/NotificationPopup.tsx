import { useEffect } from 'react';
import { Bell, X } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  onDismiss: () => void;
}

export default function NotificationPopup({ title, message, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-white rounded-xl shadow-2xl border border-blue-200 p-4 max-w-sm w-full">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900">{title}</p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message}</p>
          </div>
          <button onClick={onDismiss} className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
