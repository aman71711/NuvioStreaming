/**
 * useTVNavigation Hook
 * Handles TV remote navigation events and D-pad input
 */

import { useEffect, useCallback, useRef } from 'react';
import { Platform, TVEventHandler, BackHandler } from 'react-native';
import { isTV } from '../utils/tvPlatform';

export type TVEventType = 
  | 'up' 
  | 'down' 
  | 'left' 
  | 'right' 
  | 'select' 
  | 'playPause' 
  | 'play' 
  | 'pause'
  | 'rewind'
  | 'fastForward'
  | 'menu'
  | 'back'
  | 'longSelect';

export interface TVNavigationHandlers {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onSelect?: () => void;
  onBack?: () => boolean; // Return true to prevent default back behavior
  onPlayPause?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onRewind?: () => void;
  onFastForward?: () => void;
  onMenu?: () => void;
  onLongSelect?: () => void;
}

/**
 * Hook for handling TV remote navigation events
 * @param handlers Object containing handler functions for each TV event
 * @param enabled Whether the handlers should be active (default: true)
 */
export const useTVNavigation = (
  handlers: TVNavigationHandlers,
  enabled: boolean = true
) => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!isTV || !enabled) return;

    let tvEventHandler: TVEventHandler | null = null;

    // Create TV event handler
    const enableTVEventHandler = () => {
      tvEventHandler = new TVEventHandler();
      tvEventHandler.enable(undefined, (cmp: any, evt: { eventType?: string }) => {
        if (!evt || !evt.eventType) return;

        const eventType = evt.eventType as string;

        switch (eventType) {
          case 'up':
            handlersRef.current.onUp?.();
            break;
          case 'down':
            handlersRef.current.onDown?.();
            break;
          case 'left':
            handlersRef.current.onLeft?.();
            break;
          case 'right':
            handlersRef.current.onRight?.();
            break;
          case 'select':
            handlersRef.current.onSelect?.();
            break;
          case 'playPause':
            handlersRef.current.onPlayPause?.();
            break;
          case 'play':
            handlersRef.current.onPlay?.();
            break;
          case 'pause':
            handlersRef.current.onPause?.();
            break;
          case 'rewind':
            handlersRef.current.onRewind?.();
            break;
          case 'fastForward':
            handlersRef.current.onFastForward?.();
            break;
          case 'menu':
            handlersRef.current.onMenu?.();
            break;
          case 'longSelect':
            handlersRef.current.onLongSelect?.();
            break;
        }
      });
    };

    enableTVEventHandler();

    // Handle back button for TV
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (handlersRef.current.onBack) {
        return handlersRef.current.onBack();
      }
      return false;
    });

    return () => {
      if (tvEventHandler) {
        tvEventHandler.disable();
      }
      backHandler.remove();
    };
  }, [enabled]);
};

/**
 * Hook for handling TV focus events on a component
 */
export const useTVFocus = (
  onFocusChange?: (isFocused: boolean) => void
) => {
  const handleFocus = useCallback(() => {
    onFocusChange?.(true);
  }, [onFocusChange]);

  const handleBlur = useCallback(() => {
    onFocusChange?.(false);
  }, [onFocusChange]);

  return {
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
};

export default useTVNavigation;
