import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
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
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, removeNotification, markAsRead, clearAllNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;

export const selectNotifications = (state: any) => state.notification.notifications;
export const selectUnreadCount = (state: any) =>
  state.notification.notifications.filter((n: Notification) => !n.read).length;
