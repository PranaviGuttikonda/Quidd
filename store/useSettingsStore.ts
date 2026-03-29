import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'dark' | 'light' | 'system';

interface SettingsState {
  currency: string;
  colorScheme: ColorScheme;
  notificationsEnabled: boolean;
  setCurrency: (currency: string) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

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
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);