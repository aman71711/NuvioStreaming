import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface TrailerContextValue {
  isTrailerPlaying: boolean;
  pauseTrailer: () => void;
  resumeTrailer: () => void;
  setTrailerPlaying: (playing: boolean) => void;
}

const TrailerContext = createContext<TrailerContextValue | undefined>(undefined);

export const TrailerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(true);

  const pauseTrailer = useCallback(() => {
    setIsTrailerPlaying(false);
  }, []);

  const resumeTrailer = useCallback(() => {
    setIsTrailerPlaying(true);
  }, []);

  const setTrailerPlaying = useCallback((playing: boolean) => {
    setIsTrailerPlaying(playing);
  }, []);

  const value: TrailerContextValue = useMemo(() => ({
    isTrailerPlaying,
    pauseTrailer,
    resumeTrailer,
    setTrailerPlaying,
  }), [isTrailerPlaying, pauseTrailer, resumeTrailer, setTrailerPlaying]);

  return (
    <TrailerContext.Provider value={value}>
      {children}
    </TrailerContext.Provider>
  );
};

// Default values for when context is used outside provider
const defaultTrailerContext: TrailerContextValue = {
  isTrailerPlaying: false,
  pauseTrailer: () => {},
  resumeTrailer: () => {},
  setTrailerPlaying: () => {},
};

export const useTrailer = (): TrailerContextValue => {
  const context = useContext(TrailerContext);
  if (!context) {
    console.warn('useTrailer used outside TrailerProvider, returning defaults');
    return defaultTrailerContext;
  }
  return context;
};
