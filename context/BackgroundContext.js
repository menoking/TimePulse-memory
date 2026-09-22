import { createContext, useContext, useEffect, useState } from 'react';

const BackgroundContext = createContext();

const STORAGE_KEY = 'timepulse_background_settings';

const defaultSettings = {
  customBackgroundId: null,
  backgroundMode: 'cover',
  backgroundPositionY: 50,
  imageEnabled: false,
  imageOpacity: 1,
  gradientEnabled: true,
  gradientOpacity: 1,
  bgOpacity: 0.3,
  blurAmount: 0
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function normalizeSettings(stored = {}) {
  const hasCustomImage = Boolean(stored.customBackgroundId);

  return {
    ...defaultSettings,
    customBackgroundId: stored.customBackgroundId || null,
    backgroundMode: ['cover', 'contain', 'repeat'].includes(stored.backgroundMode)
      ? stored.backgroundMode
      : defaultSettings.backgroundMode,
    backgroundPositionY: clamp(Number(stored.backgroundPositionY ?? 50), 0, 100),
    // Preserve the appearance of settings saved before layered backgrounds existed.
    imageEnabled: stored.imageEnabled ?? (stored.backgroundType === 'custom' && hasCustomImage),
    imageOpacity: clamp(Number(stored.imageOpacity ?? 1), 0, 1),
    gradientEnabled: stored.gradientEnabled ?? stored.backgroundType !== 'custom',
    gradientOpacity: clamp(Number(stored.gradientOpacity ?? 1), 0, 1),
    bgOpacity: clamp(Number(stored.bgOpacity ?? defaultSettings.bgOpacity), 0, 1),
    blurAmount: clamp(Number(stored.blurAmount ?? 0), 0, 20)
  };
}

export function BackgroundProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(normalizeSettings(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('读取背景设置失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('保存背景设置失败:', error);
      }
    }
  }, [settings, isLoading]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const setCustomBackgroundId = (id) => {
    setSettings(prev => ({
      ...prev,
      customBackgroundId: id,
      imageEnabled: Boolean(id)
    }));
  };

  const setBackgroundMode = (mode) => updateSetting('backgroundMode', mode);
  const setBackgroundPositionY = (position) => updateSetting('backgroundPositionY', clamp(Number(position), 0, 100));
  const setImageEnabled = (enabled) => updateSetting('imageEnabled', Boolean(enabled));
  const setImageOpacity = (opacity) => updateSetting('imageOpacity', clamp(Number(opacity), 0, 1));
  const setGradientEnabled = (enabled) => updateSetting('gradientEnabled', Boolean(enabled));
  const setGradientOpacity = (opacity) => updateSetting('gradientOpacity', clamp(Number(opacity), 0, 1));
  const setBgOpacity = (opacity) => updateSetting('bgOpacity', clamp(Number(opacity), 0, 1));
  const setBlurAmount = (amount) => updateSetting('blurAmount', clamp(Number(amount), 0, 20));

  const setBackgroundConfig = (config) => {
    setSettings(prev => normalizeSettings({ ...prev, ...config }));
  };

  const clearCustomBackground = () => {
    setSettings(prev => ({
      ...prev,
      customBackgroundId: null,
      imageEnabled: false,
      imageOpacity: 1,
      backgroundPositionY: 50,
      blurAmount: 0
    }));
  };

  const resetToDefaults = () => setSettings(defaultSettings);

  const value = {
    ...settings,
    isLoading,
    setCustomBackgroundId,
    setBackgroundMode,
    setBackgroundPositionY,
    setImageEnabled,
    setImageOpacity,
    setGradientEnabled,
    setGradientOpacity,
    setBgOpacity,
    setBlurAmount,
    setBackgroundConfig,
    clearCustomBackground,
    resetToDefaults
  };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within BackgroundProvider');
  }
  return context;
}

export default BackgroundContext;
