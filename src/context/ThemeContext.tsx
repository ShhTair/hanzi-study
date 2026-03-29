import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors as DarkColors } from '../constants/colors';

export const LightColors = {
  ...DarkColors,
  background: '#F2F2F7',
  card: '#FFFFFF',
  cardElevated: '#E5E5EA',
  divider: '#C6C6C8',
  primary: '#0D9488',
  textPrimary: '#000000',
  textSecondary: '#3C3C43',
  textMuted: '#8E8E93',
  correct: '#22C55E',
  wrong: '#EF4444',
  warning: '#F59E0B',
  tone1: '#DC2626', tone2: '#EA580C', tone3: '#16A34A', tone4: '#2563EB', toneN: '#6B7280',
  border: '#E5E5EA',
  textDisabled: '#C6C6C8',
};

type ThemeType = 'dark' | 'light';

interface ThemeContextProps {
  colors: typeof DarkColors;
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  colors: DarkColors,
  theme: 'dark',
  setTheme: () => {}
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>('dark');
  const [colors, setColors] = useState(DarkColors);

  useEffect(() => {
    AsyncStorage.getItem('@hanzi_theme').then(val => {
      if (val === 'light' || val === 'dark') {
        setThemeState(val as ThemeType);
        setColors(val === 'light' ? LightColors : DarkColors);
      }
    });
  }, []);

  const setTheme = async (t: ThemeType) => {
    setThemeState(t);
    setColors(t === 'light' ? LightColors : DarkColors);
    await AsyncStorage.setItem('@hanzi_theme', t);
  };

  return (
    <ThemeContext.Provider value={{ colors, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
