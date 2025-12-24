/**
 * TVFocusWrapper Component
 * A wrapper component that provides TV remote focus handling with visual feedback
 * Works on both TV and mobile devices (no-op on mobile)
 */

import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
  Platform,
  TouchableOpacityProps,
  ViewStyle,
  findNodeHandle,
  AccessibilityInfo,
} from 'react-native';
import { isTV, tvDimensions, getTVFocusStyle } from '../../utils/tvPlatform';
import { useTVFocus } from '../../hooks/useTVNavigation';

export interface TVFocusWrapperProps extends Omit<TouchableOpacityProps, 'style'> {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  focusedStyle?: ViewStyle;
  onPress?: () => void;
  onLongPress?: () => void;
  onFocusChange?: (isFocused: boolean) => void;
  hasTVPreferredFocus?: boolean;
  nextFocusUp?: number;
  nextFocusDown?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
  disabled?: boolean;
  focusScale?: number;
  focusAnimationDuration?: number;
  showFocusRing?: boolean;
  focusRingColor?: string;
  testID?: string;
}

export interface TVFocusWrapperRef {
  focus: () => void;
  blur: () => void;
  getNodeHandle: () => number | null;
}

const TVFocusWrapper = forwardRef<TVFocusWrapperRef, TVFocusWrapperProps>(({
  children,
  style,
  focusedStyle,
  onPress,
  onLongPress,
  onFocusChange,
  hasTVPreferredFocus = false,
  nextFocusUp,
  nextFocusDown,
  nextFocusLeft,
  nextFocusRight,
  disabled = false,
  focusScale = 1.08,
  focusAnimationDuration = 150,
  showFocusRing = true,
  focusRingColor = '#4A90D9',
  testID,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const touchableRef = useRef<View>(null);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (touchableRef.current && Platform.OS === 'android') {
        const handle = findNodeHandle(touchableRef.current);
        if (handle) {
          // Request focus on the native component
          AccessibilityInfo.setAccessibilityFocus(handle);
        }
      }
    },
    blur: () => {
      setIsFocused(false);
    },
    getNodeHandle: () => {
      return touchableRef.current ? findNodeHandle(touchableRef.current) : null;
    },
  }));

  const handleFocusChange = useCallback((focused: boolean) => {
    setIsFocused(focused);
    onFocusChange?.(focused);

    // Animate scale for TV
    if (isTV) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: focused ? focusScale : 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: focused ? 1 : 0.9,
          duration: focusAnimationDuration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [onFocusChange, scaleAnim, opacityAnim, focusScale, focusAnimationDuration]);

  const { onFocus, onBlur } = useTVFocus(handleFocusChange);

  const focusStyles: ViewStyle = isFocused && showFocusRing ? {
    borderWidth: tvDimensions.focusRingWidth,
    borderColor: focusRingColor,
    borderRadius: tvDimensions.focusRingRadius,
    shadowColor: focusRingColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  } : {};

  // TV-specific props
  const tvProps = isTV ? {
    hasTVPreferredFocus,
    nextFocusUp,
    nextFocusDown,
    nextFocusLeft,
    nextFocusRight,
    accessible: true,
    accessibilityRole: 'button' as const,
  } : {};

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        ref={touchableRef}
        style={[
          styles.touchable,
          style,
          focusStyles,
          isFocused && focusedStyle,
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        activeOpacity={isTV ? 1 : 0.7}
        testID={testID}
        {...tvProps}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    // Container for animation
  },
  touchable: {
    // Base touchable styles
  },
});

TVFocusWrapper.displayName = 'TVFocusWrapper';

export default TVFocusWrapper;
