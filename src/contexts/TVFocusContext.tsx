/**
 * TVFocusContext
 * Provides context for managing TV remote navigation focus across the app
 * Ensures only actionable/clickable elements receive focus
 */

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { Platform, findNodeHandle } from 'react-native';
import { isTV } from '../utils/tvPlatform';

export type FocusZone = 
  | 'header'        // Back button, settings icons
  | 'hero-actions'  // Play, Save, Collection buttons
  | 'cast'          // Cast member items
  | 'episodes'      // Episode list for series
  | 'seasons'       // Season tabs
  | 'similar'       // Similar/recommended content
  | 'trailers'      // Trailer thumbnails
  | 'comments'      // Comment items
  | 'catalogs'      // Home screen catalogs
  | 'tabs'          // Bottom tab navigation
  | 'settings'      // Settings menu items
  | 'search'        // Search results
  | 'streams';      // Stream selection

interface FocusableItem {
  id: string;
  zone: FocusZone;
  ref: React.RefObject<any>;
  order: number;
}

interface TVFocusContextType {
  // Current focus state
  currentZone: FocusZone | null;
  focusedItemId: string | null;
  
  // Zone management
  setCurrentZone: (zone: FocusZone) => void;
  registerFocusable: (item: FocusableItem) => void;
  unregisterFocusable: (id: string) => void;
  
  // Navigation helpers
  focusFirstInZone: (zone: FocusZone) => void;
  focusNextZone: () => void;
  focusPreviousZone: () => void;
  
  // Item focus
  setFocusedItem: (id: string | null) => void;
  getFocusableItems: (zone: FocusZone) => FocusableItem[];
  
  // TV detection
  isTV: boolean;
}

const TVFocusContext = createContext<TVFocusContextType | undefined>(undefined);

// Define the order of focus zones for vertical navigation
const ZONE_ORDER: FocusZone[] = [
  'header',
  'hero-actions',
  'seasons',
  'episodes',
  'cast',
  'trailers',
  'similar',
  'comments',
  'catalogs',
  'tabs',
];

interface TVFocusProviderProps {
  children: ReactNode;
}

export const TVFocusProvider: React.FC<TVFocusProviderProps> = ({ children }) => {
  const [currentZone, setCurrentZone] = useState<FocusZone | null>(null);
  const [focusedItemId, setFocusedItem] = useState<string | null>(null);
  const focusableItems = useRef<Map<string, FocusableItem>>(new Map());

  const registerFocusable = useCallback((item: FocusableItem) => {
    focusableItems.current.set(item.id, item);
  }, []);

  const unregisterFocusable = useCallback((id: string) => {
    focusableItems.current.delete(id);
  }, []);

  const getFocusableItems = useCallback((zone: FocusZone): FocusableItem[] => {
    const items: FocusableItem[] = [];
    focusableItems.current.forEach((item) => {
      if (item.zone === zone) {
        items.push(item);
      }
    });
    return items.sort((a, b) => a.order - b.order);
  }, []);

  const focusFirstInZone = useCallback((zone: FocusZone) => {
    const items = getFocusableItems(zone);
    if (items.length > 0) {
      const firstItem = items[0];
      setCurrentZone(zone);
      setFocusedItem(firstItem.id);
      
      // Attempt to focus the native element
      if (firstItem.ref.current && Platform.OS === 'android') {
        const handle = findNodeHandle(firstItem.ref.current);
        if (handle) {
          // Request focus through native methods
          firstItem.ref.current.focus?.();
        }
      }
    }
  }, [getFocusableItems]);

  const focusNextZone = useCallback(() => {
    if (!currentZone) {
      focusFirstInZone(ZONE_ORDER[0]);
      return;
    }

    const currentIndex = ZONE_ORDER.indexOf(currentZone);
    if (currentIndex === -1 || currentIndex >= ZONE_ORDER.length - 1) {
      return;
    }

    // Find next zone that has focusable items
    for (let i = currentIndex + 1; i < ZONE_ORDER.length; i++) {
      const nextZone = ZONE_ORDER[i];
      const items = getFocusableItems(nextZone);
      if (items.length > 0) {
        focusFirstInZone(nextZone);
        return;
      }
    }
  }, [currentZone, getFocusableItems, focusFirstInZone]);

  const focusPreviousZone = useCallback(() => {
    if (!currentZone) {
      return;
    }

    const currentIndex = ZONE_ORDER.indexOf(currentZone);
    if (currentIndex <= 0) {
      return;
    }

    // Find previous zone that has focusable items
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevZone = ZONE_ORDER[i];
      const items = getFocusableItems(prevZone);
      if (items.length > 0) {
        focusFirstInZone(prevZone);
        return;
      }
    }
  }, [currentZone, getFocusableItems, focusFirstInZone]);

  const value: TVFocusContextType = {
    currentZone,
    focusedItemId,
    setCurrentZone,
    registerFocusable,
    unregisterFocusable,
    focusFirstInZone,
    focusNextZone,
    focusPreviousZone,
    setFocusedItem,
    getFocusableItems,
    isTV,
  };

  return (
    <TVFocusContext.Provider value={value}>
      {children}
    </TVFocusContext.Provider>
  );
};

export const useTVFocus = (): TVFocusContextType => {
  const context = useContext(TVFocusContext);
  if (!context) {
    // Return a no-op context for non-TV or when not wrapped in provider
    return {
      currentZone: null,
      focusedItemId: null,
      setCurrentZone: () => {},
      registerFocusable: () => {},
      unregisterFocusable: () => {},
      focusFirstInZone: () => {},
      focusNextZone: () => {},
      focusPreviousZone: () => {},
      setFocusedItem: () => {},
      getFocusableItems: () => [],
      isTV: false,
    };
  }
  return context;
};

export default TVFocusContext;
