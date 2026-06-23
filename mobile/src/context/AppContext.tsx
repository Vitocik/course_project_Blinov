import React, { createContext, useContext } from 'react';

export type AppContextValue = {
  apiUrl: string;
  accessToken: string | null;
  currentUserLabel: string;
  currentUserRole: string;
  isDemoMode: boolean;
  apiStatus: string;
  themeMode: 'dark' | 'light';
  setApiUrl: (value: string) => void;
  onLogout: () => void;
  onToggleTheme: () => void;
  onPing: () => Promise<void> | void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ value, children }: { value: AppContextValue; children: React.ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
