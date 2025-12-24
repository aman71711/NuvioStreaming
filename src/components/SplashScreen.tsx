import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Text } from 'react-native';
import { colors } from '../styles/colors';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  // Animation value for opacity - use useRef to prevent re-creation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasFinished = useRef(false);

  useEffect(() => {
    // Safety timeout - ensure splash doesn't get stuck
    const safetyTimeout = setTimeout(() => {
      if (!hasFinished.current) {
        console.warn('Splash screen safety timeout triggered');
        hasFinished.current = true;
        onFinish();
      }
    }, 5000); // 5 second max for splash

    // Wait for a short period then start fade out animation
    const timer = setTimeout(() => {
      try {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          // Call onFinish when animation completes
          if (!hasFinished.current) {
            hasFinished.current = true;
            onFinish();
          }
        });
      } catch (e) {
        console.warn('Splash animation error:', e);
        if (!hasFinished.current) {
          hasFinished.current = true;
          onFinish();
        }
      }
    }, 300); // Show splash for 0.3 seconds

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimeout);
    };
  }, [fadeAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image
        source={require('../assets/splash-icon-new.png')}
        style={styles.image}
        resizeMode="contain"
        onError={(e) => {
          console.warn('Splash image load error:', e.nativeEvent.error);
          // If image fails to load, still finish splash
          if (!hasFinished.current) {
            hasFinished.current = true;
            onFinish();
          }
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  image: {
    width: '70%',
    height: '70%',
  },
});

export default SplashScreen;