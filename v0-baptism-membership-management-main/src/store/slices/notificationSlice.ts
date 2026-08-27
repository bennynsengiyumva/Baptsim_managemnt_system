import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'createdAt'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      state.notifications.push(notification);
      if (!notification.read) state.unreadCount++;
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n && !n.read) state.unreadCount = Math.max(0, state.unreadCount - 1);
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, removeNotification, markAsRead, setUnreadCount, setNotifications, clearAllNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;

export const selectNotifications = (state: any) => state.notification.notifications;
export const selectUnreadCount = (state: any) => state.notification.unreadCount;
