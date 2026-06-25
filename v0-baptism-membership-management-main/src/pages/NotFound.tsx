import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 p-4">
      <div className="text-center">
        <AlertTriangle className="mx-auto mb-4 text-white" size={64} />
        <h1 className="text-5xl font-bold text-white mb-2">404</h1>
        <p className="text-xl text-blue-100 mb-8">Page not found</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          <Home size={20} />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
