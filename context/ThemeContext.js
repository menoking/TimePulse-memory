import { createContext, useContext, useEffect, useState } from 'react';
import { useTimers } from './TimerContext';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [accentColor, setAccentColor] = useState('#0ea5e9'); // 默认主题色
  
  // 初始化主题
  useEffect(() => {
    // 检查本地存储
    const savedTheme = localStorage.getItem('theme');
    // 检查系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 应用主题
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (prefersDark) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
    
    // 检查保存的主题色
    const savedColor = localStorage.getItem('accent-color');
    if (savedColor) {
      setAccentColor(savedColor);
      updateCssVariables(savedColor);
    } else {
      // 如果没有保存的颜色，使用默认主题色并设置CSS变量
      updateCssVariables('#0ea5e9');
    }
  }, []);

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    console.log(`主题已切换到: ${newTheme} - ${new Date().toLocaleString()}`);
  };
  
  // 更新主题色
  const updateAccentColor = (color) => {
    if (!color) return;
    
    setAccentColor(color);
    localStorage.setItem('accent-color', color);
    updateCssVariables(color);
  };
  
  // 更新CSS变量
  const updateCssVariables = (color) => {
    // 将hex转为rgb数组
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : [14, 165, 233]; // 默认蓝色
    };
    
    const rgb = hexToRgb(color);
    document.documentElement.style.setProperty('--color-primary', rgb.join(', '));
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      accentColor, 
      updateAccentColor 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// 颜色同步器组件 - 只在活动计时器ID变化时更新主题色
export function ThemeColorSynchronizer({ children }) {
  const { getActiveTimer, activeTimerId } = useTimers();
  const { updateAccentColor } = useTheme();
  
  // 使用activeTimerId作为依赖项，只在计时器切换时更新主题色
  useEffect(() => {
    const activeTimer = getActiveTimer();
    if (activeTimer && activeTimer.color) {
      updateAccentColor(activeTimer.color);
    }
  }, [activeTimerId, getActiveTimer, updateAccentColor]);
  
  return <>{children}</>;
}
