/**
 * withTVFocus HOC
 * Higher-order component that adds TV focus support to any component
 * Provides visual focus feedback and proper accessibility props
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { isTV, tvDimensions } from '../../utils/tvPlatform';

export interface TVFocusConfig {
  focusScale?: number;
  focusBorderColor?: string;
  focusBorderWidth?: number;
  focusShadowColor?: string;
  focusShadowRadius?: number;
  animationDuration?: number;
}

const defaultConfig: TVFocusConfig = {
  focusScale: 1.08,
  focusBorderColor: '#4A90D9',
  focusBorderWidth: 3,
  focusShadowColor: '#4A90D9',
  focusShadowRadius: 12,
  animationDuration: 150,
};

export interface WithTVFocusProps extends TouchableOpacityProps {
  hasTVPreferredFocus?: boolean;
  tvFocusConfig?: TVFocusConfig;
  onTVFocusChange?: (isFocused: boolean) => void;
  focusedStyle?: ViewStyle;
  style?: ViewStyle | ViewStyle[];
}

/**
 * HOC that wraps a component with TV focus capabilities
 */
export function withTVFocus<P extends { style?: ViewStyle | ViewStyle[] }>(
  WrappedComponent: React.ComponentType<P>
): React.FC<Omit<P, 'style'> & WithTVFocusProps> {
  return function TVFocusEnhancedComponent(props: Omit<P, 'style'> & WithTVFocusProps) {
    const {
      hasTVPreferredFocus = false,
      tvFocusConfig = {},
      onTVFocusChange,
      focusedStyle,
      style,
      ...restProps
    } = props;

    const [isFocused, setIsFocused] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const config = { ...defaultConfig, ...tvFocusConfig };

    const handleFocus = useCallback(() => {
      setIsFocused(true);
      onTVFocusChange?.(true);

      if (isTV) {
        Animated.spring(scaleAnim, {
          toValue: config.focusScale!,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }).start();
      }
    }, [onTVFocusChange, scaleAnim, config.focusScale]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      onTVFocusChange?.(false);

      if (isTV) {
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }).start();
      }
    }, [onTVFocusChange, scaleAnim]);

    const focusStyle: ViewStyle = isFocused && isTV ? {
      borderWidth: config.focusBorderWidth,
      borderColor: config.focusBorderColor,
      shadowColor: config.focusShadowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: config.focusShadowRadius,
      elevation: 10,
    } : {};

    const tvProps = isTV ? {
      hasTVPreferredFocus,
      accessible: true,
      accessibilityRole: 'button' as const,
    } : {};

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <WrappedComponent
          {...(restProps as P)}
          style={[style, focusStyle, isFocused && focusedStyle]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          activeOpacity={isTV ? 1 : 0.7}
          {...tvProps}
        />
      </Animated.View>
    );
  };
}

/**
 * Pre-configured TV-focusable TouchableOpacity
 */
export const TVTouchableOpacity = withTVFocus(TouchableOpacity);

export default withTVFocus;
