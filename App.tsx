/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  I18nManager,
  Platform,
  LogBox,
  Text
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { enableScreens, enableFreeze } from 'react-native-screens';
import AppNavigator, {
  CustomNavigationDarkTheme,
  CustomDarkTheme
} from './src/navigation/AppNavigator';
import 'react-native-reanimated';
import { CatalogProvider } from './src/contexts/CatalogContext';
import { GenreProvider } from './src/contexts/GenreContext';
import { TraktProvider } from './src/contexts/TraktContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { TrailerProvider } from './src/contexts/TrailerContext';
import { DownloadsProvider } from './src/contexts/DownloadsContext';
import { TVFocusProvider } from './src/contexts/TVFocusContext';
import { TVRemoteHandler } from './src/components/tv/TVRemoteHandler';
import { isTV } from './src/utils/tvPlatform';
import SplashScreen from './src/components/SplashScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import UpdatePopup from './src/components/UpdatePopup';
import MajorUpdateOverlay from './src/components/MajorUpdateOverlay';
import { useGithubMajorUpdate } from './src/hooks/useGithubMajorUpdate';
import { useUpdatePopup } from './src/hooks/useUpdatePopup';
import * as Sentry from '@sentry/react-native';
import UpdateService from './src/services/updateService';
import { memoryMonitorService } from './src/services/memoryMonitorService';
import { aiService } from './src/services/aiService';
import { AccountProvider, useAccount } from './src/contexts/AccountContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { mmkvStorage } from './src/services/mmkvStorage';
import AnnouncementOverlay from './src/components/AnnouncementOverlay';

// Initialize Sentry with error handling
try {
  Sentry.init({
    dsn: 'https://1a58bf436454d346e5852b7bfd3c95e8@o4509536317276160.ingest.de.sentry.io/4509536317734992',

    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,

    // Configure Session Replay conservatively to avoid startup overhead in production
    replaysSessionSampleRate: __DEV__ ? 0.1 : 0,
    replaysOnErrorSampleRate: __DEV__ ? 1 : 0,
    integrations: [Sentry.feedbackIntegration()],

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: __DEV__,
  });
} catch (e) {
  console.warn('Sentry initialization failed:', e);
}

// Force LTR layout to prevent RTL issues when Arabic is set as system language
// This ensures posters and UI elements remain visible and properly positioned
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

// Suppress duplicate key warnings app-wide
LogBox.ignoreLogs([
  'Warning: Encountered two children with the same key',
  'Keys should be unique so that components maintain their identity across updates'
]);

// This fixes many navigation layout issues by using native screen containers
enableScreens(true);
// Freeze non-focused screens to stop background re-renders
enableFreeze(true);

// Inner app component that uses the theme context
const ThemedApp = () => {
  // Log JS engine once at startup
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const engine = (global as any).HermesInternal ? 'Hermes' : 'JSC';
      console.log('JS Engine:', engine);
    } catch { }
  }, []);
  const { currentTheme } = useTheme();
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initTimeout, setInitTimeout] = useState(false);

  // Safety timeout - if app doesn't initialize within 15 seconds, show error recovery
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isAppReady) {
        console.warn('App initialization timeout - forcing ready state');
        setInitTimeout(true);
        setIsAppReady(true);
        if (hasCompletedOnboarding === null) {
          setHasCompletedOnboarding(false); // Default to onboarding
        }
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [isAppReady, hasCompletedOnboarding]);

  // Update popup functionality
  const {
    showUpdatePopup,
    updateInfo,
    isInstalling,
    handleUpdateNow,
    handleUpdateLater,
    handleDismiss,
  } = useUpdatePopup();

  // GitHub major/minor release overlay
  const githubUpdate = useGithubMajorUpdate();

  // Announcement data
  const announcements = [
    {
      icon: 'zap',
      title: 'Debrid Integration',
      description: 'Unlock 4K high-quality streams with lightning-fast speeds. Connect your TorBox account to access cached premium content with zero buffering.',
      tag: 'NEW',
    },
  ];

  // Check onboarding status and initialize services
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check onboarding status
        const onboardingCompleted = await mmkvStorage.getItem('hasCompletedOnboarding');
        setHasCompletedOnboarding(onboardingCompleted === 'true');

        // Initialize update service (non-critical, wrap in try-catch)
        try {
          await UpdateService.initialize();
        } catch (e) {
          console.warn('UpdateService initialization failed:', e);
        }

        // Initialize memory monitoring service to prevent OutOfMemoryError (non-critical)
        try {
          memoryMonitorService; // Just accessing it starts the monitoring
          console.log('Memory monitoring service initialized');
        } catch (e) {
          console.warn('Memory monitoring service failed:', e);
        }

        // Initialize AI service (non-critical)
        try {
          await aiService.initialize();
          console.log('AI service initialized');
        } catch (e) {
          console.warn('AI service initialization failed:', e);
        }

        // Check if announcement should be shown (version 1.0.0)
        try {
          const announcementShown = await mmkvStorage.getItem('announcement_v1.0.0_shown');
          if (!announcementShown && onboardingCompleted === 'true') {
            // Show announcement only after app is ready
            setTimeout(() => {
              setShowAnnouncement(true);
            }, 1000);
          }
        } catch (e) {
          console.warn('Announcement check failed:', e);
        }

      } catch (error) {
        console.error('Error initializing app:', error);
        setInitError(String(error));
        // Default to showing onboarding if we can't check
        setHasCompletedOnboarding(false);
      }
    };

    initializeApp();
  }, []);

  // Create custom themes based on current theme
  const customDarkTheme = {
    ...CustomDarkTheme,
    colors: {
      ...CustomDarkTheme.colors,
      primary: currentTheme.colors.primary,
    }
  };

  const customNavigationTheme = {
    ...CustomNavigationDarkTheme,
    colors: {
      ...CustomNavigationDarkTheme.colors,
      primary: currentTheme.colors.primary,
      card: currentTheme.colors.darkBackground,
      background: currentTheme.colors.darkBackground,
    }
  };

  // Handler for splash screen completion  
  const handleSplashComplete = () => {
    setIsAppReady(true);
  };

  // Navigation reference
  const navigationRef = React.useRef<any>(null);

  // Handler for navigating to debrid integration
  const handleNavigateToDebrid = () => {
    if (navigationRef.current) {
      navigationRef.current.navigate('DebridIntegration');
    }
  };

  // Handler for announcement close
  const handleAnnouncementClose = async () => {
    setShowAnnouncement(false);
    // Mark announcement as shown
    await mmkvStorage.setItem('announcement_v1.0.0_shown', 'true');
  };

  // Don't render anything until we know the onboarding status
  const shouldShowApp = isAppReady && hasCompletedOnboarding !== null;
  const initialRouteName = hasCompletedOnboarding ? 'MainTabs' : 'Onboarding';

  return (
    <AccountProvider>
      <PaperProvider theme={customDarkTheme}>
        <NavigationContainer
          ref={navigationRef}
          theme={customNavigationTheme}
          linking={undefined}
        >
          <DownloadsProvider>
            <TVRemoteHandler>
              <View style={[styles.container, { backgroundColor: currentTheme.colors.darkBackground }]}>
              <StatusBar style="light" />
              {!isAppReady && <SplashScreen onFinish={handleSplashComplete} />}
              {shouldShowApp && <AppNavigator initialRouteName={initialRouteName} />}
              <UpdatePopup
                visible={showUpdatePopup}
                updateInfo={updateInfo}
                onUpdateNow={handleUpdateNow}
                onUpdateLater={handleUpdateLater}
                onDismiss={handleDismiss}
                isInstalling={isInstalling}
              />
              <MajorUpdateOverlay
                visible={githubUpdate.visible}
                latestTag={githubUpdate.latestTag}
                releaseNotes={githubUpdate.releaseNotes}
                releaseUrl={githubUpdate.releaseUrl}
                onDismiss={githubUpdate.onDismiss}
                onLater={githubUpdate.onLater}
              />
              <AnnouncementOverlay
                visible={showAnnouncement}
                announcements={announcements}
                onClose={handleAnnouncementClose}
                onActionPress={handleNavigateToDebrid}
                actionButtonText="Connect Now"
              />
              </View>
            </TVRemoteHandler>
          </DownloadsProvider>
        </NavigationContainer>
      </PaperProvider>
    </AccountProvider>
  );
}

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TVFocusProvider>
          <GenreProvider>
            <CatalogProvider>
            <TraktProvider>
              <ThemeProvider>
                <TrailerProvider>
                  <ToastProvider>
                    <ThemedApp />
                  </ToastProvider>
                </TrailerProvider>
              </ThemeProvider>
            </TraktProvider>
          </CatalogProvider>
        </GenreProvider>
      </TVFocusProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// Wrap with Sentry for crash reporting, with fallback if Sentry fails
let WrappedApp;
try {
  WrappedApp = Sentry.wrap(App);
} catch (e) {
  console.warn('Sentry.wrap failed, using unwrapped App:', e);
  WrappedApp = App;
}

export default WrappedApp;