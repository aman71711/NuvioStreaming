package com.nuvio.app

import android.os.Build
import android.os.Bundle
import android.util.Log

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  
  companion object {
    private const val TAG = "MainActivity"
  }
  
  override fun onCreate(savedInstanceState: Bundle?) {
    try {
      // Set the theme to AppTheme BEFORE onCreate to support
      // coloring the background, status bar, and navigation bar.
      // This is required for expo-splash-screen.
      setTheme(R.style.AppTheme)
      super.onCreate(null)
      
      // Initialize Google Cast context safely (may not be available on all devices)
      initializeGoogleCast()
      
    } catch (e: Exception) {
      Log.e(TAG, "Error in onCreate: ${e.message}", e)
      // Still call super.onCreate to prevent crash
      if (!isFinishing) {
        try {
          super.onCreate(null)
        } catch (e2: Exception) {
          Log.e(TAG, "Critical error in onCreate fallback: ${e2.message}", e2)
        }
      }
    }
  }
  
  /**
   * Safely initialize Google Cast - may not be available on all devices
   * (e.g., Amazon Fire TV, some Android TV, WSA, emulators)
   */
  private fun initializeGoogleCast() {
    try {
      // Check if Google Play Services is available before initializing Cast
      val googleApiAvailability = com.google.android.gms.common.GoogleApiAvailability.getInstance()
      val resultCode = googleApiAvailability.isGooglePlayServicesAvailable(this)
      
      if (resultCode == com.google.android.gms.common.ConnectionResult.SUCCESS) {
        com.reactnative.googlecast.api.RNGCCastContext.getSharedInstance(this)
        Log.d(TAG, "Google Cast initialized successfully")
      } else {
        Log.w(TAG, "Google Play Services not available (code: $resultCode), skipping Cast initialization")
      }
    } catch (e: Exception) {
      // Google Cast not available on this device - this is fine, just skip it
      Log.w(TAG, "Google Cast initialization skipped: ${e.message}")
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
