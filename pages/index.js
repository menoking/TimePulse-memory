import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import GradientBackground from '../components/Background/GradientBackground';
import CustomBackground from '../components/Background/CustomBackground';
import TimerDisplay from '../components/Countdown/TimerDisplay';
import AddTimerModal from '../components/UI/AddTimerModal';
import AddStopwatchModal from '../components/UI/AddStopwatchModal';
import AddWorldClockModal from '../components/UI/AddWorldClockModal';
import TimerTypeModal from '../components/UI/TimerTypeModal';
import LoginModal from '../components/UI/LoginModal';
import BackgroundSettingsModal from '../components/UI/BackgroundSettingsModal';
import FullscreenSettingsModal from '../components/UI/FullscreenSettingsModal';
import { useTimers } from '../context/TimerContext';
import { useTheme } from '../context/ThemeContext';
import { useFullscreen } from '../context/FullscreenContext';
import { useTranslation } from '../hooks/useTranslation';
import { parseShareUrl } from '../utils/shareUtils';

export default function Home() {
  const { timers, activeTimerId, setActiveTimerId, addTimer } = useTimers();
  const { theme, accentColor } = useTheme();
  const { isFullscreen } = useFullscreen();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTimerTypeModalOpen, setIsTimerTypeModalOpen] = useState(false);
  const [isCountdownModalOpen, setIsCountdownModalOpen] = useState(false);
  const [isStopwatchModalOpen, setIsStopwatchModalOpen] = useState(false);
  const [isWorldClockModalOpen, setIsWorldClockModalOpen] = useState(false);
  const [isBackgroundSettingsOpen, setIsBackgroundSettingsOpen] = useState(false);
  const [isFullscreenSettingsOpen, setIsFullscreenSettingsOpen] = useState(false);
  const [log, setLog] = useState([]);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  
  // 监听滚动事件，检测是否接近底部（与Layout中的逻辑保持一致）
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 与Layout中相同的逻辑：当滚动接近底部时隐藏按钮（调整为更早触发）
      const isNearBottom = scrollPosition + windowHeight >= documentHeight - 300;
      setIsFooterVisible(isNearBottom);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // 添加日志
  const addLog = (message) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // 处理计时器类型选择
  const handleTimerTypeSelect = (type) => {
    setIsTimerTypeModalOpen(false);
    
    switch (type) {
      case 'countdown':
        setIsCountdownModalOpen(true);
        break;
      case 'stopwatch':
        setIsStopwatchModalOpen(true);
        break;
      case 'worldclock':
        setIsWorldClockModalOpen(true);
        break;
    }
  };

  // 关闭所有模态框
  const closeAllModals = () => {
    setIsTimerTypeModalOpen(false);
    setIsCountdownModalOpen(false);
    setIsStopwatchModalOpen(false);
    setIsWorldClockModalOpen(false);
    setIsAddModalOpen(false);
    if (window.location.hash === '#add') {
      window.location.hash = '';
    }
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

        <main className={`relative flex flex-col items-center justify-center z-10 ${isFullscreen ? 'min-h-screen' : 'min-h-screen py-12'}`}>
          <TimerDisplay />
        </main>
      </Layout>
      
      
      {/* 弹窗内容 */}
      <AnimatePresence>
        {isTimerTypeModalOpen && (
          <TimerTypeModal 
            onClose={closeAllModals}
            onSelectType={handleTimerTypeSelect}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCountdownModalOpen && (
          <AddTimerModal onClose={closeAllModals} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStopwatchModalOpen && (
          <AddStopwatchModal onClose={closeAllModals} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isWorldClockModalOpen && (
          <AddWorldClockModal onClose={closeAllModals} />
        )}
      </AnimatePresence>

      {/* 保持原有的旧版兼容 */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddTimerModal onClose={() => {
            setIsAddModalOpen(false);
            if (window.location.hash === '#add') {
              window.location.hash = '';
            }
          }} />
        )}
      </AnimatePresence>
      
      
      {/* 登录弹窗 */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <LoginModal onClose={() => {
            setIsLoginModalOpen(false);
            if (window.location.hash === '#login') {
              window.location.hash = '';
            }
          }} />
        )}
      </AnimatePresence>

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
