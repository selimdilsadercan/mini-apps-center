import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.everything.apps',
  appName: 'Everything',
  webDir: 'out',
  /* server: {
    hostname: 'allminiapps.com',
    iosScheme: 'https',
    allowNavigation: [
      'clerk.allminiapps.com',
      '*.clerk.accounts.dev',
      'allminiapps.com',
      '*.allminiapps.com',
    ]
  }, */
  plugins: {
    StatusBar: {
      backgroundColor: '#FAF9F7',
      overlaysWebView: false
    },
    App: {
      // Enable deep linking
    },
    CapacitorHttp: {
      enabled: false
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com", "apple.com"]
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
