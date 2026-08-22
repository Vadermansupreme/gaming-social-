import { useTheme } from 'next-themes';
import { useCallback } from 'react';

export type ThemePreference = 'system' | 'dark' | 'light';

export const useDarkMode = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const themePreference = (theme as ThemePreference) || 'system';
  const isDarkMode = resolvedTheme === 'dark';
  
  const setThemePreference = useCallback((pref: ThemePreference) => {
    setTheme(pref);
  }, [setTheme]);

  // Legacy toggle for backward compatibility
  const toggle = useCallback(() => {
    setTheme(isDarkMode ? 'light' : 'dark');
  }, [isDarkMode, setTheme]);

  return { isDarkMode, themePreference, setThemePreference, toggle };
};
