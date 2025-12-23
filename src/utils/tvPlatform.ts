/**
 * TV Platform Utilities
 * Provides detection and utilities for Android TV support
 */

import { Platform, Dimensions, TVEventHandler } from 'react-native';

// Detect if running on Android TV
// Android TV devices typically have larger screens and no touch screen requirement
const { width, height } = Dimensions.get('window');

/**
 * Check if the current device is an Android TV
 * React Native 0.81+ has built-in TV support via Platform.isTV
 */
export const isTV = Platform.isTV || false;

/**
 * Check if running on Android (TV or mobile)
 */
export const isAndroid = Platform.OS === 'android';

/**
 * Check if running on Android TV specifically
 */
export const isAndroidTV = isAndroid && isTV;

/**
 * Get the device form factor
 */
export type DeviceFormFactor = 'phone' | 'tablet' | 'tv';

export const getDeviceFormFactor = (): DeviceFormFactor => {
  if (isTV) return 'tv';
  
  const screenWidth = Math.max(width, height);
  if (screenWidth >= 768) return 'tablet';
  return 'phone';
};

/**
 * TV-specific dimension calculations
 */
export const tvDimensions = {
  // Poster sizes optimized for TV viewing distance
  posterWidth: isTV ? 200 : 120,
  posterHeight: isTV ? 300 : 180,
  
  // Spacing for TV (larger for better visibility)
  horizontalSpacing: isTV ? 24 : 12,
  verticalSpacing: isTV ? 32 : 16,
  
  // Focus ring dimensions
  focusRingWidth: isTV ? 4 : 2,
  focusRingRadius: isTV ? 12 : 8,
  
  // Font sizes for TV
  titleFontSize: isTV ? 28 : 18,
  subtitleFontSize: isTV ? 20 : 14,
  bodyFontSize: isTV ? 18 : 12,
  
  // Navigation bar height
  navBarHeight: isTV ? 80 : 60,
  
  // Safe area padding for TV overscan
  tvSafeAreaPadding: isTV ? 48 : 0,
};

/**
 * TV Key codes for remote navigation
 */
export const TVKeyCodes = {
  DPAD_UP: 'up',
  DPAD_DOWN: 'down',
  DPAD_LEFT: 'left',
  DPAD_RIGHT: 'right',
  DPAD_CENTER: 'select',
  ENTER: 'select',
  BACK: 'back',
  PLAY_PAUSE: 'playPause',
  PLAY: 'play',
  PAUSE: 'pause',
  FAST_FORWARD: 'fastForward',
  REWIND: 'rewind',
  MENU: 'menu',
} as const;

/**
 * Helper to get focus-related styles for TV
 */
export const getTVFocusStyle = (isFocused: boolean) => {
  if (!isTV) return {};
  
  return {
    transform: [{ scale: isFocused ? 1.1 : 1 }],
    borderWidth: isFocused ? tvDimensions.focusRingWidth : 0,
    borderColor: isFocused ? '#4A90D9' : 'transparent',
    borderRadius: tvDimensions.focusRingRadius,
    shadowColor: isFocused ? '#4A90D9' : 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: isFocused ? 0.8 : 0,
    shadowRadius: isFocused ? 15 : 0,
    elevation: isFocused ? 10 : 0,
  };
};

/**
 * Props to enable TV focus on a component
 */
export const tvFocusableProps = {
  // Enable focus for TV navigation
  focusable: isTV,
  hasTVPreferredFocus: false,
  // Accessibility
  accessible: true,
  accessibilityRole: 'button' as const,
};

/**
 * Get initial focus props (for first focusable element)
 */
export const getTVInitialFocusProps = (shouldHaveFocus: boolean = false) => ({
  ...tvFocusableProps,
  hasTVPreferredFocus: isTV && shouldHaveFocus,
});

export default {
  isTV,
  isAndroid,
  isAndroidTV,
  getDeviceFormFactor,
  tvDimensions,
  TVKeyCodes,
  getTVFocusStyle,
  tvFocusableProps,
  getTVInitialFocusProps,
};
