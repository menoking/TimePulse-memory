import { useState, useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import { TimerProvider } from '../context/TimerContext';
import { ThemeProvider } from '../context/ThemeContext';
import { BackgroundProvider } from '../context/BackgroundContext';
import { FullscreenProvider } from '../context/FullscreenContext';
import { getFromRemoteCache } from '../utils/syncService';
import ScrollProgress from '../components/UI/ScrollProgress';
import ScrollHandle from '../components/UI/ScrollHandle';
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
    
    // 检查URL中是否包含syncId参数
    const checkSyncId = async () => {
      const params = new URLSearchParams(window.location.search);
      const syncId = params.get('syncId');
      const syncPass = params.get('syncPass');
      
      if (syncId) {
        // 保存同步ID
        localStorage.setItem('timepulse_sync_id', syncId);
        console.log(`已从URL导入同步ID: ${syncId}`);
        
        // 如果提供了密码，也保存密码并尝试获取数据
        if (syncPass) {
          localStorage.setItem('timepulse_sync_password', syncPass);
          console.log(`已从URL导入同步密码`);
        }
        
        // 清除URL参数但保留其他参数
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete('syncId');
        newParams.delete('syncPass');
        const newUrl = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : '') + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    };
    
    checkSyncId();
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
          <TimerProvider>
            <Head>
              <title>TimePulse - 现代化倒计时</title>
              <meta name="description" content="TimePulse - 一个现代化的倒计时网页应用" />
              <link rel="icon" href="/favicon.ico" />
              <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            </Head>
            <OfflineNotification /> {/* 保留此组件用于监听离线状态 */}
            <GlobalNotificationManager />
            <ScrollProgress />
            <ScrollHandle />
            <Component {...pageProps} />
          </TimerProvider>
        </FullscreenProvider>
      </BackgroundProvider>
    </ThemeProvider>
  );
}

export default MyApp;
