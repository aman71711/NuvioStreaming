# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# React Native Core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Sentry - Prevent ASM instrumentation conflicts
-keepclassmembers class io.sentry.** { *; }
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**

# ASM - Keep all ASM classes to prevent instrumentation errors
-keep class org.objectweb.asm.** { *; }
-dontwarn org.objectweb.asm.**

# Keep all native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Kotlin Reflect and Coroutines
-keep class kotlin.** { *; }
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# Add any project specific keep options here:

# Media3 / ExoPlayer keep (extensions and reflection)
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# FastImage / Glide ProGuard rules
-keep public class com.dylanvann.fastimage.* {*;}
-keep public class com.dylanvann.fastimage.** {*;}
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep public class * extends com.bumptech.glide.module.AppGlideModule
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}
