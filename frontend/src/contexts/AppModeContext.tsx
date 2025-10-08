import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AppMode = 'simple' | 'advanced';

interface AppModeContextType {
  mode: AppMode;
  isSimpleMode: boolean;
  isAdvancedMode: boolean;
  toggleMode: () => void;
  setMode: (mode: AppMode) => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

const APP_MODE_KEY = 'inventory_app_mode';

export const AppModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load mode from localStorage or default to 'simple'
  const [mode, setModeState] = useState<AppMode>(() => {
    const saved = localStorage.getItem(APP_MODE_KEY);
    return (saved === 'simple' || saved === 'advanced') ? saved : 'simple';
  });

  // Save mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(APP_MODE_KEY, mode);
  }, [mode]);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState(prev => prev === 'simple' ? 'advanced' : 'simple');
  };

  const value: AppModeContextType = {
    mode,
    isSimpleMode: mode === 'simple',
    isAdvancedMode: mode === 'advanced',
    toggleMode,
    setMode,
  };

  return (
    <AppModeContext.Provider value={value}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = (): AppModeContextType => {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within AppModeProvider');
  }
  return context;
};
