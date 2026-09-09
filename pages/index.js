import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import GradientBackground from '../components/Background/GradientBackground';
import CustomBackground from '../components/Background/CustomBackground';
import TimerDisplay from '../components/Countdown/TimerDisplay';
import BackgroundSettingsModal from '../components/UI/BackgroundSettingsModal';
import FullscreenSettingsModal from '../components/UI/FullscreenSettingsModal';
import { useTimers } from '../context/TimerContext';
import { useTheme } from '../context/ThemeContext';
import { useFullscreen } from '../context/FullscreenContext';
import { parseShareUrl } from '../utils/shareUtils';

export default function Home() {
  const { timers, activeTimerId, setActiveTimerId, addTimer } = useTimers();
  const { theme, accentColor } = useTheme();
  const { isFullscreen } = useFullscreen();
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
    if (router.query.share) {
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
  }, [router.query.share, addTimer, setActiveTimerId]);

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
        <GradientBackground />
        <CustomBackground />

        <main className={`relative flex flex-col items-center justify-center z-10 ${isFullscreen ? 'min-h-[100dvh]' : 'min-h-[100dvh] py-20'}`}>
          <TimerDisplay />
        </main>
      </Layout>
      
      

      {/* 背景设置弹窗 */}
      <AnimatePresence>
        {isBackgroundSettingsOpen && (
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
