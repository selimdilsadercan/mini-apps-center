import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.everything.miniapps',
  appName: 'recipe',
  webDir: 'out',
  plugins: {
    StatusBar: {
      backgroundColor: '#FAF9F7',
      overlaysWebView: false
    },
    App: {
      // Enable deep linking
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  android: {
    backgroundColor: '#FAF9F7',
    // Allow mixed content for OAuth
    allowMixedContent: true
  },
  ios: {
    backgroundColor: '#FAF9F7'
  }
};

export default config;
