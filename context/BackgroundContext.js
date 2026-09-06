import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const BackgroundContext = createContext();

const STORAGE_KEY = 'timepulse_background_settings';

const defaultSettings = {
  backgroundType: 'gradient', // 'gradient' | 'custom'
  customBackgroundId: null,
  backgroundMode: 'cover', // 'cover' | 'contain' | 'repeat'
  bgOpacity: 0.3,
  blurAmount: 0 // 高斯模糊程度 (0-20px)
};

/**
 * 背景状态管理 Context Provider
 */
export function BackgroundProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：从 localStorage 读取设置
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({
          ...prev,
          ...parsed
        }));
      }
    } catch (error) {
      console.error('读取背景设置失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存设置到 localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('保存背景设置失败:', error);
      }
    }
  }, [settings, isLoading]);

  /**
   * 设置背景类型
   */
  const setBackgroundType = (type) => {
    setSettings(prev => ({
      ...prev,
      backgroundType: type
    }));
  };

  /**
   * 设置自定义背景 ID
   */
  const setCustomBackgroundId = (id) => {
    setSettings(prev => ({
      ...prev,
      customBackgroundId: id,
      backgroundType: id ? 'custom' : 'gradient'
    }));
  };

  /**
   * 设置背景模式
   */
  const setBackgroundMode = (mode) => {
    setSettings(prev => ({
      ...prev,
      backgroundMode: mode
    }));
  };

  /**
   * 设置背景遮罩透明度
   */
  const setBgOpacity = (opacity) => {
    setSettings(prev => ({
      ...prev,
      bgOpacity: opacity
    }));
  };

  /**
   * 设置背景模糊程度
   */
  const setBlurAmount = (amount) => {
    setSettings(prev => ({
      ...prev,
      blurAmount: amount
    }));
  };

  /**
   * 设置完整的背景配置
   */
  const setBackgroundConfig = (config) => {
    setSettings(prev => ({
      ...prev,
      ...config
    }));
  };

  /**
   * 清除自定义背景，恢复默认渐变背景
   */
  const clearCustomBackground = () => {
    setSettings({
      ...defaultSettings,
      backgroundMode: settings.backgroundMode,
      bgOpacity: settings.bgOpacity
    });
  };

  /**
   * 恢复默认设置
   */
  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  const value = {
    // 状态
    backgroundType: settings.backgroundType,
    customBackgroundId: settings.customBackgroundId,
    backgroundMode: settings.backgroundMode,
    bgOpacity: settings.bgOpacity,
    blurAmount: settings.blurAmount,
    isLoading,

    // 方法
    setBackgroundType,
    setCustomBackgroundId,
    setBackgroundMode,
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

/**
 * 使用背景 Context 的 Hook
 */
export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within BackgroundProvider');
  }
  return context;
}

export default BackgroundContext;
