import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextValue {
  isHomeLoading: boolean;
  setHomeLoading: (loading: boolean) => void;
}

const defaultValue: LoadingContextValue = {
  isHomeLoading: true,
  setHomeLoading: () => {},
};

const LoadingContext = createContext<LoadingContextValue>(defaultValue);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isHomeLoading, setIsHomeLoading] = useState(true);

  const value: LoadingContextValue = {
    isHomeLoading,
    setHomeLoading: setIsHomeLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextValue => {
  const context = useContext(LoadingContext);
  // Return default value instead of throwing - prevents crashes
  if (!context) {
    console.warn('useLoading used outside LoadingProvider, using defaults');
    return defaultValue;
  }
  return context;
};
