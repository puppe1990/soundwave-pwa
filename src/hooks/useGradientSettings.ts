import { useState, useEffect, useCallback } from 'react';

export interface GradientSettings {
  primary: string;
  secondary: string;
  direction: number; // degrees for gradient direction
}

const DEFAULT_GRADIENT: GradientSettings = {
  primary: '#8B5CF6', // hsl(262 83% 58%) - current primary
  secondary: '#A855F7', // hsl(282 83% 48%) - current secondary
  direction: 135, // current direction
};

const STORAGE_KEY = 'soundwave-gradient-settings';

export const useGradientSettings = () => {
  const [gradientSettings, setGradientSettings] = useState<GradientSettings>(DEFAULT_GRADIENT);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on initialization
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as GradientSettings;
          setGradientSettings(parsed);
          console.log('🎨 Loaded gradient settings:', parsed);
        } else {
          console.log('🎨 Using default gradient settings');
        }
      } catch (error) {
        console.error('❌ Error loading gradient settings:', error);
        setGradientSettings(DEFAULT_GRADIENT);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Apply gradient to CSS custom properties
  const applyGradient = useCallback((settings: GradientSettings) => {
    const root = document.documentElement;
    
    // Create the gradient string
    const gradient = `linear-gradient(${settings.direction}deg, ${settings.primary}, ${settings.secondary})`;
    
    // Update CSS custom properties
    root.style.setProperty('--gradient-primary', gradient);
    root.style.setProperty('--gradient-player', gradient);
    
    // Also update the player accent colors to match the gradient
    const primaryColor = settings.primary;
    const secondaryColor = settings.secondary;
    
    // Convert hex to HSL for better color manipulation
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      
      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    };
    
    try {
      const [h1, s1, l1] = hexToHsl(primaryColor);
      const [h2, s2, l2] = hexToHsl(secondaryColor);
      
      // Update primary colors
      root.style.setProperty('--primary', `${h1} ${s1}% ${l1}%`);
      root.style.setProperty('--player-accent', `${h1} ${s1}% ${l1}%`);
      root.style.setProperty('--audio-progress', `${h1} ${s1}% ${l1}%`);
      
      // Update glow color (slightly brighter)
      const glowL = Math.min(l1 + 15, 100);
      root.style.setProperty('--primary-glow', `${h1} ${s1}% ${glowL}%`);
      root.style.setProperty('--player-accent-glow', `${h1} ${s1}% ${glowL}%`);
      
      console.log('🎨 Applied gradient colors:', {
        primary: `${h1} ${s1}% ${l1}%`,
        secondary: `${h2} ${s2}% ${l2}%`,
        direction: settings.direction
      });
    } catch (error) {
      console.warn('⚠️ Could not parse colors, using fallback');
    }
  }, []);

  // Apply gradient whenever settings change
  useEffect(() => {
    if (!isLoading) {
      applyGradient(gradientSettings);
    }
  }, [gradientSettings, isLoading, applyGradient]);

  // Update gradient settings
  const updateGradientSettings = useCallback((newSettings: Partial<GradientSettings>) => {
    const updated = { ...gradientSettings, ...newSettings };
    setGradientSettings(updated);
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log('🎨 Saved gradient settings:', updated);
    } catch (error) {
      console.error('❌ Error saving gradient settings:', error);
    }
  }, [gradientSettings]);

  // Reset to default gradient
  const resetGradient = useCallback(() => {
    setGradientSettings(DEFAULT_GRADIENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GRADIENT));
    console.log('🎨 Reset to default gradient');
  }, []);

  // Preset gradients
  const presets = [
    {
      name: 'Purple (Default)',
      primary: '#8B5CF6',
      secondary: '#A855F7',
      direction: 135,
    },
    {
      name: 'Blue Ocean',
      primary: '#3B82F6',
      secondary: '#1E40AF',
      direction: 180,
    },
    {
      name: 'Sunset',
      primary: '#F59E0B',
      secondary: '#EF4444',
      direction: 45,
    },
    {
      name: 'Forest',
      primary: '#10B981',
      secondary: '#059669',
      direction: 90,
    },
    {
      name: 'Pink Dream',
      primary: '#EC4899',
      secondary: '#BE185D',
      direction: 225,
    },
    {
      name: 'Night Sky',
      primary: '#6366F1',
      secondary: '#1E1B4B',
      direction: 270,
    },
  ];

  const applyPreset = useCallback((preset: typeof presets[0]) => {
    updateGradientSettings({
      primary: preset.primary,
      secondary: preset.secondary,
      direction: preset.direction,
    });
  }, [updateGradientSettings]);

  return {
    gradientSettings,
    updateGradientSettings,
    resetGradient,
    applyPreset,
    presets,
    isLoading,
  };
};
