package com.nuvio.app

import android.app.UiModeManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

/**
 * Android TV Activity for Leanback Launcher
 * This activity is used when launching from Android TV's Leanback launcher
 * It handles TV-specific configurations and D-pad/remote navigation
 * 
 * IMPORTANT: This activity detects if we're on a REAL Android TV vs emulated
 * environments like WSA (Windows Subsystem for Android) and redirects accordingly.
 */
class TVActivity : ReactActivity() {
    
    companion object {
        private const val TAG = "TVActivity"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        try {
            // Check if this is a real Android TV device
            // If not (e.g., WSA, emulator with leanback), redirect to MainActivity for tablet mode
            if (!isRealAndroidTV()) {
                Log.d(TAG, "Not a real Android TV, redirecting to MainActivity")
                redirectToMainActivity()
                return
            }
            
            Log.d(TAG, "Real Android TV detected, using TV interface")
            // Set the TV theme BEFORE onCreate (only for real TV)
            setTheme(R.style.Theme_App_TV)
            super.onCreate(null)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error in onCreate, falling back to MainActivity: ${e.message}", e)
            // If anything goes wrong, redirect to MainActivity as fallback
            redirectToMainActivity()
        }
    }

    /**
     * Detects if this is a REAL Android TV device vs WSA/emulator
     * WSA and some emulators have leanback features but should use tablet mode
     */
    private fun isRealAndroidTV(): Boolean {
        // Check 1: Is this Windows Subsystem for Android (WSA)?
        if (isWSA()) {
            return false
        }
        
        // Check 2: Is this a Chrome OS device (Chromebook)?
        if (isChromeOS()) {
            return false
        }
        
        // Check 3: Is this running in an emulator that's not TV mode?
        if (isNonTVEmulator()) {
            return false
        }
        
        // Check 4: Verify it's actually in TV UI mode
        val uiModeManager = getSystemService(Context.UI_MODE_SERVICE) as UiModeManager
        val isTelevisionMode = uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION
        
        // Check 5: Has real leanback feature AND is in TV mode
        val hasLeanback = packageManager.hasSystemFeature(PackageManager.FEATURE_LEANBACK)
        
        // Must be in TV mode AND have leanback to be a real TV
        return isTelevisionMode && hasLeanback
    }
    
    /**
     * Detect Windows Subsystem for Android (WSA)
     */
    private fun isWSA(): Boolean {
        val manufacturer = Build.MANUFACTURER?.lowercase() ?: ""
        val model = Build.MODEL?.lowercase() ?: ""
        val brand = Build.BRAND?.lowercase() ?: ""
        val product = Build.PRODUCT?.lowercase() ?: ""
        val device = Build.DEVICE?.lowercase() ?: ""
        
        // WSA detection patterns
        return manufacturer.contains("microsoft") ||
               model.contains("subsystem") ||
               model.contains("windows") ||
               brand.contains("microsoft") ||
               product.contains("windows") ||
               device.contains("windows") ||
               // Additional WSA fingerprints
               (manufacturer == "unknown" && model.contains("x86"))
    }
    
    /**
     * Detect Chrome OS / Chromebook devices
     */
    private fun isChromeOS(): Boolean {
        return packageManager.hasSystemFeature("org.chromium.arc.device_management") ||
               packageManager.hasSystemFeature("org.chromium.arc") ||
               Build.DEVICE?.contains("cheets") == true
    }
    
    /**
     * Detect if running in a non-TV emulator
     */
    private fun isNonTVEmulator(): Boolean {
        val isEmulator = Build.FINGERPRINT?.contains("generic") == true ||
                         Build.FINGERPRINT?.contains("sdk") == true ||
                         Build.MODEL?.contains("Emulator") == true ||
                         Build.MODEL?.contains("Android SDK") == true ||
                         Build.MANUFACTURER?.contains("Genymotion") == true ||
                         Build.PRODUCT?.contains("sdk") == true ||
                         Build.HARDWARE?.contains("goldfish") == true ||
                         Build.HARDWARE?.contains("ranchu") == true
        
        if (!isEmulator) return false
        
        // If it's an emulator, check if it's specifically a TV emulator
        val uiModeManager = getSystemService(Context.UI_MODE_SERVICE) as UiModeManager
        val isTelevisionMode = uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION
        
        // Non-TV emulator = emulator that's NOT in TV mode
        return !isTelevisionMode
    }
    
    /**
     * Redirect to MainActivity for tablet/mobile experience
     */
    private fun redirectToMainActivity() {
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        // Pass any extras from the original intent
        this.intent?.extras?.let { intent.putExtras(it) }
        startActivity(intent)
        finish()
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This uses the same component as mobile but React Native will detect TV mode.
     */
    override fun getMainComponentName(): String = "main"

    /**
     * Returns the instance of the [ReactActivityDelegate].
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            object : DefaultReactActivityDelegate(
                this,
                mainComponentName,
                fabricEnabled
            ) {}
        )
    }

    /**
     * Handle TV remote key events for better navigation
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Let React Native handle all key events for D-pad navigation
        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
            KeyEvent.KEYCODE_MEDIA_PLAY,
            KeyEvent.KEYCODE_MEDIA_PAUSE,
            KeyEvent.KEYCODE_MEDIA_STOP,
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD,
            KeyEvent.KEYCODE_MEDIA_REWIND -> {
                // Pass to React Native
                return super.onKeyDown(keyCode, event)
            }
        }
        return super.onKeyDown(keyCode, event)
    }
}
