/**
 * TVTouchable Component
 * A drop-in replacement for TouchableOpacity that properly handles TV focus
 * Use this for all actionable/clickable elements on screens that need TV support
 * 
 * Features:
 * - Automatic TV focus handling
 * - Visual focus indicator (border + scale)
 * - Proper accessibility labels
 * - Works seamlessly on mobile (no visual changes)
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Animated,
  StyleSheet,
  ViewStyle,
  Platform,
  findNodeHandle,
  View,
} from 'react-native';
import { isTV, tvDimensions } from '../../utils/tvPlatform';
import { useTVFocus, FocusZone } from '../../contexts/TVFocusContext';

export interface TVTouchableProps extends TouchableOpacityProps {
  /** Unique identifier for this focusable item */
  tvId?: string;
  /** Which zone this item belongs to for zone-based navigation */
  tvZone?: FocusZone;
  /** Order within the zone (lower = first focus) */
  tvOrder?: number;
  /** Whether this should receive initial focus */
  tvInitialFocus?: boolean;
  /** Custom focus border color */
  tvFocusColor?: string;
  /** Scale when focused (default: 1.05) */
  tvFocusScale?: number;
  /** Callback when focused */
  onTVFocus?: () => void;
  /** Callback when blurred */
  onTVBlur?: () => void;
  /** Disable TV focus for this element */
  tvDisabled?: boolean;
}

const TVTouchable: React.FC<TVTouchableProps> = ({
  children,
  style,
  tvId,
  tvZone,
  tvOrder = 0,
  tvInitialFocus = false,
  tvFocusColor = '#4A90D9',
  tvFocusScale = 1.05,
  onTVFocus,
  onTVBlur,
  tvDisabled = false,
  onPress,
  onLongPress,
  accessibilityLabel,
  ...props
}) => {
  const touchableRef = useRef<View>(null);
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  
  const { registerFocusable, unregisterFocusable, setFocusedItem, setCurrentZone } = useTVFocus();

  // Register this item for TV focus management
  useEffect(() => {
    if (isTV && tvId && tvZone && !tvDisabled) {
      registerFocusable({
        id: tvId,
        zone: tvZone,
        ref: touchableRef,
        order: tvOrder,
      });

      return () => {
        unregisterFocusable(tvId);
      };
    }
  }, [tvId, tvZone, tvOrder, tvDisabled, registerFocusable, unregisterFocusable]);

  // Handle focus animation
  const animateFocus = useCallback((focused: boolean) => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? tvFocusScale : 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(borderAnim, {
        toValue: focused ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  }, [scaleAnim, borderAnim, tvFocusScale]);

  // Handle focus event
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    animateFocus(true);
    
    if (tvZone) {
      setCurrentZone(tvZone);
    }
    if (tvId) {
      setFocusedItem(tvId);
    }
    
    onTVFocus?.();
  }, [animateFocus, tvZone, tvId, setCurrentZone, setFocusedItem, onTVFocus]);

  // Handle blur event
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    animateFocus(false);
    onTVBlur?.();
  }, [animateFocus, onTVBlur]);

  // Compute border color animation
  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', tvFocusColor],
  });

  // TV-specific styles
  const tvStyles: ViewStyle = isTV && !tvDisabled ? {
    // These are applied via animated styles
  } : {};

  // Don't add any TV styling if disabled or not on TV
  if (!isTV || tvDisabled) {
    return (
      <TouchableOpacity
        ref={touchableRef}
        style={style}
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityLabel={accessibilityLabel}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ scale: scaleAnim }],
          borderColor: animatedBorderColor,
          borderWidth: isFocused ? tvDimensions.focusRingWidth : 0,
          borderRadius: tvDimensions.focusRingRadius,
        },
      ]}
    >
      <TouchableOpacity
        ref={touchableRef}
        style={[style, tvStyles]}
        onPress={onPress}
        onLongPress={onLongPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        hasTVPreferredFocus={tvInitialFocus}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    // Wrapper for animation
  },
});

export default TVTouchable;
