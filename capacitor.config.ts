import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.viraltracker.app',
  appName: 'ViralTracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
