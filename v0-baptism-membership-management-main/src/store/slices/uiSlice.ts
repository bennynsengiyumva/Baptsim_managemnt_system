import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  language: 'en' | 'rw' | 'fr';
  selectedModule: string | null;
}

const initialState: UIState = {
  sidebarOpen: true,
  darkMode: localStorage.getItem('darkMode') === 'true',
  language: (localStorage.getItem('language') as 'en' | 'rw' | 'fr') || 'en',
  selectedModule: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', String(state.darkMode));
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', String(state.darkMode));
    },
    setLanguage: (state, action: PayloadAction<'en' | 'rw' | 'fr'>) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    setSelectedModule: (state, action: PayloadAction<string | null>) => {
      state.selectedModule = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setDarkMode,
  setLanguage,
  setSelectedModule,
} = uiSlice.actions;

export default uiSlice.reducer;

export const selectSidebarOpen = (state: any) => state.ui.sidebarOpen;
export const selectDarkMode = (state: any) => state.ui.darkMode;
export const selectLanguage = (state: any) => state.ui.language;
export const selectSelectedModule = (state: any) => state.ui.selectedModule;
