import { useColorScheme } from 'react-native';
import { dark, light, ThemeColors } from '@/theme/colors';
import { useSettingsStore } from '@/store/useSettingsStore';

export function useTheme(): ThemeColors {
  const systemScheme = useColorScheme();
  const { colorScheme } = useSettingsStore();

  const resolved =
    colorScheme === 'system' ? systemScheme : colorScheme;

  return resolved === 'dark' ? dark : light;
}

export function useIsDark(): boolean {
  const systemScheme = useColorScheme();
  const { colorScheme } = useSettingsStore();
  const resolved = colorScheme === 'system' ? systemScheme : colorScheme;
  return resolved === 'dark';
}