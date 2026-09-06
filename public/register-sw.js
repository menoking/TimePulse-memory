// 检查浏览器是否支持Service Worker
if ('serviceWorker' in navigator) {
  let registration;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        registration = reg;
        console.log('ServiceWorker 注册成功:', registration.scope);

        // 监听 Service Worker 更新
        // 这是检测新版本的正确方式
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 有新版本的 Service Worker 等待激活
                console.log(`${new Date().toLocaleTimeString()} | [PWA] 发现新版本，提示用户刷新`);
                window.dispatchEvent(new CustomEvent('cacheUpdatedWithChanges', {
                  detail: {
                    hasUpdates: true,
                    timestamp: Date.now()
                  }
                }));
              }
            });
          }
        });
      })
      .catch(error => {
        console.error('ServiceWorker 注册失败:', error);
      });

    // 监听从SW发来的消息（保留用于其他功能，如通知）
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.action === 'cacheUpdated') {
        console.log('缓存已更新：', new Date(event.data.timestamp).toLocaleString());
        window.dispatchEvent(new CustomEvent('cacheUpdated', { detail: event.data }));
      }
    });
  });

  // 处理在线状态变化
  window.addEventListener('online', () => {
    console.log('网络已恢复连接，正在更新缓存...');
    // 如果Service Worker已激活，发送更新缓存的消息
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        action: 'updateCache'
      });

      // 触发自定义事件，通知应用恢复在线状态
      window.dispatchEvent(new CustomEvent('appOnline'));
    }
  });
}

// 手动更新缓存的辅助函数
window.updateServiceWorkerCache = function() {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      action: 'updateCache'
    });
    return true;
  }
  return false;
};
