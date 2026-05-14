import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColor {
  name: string;
  hex: string;
  id: string;
}

export const THEME_COLORS: ThemeColor[] = [
  { id: 'classic-blue', name: 'Classic Blue', hex: '#4F7CFF' },
  { id: 'neon-cyan', name: 'Neon Cyan', hex: '#00F3FF' },
  { id: 'neon-green', name: 'Neon Green', hex: '#39FF14' },
  { id: 'lime-surge', name: 'Lime Surge', hex: '#CCFF00' },
  { id: 'electric-yellow', name: 'Electric Yellow', hex: '#FFFF00' },
  { id: 'pure-gold', name: 'Pure Gold', hex: '#FFD700' },
  { id: 'lava-orange', name: 'Lava Orange', hex: '#FF4500' },
  { id: 'neon-orange', name: 'Neon Orange', hex: '#FF5F1F' },
  { id: 'vibrant-coral', name: 'Vibrant Coral', hex: '#FF7F50' },
  { id: 'crimson-tide', name: 'Crimson Tide', hex: '#DC143C' },
  { id: 'hot-pink', name: 'Hot Pink', hex: '#FF69B4' },
  { id: 'neon-pink', name: 'Neon Pink', hex: '#FF10F0' },
  { id: 'electric-purple', name: 'Electric Purple', hex: '#BF00FF' },
  { id: 'royal-magenta', name: 'Royal Magenta', hex: '#FF00FF' },
  { id: 'deep-indigo', name: 'Deep Indigo', hex: '#3F00FF' },
  { id: 'sky-blue', name: 'Sky Blue', hex: '#00BFFF' },
  { id: 'deep-teal', name: 'Deep Teal', hex: '#008080' },
  { id: 'mint-frost', name: 'Mint Frost', hex: '#98FF98' },
  { id: 'emerald-city', name: 'Emerald City', hex: '#50C878' },
  { id: 'forest-spirit', name: 'Forest Spirit', hex: '#228B22' },
  { id: 'desert-sand', name: 'Desert Sand', hex: '#EDC9AF' },
  { id: 'rose-gold', name: 'Rose Gold', hex: '#B76E79' },
  { id: 'silver-mist', name: 'Silver Mist', hex: '#C0C0C0' },
  { id: 'slate-storm', name: 'Slate Storm', hex: '#708090' },
  { id: 'paper-white', name: 'Paper White', hex: '#F9F9F9' },
  { id: 'midnight-black', name: 'Midnight Black', hex: '#121212' },
  { id: 'neon-lavender', name: 'Neon Lavender', hex: '#E0B0FF' },
  { id: 'aqua-marine', name: 'Aqua Marine', hex: '#7FFFD4' },
  { id: 'ultra-violet', name: 'Ultra Violet', hex: '#645394' },
  { id: 'atomic-tangerine', name: 'Atomic Tangerine', hex: '#FF9966' },
  { id: 'phlox-purple', name: 'Phlox Purple', hex: '#DF00FF' },
  { id: 'harlequin-green', name: 'Harlequin Green', hex: '#3FFF00' },
];

interface ThemeContextType {
  mode: ThemeMode;
  accentColor: ThemeColor;
  toggleMode: () => void;
  setAccentColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('zenScan_themeMode');
    return (saved as ThemeMode) || 'dark';
  });

  const [accentColor, setAccentColorState] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem('zenScan_accentColor');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed as ThemeColor;
      } catch (e) {
        return THEME_COLORS[0];
      }
    }
    return THEME_COLORS[0];
  });

  const toggleMode = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    localStorage.setItem('zenScan_themeMode', newMode);
  };

  const setAccentColor = (color: ThemeColor) => {
    setAccentColorState(color);
    localStorage.setItem('zenScan_accentColor', JSON.stringify(color));
  };

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply Mode
    if (mode === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--bg-primary', '#09090b');
      root.style.setProperty('--bg-secondary', '#18181b');
      root.style.setProperty('--text-main', '#ffffff');
      root.style.setProperty('--text-muted', '#71717a');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--bg-primary', '#f4f4f5');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--text-main', '#09090b');
      root.style.setProperty('--text-muted', '#71717a');
    }

    // Apply Accent
    root.style.setProperty('--accent', accentColor.hex);
    
    // Calculate Contrast for Accent Text
    const r = parseInt(accentColor.hex.slice(1, 3), 16);
    const g = parseInt(accentColor.hex.slice(3, 5), 16);
    const b = parseInt(accentColor.hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const accentContrast = luminance > 0.5 ? '#000000' : '#ffffff';
    root.style.setProperty('--accent-contrast', accentContrast);

  }, [mode, accentColor]);

  return (
    <ThemeContext.Provider value={{ mode, accentColor, toggleMode, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
