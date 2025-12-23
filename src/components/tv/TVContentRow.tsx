/**
 * TVContentRow Component
 * A horizontal scrolling row of content items optimized for TV navigation
 * Handles focus management and D-pad navigation automatically
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
  ListRenderItemInfo,
} from 'react-native';
import { isTV, tvDimensions } from '../../utils/tvPlatform';
import TVFocusWrapper from './TVFocusWrapper';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ContentItem {
  id: string;
  type: string;
  title?: string;
  poster?: string;
  [key: string]: any;
}

export interface TVContentRowProps {
  title: string;
  data: ContentItem[];
  onItemPress: (item: ContentItem) => void;
  onItemFocus?: (item: ContentItem, index: number) => void;
  renderItem?: (item: ContentItem, isFocused: boolean) => React.ReactNode;
  itemWidth?: number;
  itemHeight?: number;
  isFirstRow?: boolean;
  rowIndex?: number;
  focusedRowIndex?: number;
  onRowFocus?: (rowIndex: number) => void;
}

const TVContentRow: React.FC<TVContentRowProps> = ({
  title,
  data,
  onItemPress,
  onItemFocus,
  renderItem,
  itemWidth = isTV ? tvDimensions.posterWidth : 120,
  itemHeight = isTV ? tvDimensions.posterHeight : 180,
  isFirstRow = false,
  rowIndex = 0,
  focusedRowIndex,
  onRowFocus,
}) => {
  const { currentTheme } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Scroll to focused item
  useEffect(() => {
    if (focusedIndex >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: focusedIndex,
        animated: true,
        viewPosition: 0.3, // Keep focused item slightly left of center
      });
    }
  }, [focusedIndex]);

  const handleItemFocus = useCallback((item: ContentItem, index: number) => {
    setFocusedIndex(index);
    onItemFocus?.(item, index);
    onRowFocus?.(rowIndex);
  }, [onItemFocus, onRowFocus, rowIndex]);

  const handleItemPress = useCallback((item: ContentItem) => {
    onItemPress(item);
  }, [onItemPress]);

  const renderContentItem = useCallback(({ item, index }: ListRenderItemInfo<ContentItem>) => {
    const isFocused = focusedIndex === index;
    const shouldHaveInitialFocus = isFirstRow && index === 0;

    return (
      <TVFocusWrapper
        key={item.id}
        onPress={() => handleItemPress(item)}
        onFocusChange={(focused: boolean) => {
          if (focused) {
            handleItemFocus(item, index);
          }
        }}
        hasTVPreferredFocus={shouldHaveInitialFocus}
        style={[
          styles.itemContainer,
          {
            width: itemWidth,
            height: itemHeight,
          },
        ]}
        focusScale={1.1}
        focusRingColor={currentTheme.colors.primary || '#4A90D9'}
      >
        {renderItem ? (
          renderItem(item, isFocused)
        ) : (
          <View style={[styles.defaultItem, { backgroundColor: currentTheme.colors.card || '#1a1a1a' }]}>
            <Text style={[styles.itemTitle, { color: currentTheme.colors.text || '#fff' }]} numberOfLines={2}>
              {item.title || 'Untitled'}
            </Text>
          </View>
        )}
      </TVFocusWrapper>
    );
  }, [
    focusedIndex,
    isFirstRow,
    handleItemPress,
    handleItemFocus,
    itemWidth,
    itemHeight,
    renderItem,
    currentTheme,
  ]);

  const keyExtractor = useCallback((item: ContentItem) => `${item.id}-${item.type}`, []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: itemWidth + tvDimensions.horizontalSpacing,
    offset: (itemWidth + tvDimensions.horizontalSpacing) * index,
    index,
  }), [itemWidth]);

  const ItemSeparator = useCallback(() => (
    <View style={{ width: tvDimensions.horizontalSpacing }} />
  ), []);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[
        styles.title,
        {
          color: currentTheme.colors.text || '#fff',
          fontSize: tvDimensions.titleFontSize,
          marginLeft: isTV ? tvDimensions.tvSafeAreaPadding : 16,
        }
      ]}>
        {title}
      </Text>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderContentItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: isTV ? tvDimensions.tvSafeAreaPadding : 16 }
        ]}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={6}
        // Scroll behavior for TV
        decelerationRate={isTV ? 'fast' : 'normal'}
        scrollEnabled={!isTV} // On TV, focus handles scrolling
        onScrollToIndexFailed={(info: { averageItemLength: number; index: number }) => {
          // Handle scroll failure gracefully
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tvDimensions.verticalSpacing,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: isTV ? 16 : 12,
  },
  listContent: {
    paddingRight: 16,
  },
  itemContainer: {
    borderRadius: tvDimensions.focusRingRadius,
    overflow: 'hidden',
  },
  defaultItem: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 8,
    borderRadius: 8,
  },
  itemTitle: {
    fontSize: isTV ? 16 : 12,
    fontWeight: '600',
  },
});

export default TVContentRow;
