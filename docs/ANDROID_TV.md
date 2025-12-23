# Android TV Support for Nuvio Streaming

This document describes the Android TV implementation for the Nuvio Streaming app.

## Features

### Leanback Launcher Integration
- The app appears in the Android TV home screen launcher
- Custom TV banner (320x180dp) displayed in the launcher
- Separate TV activity for optimized TV experience

### Remote Control Navigation
- Full D-pad navigation support (Up, Down, Left, Right, Select)
- Focus-based navigation with visual feedback
- Media control buttons support (Play, Pause, Fast Forward, Rewind)
- Back button handling

### TV-Optimized UI
- Larger poster sizes for TV viewing distance
- Enhanced focus indicators with glow effects
- Smooth focus animations
- Safe area padding for TV overscan

## Architecture

### Native Android (Kotlin)
- `TVActivity.kt` - Dedicated activity for Android TV launched from Leanback
- `AndroidManifest.xml` - TV features, permissions, and launcher configuration
- Leanback support library integration

### React Native (TypeScript)

#### Utilities
- `src/utils/tvPlatform.ts` - TV detection and platform utilities
  - `isTV` - Check if running on TV
  - `isAndroidTV` - Check if specifically Android TV
  - `tvDimensions` - TV-optimized dimensions
  - `getTVFocusStyle()` - Focus styling helper

#### Hooks
- `src/hooks/useTVNavigation.ts` - TV remote event handling
  - `useTVNavigation()` - Handle all remote button events
  - `useTVFocus()` - Focus/blur event handling

#### Components
- `src/components/tv/TVFocusWrapper.tsx` - Focusable wrapper with animations
- `src/components/tv/TVScrollView.tsx` - TV-optimized scrolling
- `src/components/tv/TVContentRow.tsx` - Horizontal content rows for TV

## Usage

### Making a Component TV-Focusable

```tsx
import { TVFocusWrapper } from '../components/tv';

<TVFocusWrapper
  onPress={() => handlePress()}
  hasTVPreferredFocus={true} // First focusable item
  focusScale={1.1}
  focusRingColor="#4A90D9"
>
  <YourContent />
</TVFocusWrapper>
```

### Handling TV Remote Events

```tsx
import { useTVNavigation } from '../hooks/useTVNavigation';

useTVNavigation({
  onSelect: () => console.log('Select pressed'),
  onBack: () => {
    navigation.goBack();
    return true; // Prevent default back
  },
  onPlayPause: () => togglePlayback(),
});
```

### Checking if Running on TV

```tsx
import { isTV, isAndroidTV } from '../utils/tvPlatform';

if (isTV) {
  // TV-specific logic
}
```

## Building

### Using GitHub Actions

1. Push to the `main` or `android-tv` branch
2. Or create a tag starting with `v` (e.g., `v1.0.0`)
3. The workflow will build APKs for all architectures

### Manual Build

```bash
# Install dependencies
npm ci

# Build release APK
cd android
./gradlew assembleRelease
```

APKs will be in `android/app/build/outputs/apk/release/`

## Installation on Android TV

1. Download the appropriate APK:
   - `arm64-v8a` - Most modern Android TV devices (NVIDIA Shield, Sony, etc.)
   - `armeabi-v7a` - Older TV devices
   - `universal` - Works on all devices

2. Enable "Install from unknown sources":
   - Settings → Security → Unknown sources
   - Or Settings → Apps → Special access → Install unknown apps

3. Transfer the APK to your TV:
   - USB drive
   - Cloud storage (Google Drive, Dropbox)
   - ADB: `adb install app-release.apk`
   - Network file sharing

4. Install using a file manager app

## Testing

### Android TV Emulator

1. Create an Android TV AVD in Android Studio
2. Run the app: `npm run android`

### Physical Device

1. Enable Developer Options on your TV
2. Enable USB/Network debugging
3. Connect via ADB: `adb connect <TV_IP>:5555`
4. Run: `npm run android`

## Supported Android TV Versions

- Minimum: Android 7.0 (API 24)
- Target: Android 14 (API 34)
- Tested on:
  - NVIDIA Shield TV
  - Google TV devices
  - Fire TV (with sideloading)
  - Sony Android TV
  - Android TV emulator

## Known Limitations

1. Some UI elements may need additional TV optimization
2. Touch-based gestures (swipe, pinch) are not available on TV
3. Keyboard input requires an on-screen keyboard or connected keyboard

## Contributing

When adding new UI components:

1. Import TV utilities: `import { isTV } from '../utils/tvPlatform'`
2. Add focus handling for interactive elements
3. Use larger touch targets for TV (minimum 48dp)
4. Test with D-pad navigation
5. Ensure proper focus order
