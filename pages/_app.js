import { useState, useEffect } from 'react';
import Head from 'next/head';
import { MotionConfig } from 'framer-motion';
import '../styles/globals.css';
import { TimerProvider } from '../context/SupabaseTimerContext';
import { SupabaseAuthProvider } from '../context/SupabaseAuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { BackgroundProvider } from '../context/BackgroundContext';
import { FullscreenProvider } from '../context/FullscreenContext';
import OfflineNotification from '../components/UI/OfflineNotification';
import GlobalNotificationManager from '../components/UI/GlobalNotificationManager';
import { testNotification } from '../utils/notifications';
import notificationManager from '../utils/notificationManager';

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // 页面加载完成后记录日志
    console.log(`TimePulse 初始化完成 - ${new Date().toLocaleString()}`);
    
    // 监听hash变化以支持InsightFlare统计
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    // 监听Service Worker控制状态变化
    if ('serviceWorker' in navigator) {
      // 监听控制器变化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker已接管页面，可以发送通知');
      });
    }
    
    // 在开发模式下暴露测试函数到全局
    if (process.env.NODE_ENV === 'development') {
      window.testNotification = testNotification;
      window.notificationManager = notificationManager;
      console.log('已在全局暴露测试函数:');
      console.log('- window.testNotification() - 测试基础通知功能');
      console.log('- window.notificationManager - 通知管理器实例');
    }
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider>
      <BackgroundProvider>
        <FullscreenProvider>
          <SupabaseAuthProvider>
            <TimerProvider>
              <Head>
                <title>TimePulse - 纪念日与时间记录</title>
                <meta name="description" content="记录纪念日、倒计时、秒表与世界时间" />
                <link rel="icon" href="/favicon.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
              </Head>
              <MotionConfig reducedMotion="user">
                <OfflineNotification />
                <GlobalNotificationManager />
                <Component {...pageProps} />
              </MotionConfig>
            </TimerProvider>
          </SupabaseAuthProvider>
        </FullscreenProvider>
      </BackgroundProvider>
    </ThemeProvider>
  );
}

export default MyApp;
