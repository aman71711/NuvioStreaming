package com.nuvio.app

import android.os.Bundle
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
 */
class TVActivity : ReactActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // Set the TV theme BEFORE onCreate
        setTheme(R.style.Theme_App_TV)
        super.onCreate(null)
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
