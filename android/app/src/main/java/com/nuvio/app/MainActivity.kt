package com.nuvio.app

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.WindowManager

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  
  companion object {
    private const val TAG = "MainActivity"
    private const val SPLASH_TIMEOUT_MS = 10000L // 10 second timeout for splash
  }
  
  private var splashHandler: Handler? = null
  private var splashRunnable: Runnable? = null
  
  override fun onCreate(savedInstanceState: Bundle?) {
    var themeApplied = false
    
    try {
      // Set the theme to AppTheme BEFORE onCreate to support
      // coloring the background, status bar, and navigation bar.
      // This is required for expo-splash-screen.
      setTheme(R.style.AppTheme)
      themeApplied = true
    } catch (e: Exception) {
      Log.e(TAG, "Error setting theme: ${e.message}", e)
    }
    
    try {
      super.onCreate(null)
    } catch (e: Exception) {
      Log.e(TAG, "Error in super.onCreate: ${e.message}", e)
      // Try without null savedInstanceState as fallback
      try {
        super.onCreate(savedInstanceState)
      } catch (e2: Exception) {
        Log.e(TAG, "Critical error in onCreate: ${e2.message}", e2)
      }
    }
    
    // Setup safety timeout - if React Native doesn't load, prevent black screen
    setupSplashTimeout()
    
    // Initialize Google Cast context safely (may not be available on all devices)
    initializeGoogleCast()
    
    // Ensure window is visible even if something fails
    ensureWindowVisible()
  }
  
  /**
   * Safety timeout to prevent infinite black screen
   * If React Native fails to load within timeout, we ensure the window is visible
   */
  private fun setupSplashTimeout() {
    try {
      splashHandler = Handler(Looper.getMainLooper())
      splashRunnable = Runnable {
        Log.w(TAG, "Splash timeout reached, ensuring window visibility")
        ensureWindowVisible()
      }
      splashHandler?.postDelayed(splashRunnable!!, SPLASH_TIMEOUT_MS)
    } catch (e: Exception) {
      Log.e(TAG, "Error setting up splash timeout: ${e.message}", e)
    }
  }
  
  /**
   * Ensure the window is visible and not stuck on black screen
   */
  private fun ensureWindowVisible() {
    try {
      window?.let { w ->
        w.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
        w.clearFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE)
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error ensuring window visibility: ${e.message}", e)
    }
  }
  
  override fun onResume() {
    super.onResume()
    // Cancel timeout on successful resume
    cancelSplashTimeout()
  }
  
  override fun onDestroy() {
    cancelSplashTimeout()
    super.onDestroy()
  }
  
  private fun cancelSplashTimeout() {
    try {
      splashRunnable?.let { splashHandler?.removeCallbacks(it) }
      splashHandler = null
      splashRunnable = null
    } catch (e: Exception) {
      Log.e(TAG, "Error canceling splash timeout: ${e.message}", e)
    }
  }
  
  /**
   * Safely initialize Google Cast - may not be available on all devices
   * (e.g., Amazon Fire TV, some Android TV, WSA, emulators)
   */
  private fun initializeGoogleCast() {
    try {
      // Check if Google Play Services class exists first
      Class.forName("com.google.android.gms.common.GoogleApiAvailability")
      
      // Check if Google Play Services is available before initializing Cast
      val googleApiAvailability = com.google.android.gms.common.GoogleApiAvailability.getInstance()
      val resultCode = googleApiAvailability.isGooglePlayServicesAvailable(this)
      
      if (resultCode == com.google.android.gms.common.ConnectionResult.SUCCESS) {
        // Check if Cast class exists
        Class.forName("com.reactnative.googlecast.api.RNGCCastContext")
        com.reactnative.googlecast.api.RNGCCastContext.getSharedInstance(this)
        Log.d(TAG, "Google Cast initialized successfully")
      } else {
        Log.w(TAG, "Google Play Services not available (code: $resultCode), skipping Cast")
      }
    } catch (e: ClassNotFoundException) {
      Log.w(TAG, "Google Cast/Play Services not available on this device")
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
