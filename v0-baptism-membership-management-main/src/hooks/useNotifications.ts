import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { notificationService } from '@/services/notificationService';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8081/ws';

export function useWebSocketNotifications(userEmail: string | null) {
  const [popup, setPopup] = useState<{ title: string; message: string } | null>(null);
  const clientRef = useRef<Client | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userEmail) return;

    const token = localStorage.getItem('authToken');

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: token ? { Authorization: 'Bearer ' + token } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/queue/user/' + userEmail, (msg) => {
          try {
            const data = JSON.parse(msg.body);
            setPopup({ title: data.title, message: data.message });
          } catch {}
        });
      },
      onStompError: () => {},
    });

    client.activate();
    clientRef.current = client;

    intervalRef.current = setInterval(() => {
      notificationService.getUnreadCount().catch(() => {});
    }, 30000);

    return () => {
      client.deactivate();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userEmail]);

  const dismissPopup = useCallback(() => setPopup(null), []);

  return { popup, dismissPopup };
}
