import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ColorScheme = 'dark' | 'light' | 'system';

interface SettingsState {
  currency: string;
  colorScheme: ColorScheme;
  notificationsEnabled: boolean;
  setCurrency: (currency: string) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const storage = createJSONStorage(() => {
  if (Platform.OS === 'web') return localStorage;
  return require('@react-native-async-storage/async-storage').default;
});

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: 'INR',
      colorScheme: 'system',
      notificationsEnabled: true,

      setCurrency: (currency) => set({ currency }),
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),
    }),
    {
      name: 'quidd-settings',
      storage,
    }
  )
);