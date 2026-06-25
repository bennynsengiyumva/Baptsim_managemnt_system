import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authStore';
import { useWebSocketNotifications } from '@/hooks/useNotifications';
import NotificationPopup from '@/components/notifications/NotificationPopup';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  const currentUser = useSelector(selectUser);
  const { popup, dismissPopup } = useWebSocketNotifications(currentUser?.email || null);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
      {popup && (
        <NotificationPopup
          title={popup.title}
          message={popup.message}
          onDismiss={dismissPopup}
        />
      )}
    </div>
  );
}
