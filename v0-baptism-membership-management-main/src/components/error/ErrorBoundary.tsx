import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-2">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <p className="text-sm text-gray-400 mb-6">Check the console for more details</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <RefreshCw size={18} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
