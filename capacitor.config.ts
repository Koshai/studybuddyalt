// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studyai.offline',
  appName: 'Offline Study AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Filesystem: {
      permissions: ['write-external-storage', 'read-external-storage']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF'
    }
  },
  ios: {
    scheme: 'Offline Study AI'
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;