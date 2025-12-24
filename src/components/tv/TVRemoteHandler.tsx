/**
 * TVRemoteHandler Component
 * Global TV remote event handler that sits at the root of the app
 * Handles D-pad navigation, media keys, and back button for Android TV
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Platform, TVEventHandler, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface TVRemoteHandlerProps {
  children: React.ReactNode;
  onBackPress?: () => boolean;
}

const TVRemoteHandler: React.FC<TVRemoteHandlerProps> = ({ children, onBackPress }) => {
  const navigation = useNavigation();
  const tvEventHandlerRef = useRef<TVEventHandler | null>(null);

  // Check if we can go back in the navigation stack
  const canGoBack = useCallback(() => {
    return navigation.canGoBack();
  }, [navigation]);

  // Handle back button press
  const handleBackPress = useCallback(() => {
    // First check if parent wants to handle it
    if (onBackPress && onBackPress()) {
      return true;
    }

    // If we can navigate back, do so
    if (canGoBack()) {
      navigation.goBack();
      return true;
    }

    // Otherwise, let the system handle it (exit app)
    return false;
  }, [canGoBack, navigation, onBackPress]);

  useEffect(() => {
    if (!Platform.isTV) return;

    // Set up TV event handler
    const enableTVEventHandler = () => {
      tvEventHandlerRef.current = new TVEventHandler();
      tvEventHandlerRef.current.enable(undefined, (cmp: any, evt: { eventType?: string; eventKeyAction?: number }) => {
        if (!evt || !evt.eventType) return;

        // Only respond to key up events to prevent double-firing
        if (evt.eventKeyAction !== undefined && evt.eventKeyAction !== 1) return;

        const eventType = evt.eventType;

        // Handle specific remote events at app level
        switch (eventType) {
          case 'menu':
            // Menu button could open settings or a menu overlay
            // For now, treat it like back
            handleBackPress();
            break;
          
          // Media control keys - these are typically handled by the player
          // but we can add global handlers here if needed
          case 'playPause':
          case 'play':
          case 'pause':
          case 'rewind':
          case 'fastForward':
            // Let these bubble up to the active component
            break;
        }
      });
    };

    enableTVEventHandler();

    // Handle hardware back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      if (tvEventHandlerRef.current) {
        tvEventHandlerRef.current.disable();
        tvEventHandlerRef.current = null;
      }
      backHandler.remove();
    };
  }, [handleBackPress]);

  return <>{children}</>;
};

export default TVRemoteHandler;
