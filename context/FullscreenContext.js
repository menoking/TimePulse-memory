import { createContext, useContext, useState, useEffect } from 'react';

const FullscreenContext = createContext();

const STORAGE_KEY = 'timepulse_fullscreen_settings';

const defaultSettings = {
  headerHideDelay: 3000, // 3秒后隐藏
  fontSize: {
    timer: 'medium', // 'small' | 'medium' | 'large'
    label: 'medium'
  }
};

/**
 * 全屏状态管理 Context Provider
 */
export function FullscreenProvider({ children }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
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
      console.error('读取全屏设置失败:', error);
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
        console.error('保存全屏设置失败:', error);
      }
    }
  }, [settings, isLoading]);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreen = !!document.fullscreenElement;
      setIsFullscreen(fullscreen);

      // 进入全屏时显示 Header，退出全屏时也显示 Header
      if (fullscreen) {
        setIsHeaderVisible(true);
      } else {
        setIsHeaderVisible(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // 初始化全屏状态
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  /**
   * 设置顶部栏隐藏延迟
   */
  const setHeaderHideDelay = (delay) => {
    setSettings(prev => ({
      ...prev,
      headerHideDelay: delay
    }));
  };

  /**
   * 设置计时器字体大小
   */
  const setTimerFontSize = (size) => {
    setSettings(prev => ({
      ...prev,
      fontSize: {
        ...prev.fontSize,
        timer: size
      }
    }));
  };

  /**
   * 设置标签字体大小
   */
  const setLabelFontSize = (size) => {
    setSettings(prev => ({
      ...prev,
      fontSize: {
        ...prev.fontSize,
        label: size
      }
    }));
  };

  /**
   * 显示顶部栏
   */
  const showHeader = () => {
    setIsHeaderVisible(true);
  };

  /**
   * 隐藏顶部栏
   */
  const hideHeader = () => {
    setIsHeaderVisible(false);
  };

  /**
   * 恢复默认设置
   */
  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  const value = {
    // 状态
    isFullscreen,
    isHeaderVisible,
    headerHideDelay: settings.headerHideDelay,
    timerFontSize: settings.fontSize.timer,
    labelFontSize: settings.fontSize.label,
    isLoading,

    // 方法
    setHeaderHideDelay,
    setTimerFontSize,
    setLabelFontSize,
    showHeader,
    hideHeader,
    resetToDefaults
  };

  return (
    <FullscreenContext.Provider value={value}>
      {children}
    </FullscreenContext.Provider>
  );
}

/**
 * 使用全屏 Context 的 Hook
 */
export function useFullscreen() {
  const context = useContext(FullscreenContext);
  if (!context) {
    throw new Error('useFullscreen must be used within FullscreenProvider');
  }
  return context;
}

export default FullscreenContext;
