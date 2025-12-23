/**
 * TVScrollView Component
 * A ScrollView optimized for TV navigation with D-pad support
 */

import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Dimensions,
} from 'react-native';
import { isTV, tvDimensions } from '../../utils/tvPlatform';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface TVScrollViewProps extends ScrollViewProps {
  /** Amount to scroll when using D-pad (percentage of viewport) */
  scrollStep?: number;
  /** Enable snapping to items */
  snapEnabled?: boolean;
  /** Item width for snap calculation (horizontal scroll) */
  snapItemWidth?: number;
  /** Item height for snap calculation (vertical scroll) */
  snapItemHeight?: number;
  /** Callback when scroll reaches start */
  onScrollStart?: () => void;
  /** Callback when scroll reaches end */
  onScrollEnd?: () => void;
}

export interface TVScrollViewRef {
  scrollToIndex: (index: number, animated?: boolean) => void;
  scrollToOffset: (offset: number, animated?: boolean) => void;
  scrollToStart: (animated?: boolean) => void;
  scrollToEnd: (animated?: boolean) => void;
  getScrollPosition: () => number;
}

const TVScrollView = forwardRef<TVScrollViewRef, TVScrollViewProps>(({
  children,
  horizontal = false,
  scrollStep = 0.8,
  snapEnabled = false,
  snapItemWidth,
  snapItemHeight,
  onScrollStart,
  onScrollEnd,
  onScroll,
  contentContainerStyle,
  ...props
}, ref) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPositionRef = useRef(0);
  const contentSizeRef = useRef(0);

  // Calculate scroll step based on viewport
  const getScrollStepSize = useCallback(() => {
    if (horizontal) {
      return snapItemWidth || SCREEN_WIDTH * scrollStep;
    }
    return snapItemHeight || SCREEN_HEIGHT * scrollStep;
  }, [horizontal, scrollStep, snapItemWidth, snapItemHeight]);

  // Scroll to specific index (for item-based scrolling)
  const scrollToIndex = useCallback((index: number, animated: boolean = true) => {
    const itemSize = horizontal ? (snapItemWidth || 200) : (snapItemHeight || 300);
    const offset = index * itemSize;
    
    if (scrollViewRef.current) {
      if (horizontal) {
        scrollViewRef.current.scrollTo({ x: offset, animated });
      } else {
        scrollViewRef.current.scrollTo({ y: offset, animated });
      }
    }
  }, [horizontal, snapItemWidth, snapItemHeight]);

  // Scroll to specific offset
  const scrollToOffset = useCallback((offset: number, animated: boolean = true) => {
    if (scrollViewRef.current) {
      if (horizontal) {
        scrollViewRef.current.scrollTo({ x: offset, animated });
      } else {
        scrollViewRef.current.scrollTo({ y: offset, animated });
      }
    }
  }, [horizontal]);

  // Scroll to start
  const scrollToStart = useCallback((animated: boolean = true) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated });
    }
  }, []);

  // Scroll to end
  const scrollToEnd = useCallback((animated: boolean = true) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated });
    }
  }, []);

  // Get current scroll position
  const getScrollPosition = useCallback(() => {
    return scrollPositionRef.current;
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    scrollToIndex,
    scrollToOffset,
    scrollToStart,
    scrollToEnd,
    getScrollPosition,
  }));

  // Handle scroll events
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const position = horizontal ? contentOffset.x : contentOffset.y;
    const size = horizontal ? contentSize.width : contentSize.height;
    const layoutSize = horizontal ? layoutMeasurement.width : layoutMeasurement.height;
    
    scrollPositionRef.current = position;
    contentSizeRef.current = size;

    // Check if at start
    if (position <= 0) {
      onScrollStart?.();
    }

    // Check if at end
    if (position + layoutSize >= size - 10) {
      onScrollEnd?.();
    }

    // Call original onScroll if provided
    onScroll?.(event);
  }, [horizontal, onScroll, onScrollStart, onScrollEnd]);

  // TV-specific content container padding
  const tvContentContainerStyle = isTV ? {
    paddingHorizontal: horizontal ? tvDimensions.tvSafeAreaPadding : undefined,
    paddingVertical: !horizontal ? tvDimensions.tvSafeAreaPadding : undefined,
  } : {};

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={handleScroll}
      decelerationRate={isTV ? 'fast' : 'normal'}
      contentContainerStyle={[tvContentContainerStyle, contentContainerStyle]}
      // Snap props for TV
      snapToInterval={snapEnabled ? getScrollStepSize() : undefined}
      snapToAlignment={snapEnabled ? 'start' : undefined}
      {...props}
    >
      {children}
    </ScrollView>
  );
});

TVScrollView.displayName = 'TVScrollView';

export default TVScrollView;
