import { configureStore } from '@reduxjs/toolkit';

import authReducer from './authStore';
import candidateReducer from './slices/candidateSlice';
import baptismReducer from './slices/baptismSlice';
import instructorReducer from './slices/instructorSlice';
import churchReducer from './slices/churchSlice';
import certificateReducer from './slices/certificateSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';
import dashboardReducer from './slices/dashboardSlice';
import lessonReducer from './slices/lessonSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    candidate: candidateReducer,
    baptism: baptismReducer,
    instructor: instructorReducer,
    church: churchReducer,
    certificate: certificateReducer,
    notification: notificationReducer,
    ui: uiReducer,
    dashboard: dashboardReducer,
    lessons: lessonReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
