import { useState, useEffect } from 'react';

// 获取语言设置
const getLanguage = () => {
  if (typeof window === 'undefined') return 'zh-CN';
  
  // 从 URL 参数获取语言
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  
  if (langParam) {
    if (langParam === 'en-US') return 'en-US';
    if (langParam === 'zh-CN') return 'zh-CN';
  }
  
  // 默认返回中文
  return 'zh-CN';
};

// 加载语言文件
const loadLanguageFile = async (lang) => {
  try {
    const locale = lang === 'en-US' ? 'en' : 'zh';
    const response = await fetch(`/locales/${locale}/common.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${locale} translations`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load language file:', error);
    // 返回默认的中文翻译
    return null;
  }
};

// 获取嵌套对象的值
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

export const useTranslation = () => {
  const [translations, setTranslations] = useState({});
  const [currentLang, setCurrentLang] = useState('zh-CN');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTranslations = async () => {
      const lang = getLanguage();
      setCurrentLang(lang);
      
      const translationData = await loadLanguageFile(lang);
      if (translationData) {
        setTranslations(translationData);
      } else {
        // 如果加载失败，使用默认的中文翻译
        const fallbackData = await loadLanguageFile('zh-CN');
        if (fallbackData) {
          setTranslations(fallbackData);
        }
      }
      
      setIsLoading(false);
    };

    initializeTranslations();
  }, []);

  // t 函数用于翻译文本
  const t = (key, defaultValue = '') => {
    if (isLoading) return defaultValue;
    
    const value = getNestedValue(translations, key);
    return value !== null ? value : (defaultValue || key);
  };

  // 切换语言
  const changeLanguage = (newLang) => {
    const url = new URL(window.location);
    url.searchParams.set('lang', newLang);
    window.location.href = url.toString();
  };

  return {
    t,
    currentLang,
    changeLanguage,
    isLoading
  };
};
