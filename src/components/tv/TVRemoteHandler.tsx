/**
 * TVRemoteHandler Component
 * Global TV remote event handler that sits at the root of the app
 * Handles D-pad navigation, media keys, and back button for Android TV
 */

import React, { useEffect, useCallback } from 'react';
import { Platform, BackHandler, DeviceEventEmitter } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface TVEvent {
  eventType: string;
  eventKeyAction?: number;
  tag?: number;
}

interface TVRemoteHandlerProps {
  children: React.ReactNode;
  onBackPress?: () => boolean;
}

const TVRemoteHandler: React.FC<TVRemoteHandlerProps> = ({ children, onBackPress }) => {
  const navigation = useNavigation();

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

    // Listen for TV remote events via DeviceEventEmitter
    const tvEventSubscription = DeviceEventEmitter.addListener(
      'onTVRemoteKey',
      (evt: TVEvent) => {
        if (!evt || !evt.eventType) return;

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
      }
    );

    return () => {
      tvEventSubscription.remove();
    };
  }, [handleBackPress]);

  useEffect(() => {
    if (!Platform.isTV) return;

    // Handle hardware back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      backHandler.remove();
    };
  }, [handleBackPress]);

  return <>{children}</>;
};

export default TVRemoteHandler;

export { TVRemoteHandler };
