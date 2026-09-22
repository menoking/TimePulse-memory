import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import GradientBackground from '../components/Background/GradientBackground';
import CustomBackground from '../components/Background/CustomBackground';
import BackgroundOverlay from '../components/Background/BackgroundOverlay';
import TimerDisplay from '../components/Countdown/TimerDisplay';
import BackgroundSettingsModal from '../components/UI/BackgroundSettingsModal';
import FullscreenSettingsModal from '../components/UI/FullscreenSettingsModal';
import { useTimers } from '../context/SupabaseTimerContext';
import { useTheme } from '../context/ThemeContext';
import { useFullscreen } from '../context/FullscreenContext';
import { parseShareUrl } from '../utils/shareUtils';
import { useTranslation } from '../hooks/useTranslation';

export default function Home() {
  const {
    timers,
    activeTimerId,
    setActiveTimerId,
    addTimer,
    canEdit,
    isSupabaseConfigured,
    isLoaded,
    hasPublicPage,
    loadError,
    dataSource
  } = useTimers();
  const { theme, accentColor } = useTheme();
  const { isFullscreen } = useFullscreen();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [isBackgroundSettingsOpen, setIsBackgroundSettingsOpen] = useState(false);
  const [isFullscreenSettingsOpen, setIsFullscreenSettingsOpen] = useState(false);
  const [log, setLog] = useState([]);
  // 添加日志
  const addLog = (message) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };


  // 监听URL参数以同步数据
  useEffect(() => {
    if (router.query.share && canEdit) {
      try {
        const sharedData = parseShareUrl(router.query.share);
        if (sharedData.timers && sharedData.timers.length > 0) {
          sharedData.timers.forEach(timer => {
            addTimer(timer);
          });
          setActiveTimerId(sharedData.timers[0].id);
          addLog('已从分享链接导入计时器数据');
        }
      } catch (error) {
        addLog(`解析分享数据错误: ${error.message}`);
      }
    }
  }, [router.query.share, addTimer, canEdit, setActiveTimerId]);

  // 初始化日志
  useEffect(() => {
    addLog('TimePulse 初始化完成');
    addLog(`当前主题: ${theme}`);
    addLog(`加载了 ${timers.length} 个计时器`);
  }, [theme, timers.length]);

  // 监听 hash 变化打开弹窗
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');

      switch (hash) {
        case 'background':
          setIsBackgroundSettingsOpen(true);
          break;
        case 'fullscreen-settings':
          setIsFullscreenSettingsOpen(true);
          break;
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <>
      <Layout>
        <CustomBackground />
        <GradientBackground />
        <BackgroundOverlay />

        <main className={`relative flex flex-col items-center justify-center z-10 ${isFullscreen ? 'min-h-[100dvh]' : 'min-h-[100dvh] py-20'}`}>
          {!isLoaded && (
            <div className="glass-card rounded-3xl px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              {t('publicPage.loading', '正在读取公开计时器…')}
            </div>
          )}
          {isLoaded && isSupabaseConfigured && !hasPublicPage && !canEdit && (
            <div className="glass-card max-w-md rounded-3xl px-7 py-8 text-center">
              <h2 className="text-xl font-semibold">
                {loadError
                  ? t('publicPage.loadFailed', '暂时无法读取公开页面')
                  : t('publicPage.notPublished', '公开页面尚未发布')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {loadError
                  ? t('publicPage.loadFailedHint', '请检查网络连接并稍后刷新；管理员也可以检查 Supabase 配置。')
                  : t('publicPage.notPublishedHint', '站点所有者完成首次发布后，计时器会显示在这里。')}
              </p>
            </div>
          )}
          {isLoaded && (!isSupabaseConfigured || hasPublicPage || canEdit) && <TimerDisplay />}
          {loadError && dataSource === 'cache' && (
            <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full border border-amber-400/20 bg-amber-50/85 px-4 py-2 text-xs text-amber-700 shadow-lg backdrop-blur-xl dark:bg-amber-950/75 dark:text-amber-200">
              {t('publicPage.cached', '云端暂时不可用，当前显示上次缓存')}
            </div>
          )}
        </main>
      </Layout>
      
      

      {/* 背景设置弹窗 */}
      <AnimatePresence>
        {isBackgroundSettingsOpen && canEdit && (
          <BackgroundSettingsModal onClose={() => {
            setIsBackgroundSettingsOpen(false);
            if (window.location.hash === '#background') {
              window.location.hash = '';
            }
          }} />
        )}
      </AnimatePresence>

      {/* 全屏设置弹窗 */}
      <AnimatePresence>
        {isFullscreenSettingsOpen && (
          <FullscreenSettingsModal onClose={() => {
            setIsFullscreenSettingsOpen(false);
            if (window.location.hash === '#fullscreen-settings') {
              window.location.hash = '';
            }
          }} />
        )}
      </AnimatePresence>
    </>
  );
}
