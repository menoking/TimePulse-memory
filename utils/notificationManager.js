/**
 * 通知管理器 - 处理多语言通知的统一管理
 */

import { 
  scheduleCountdownNotification, 
  cancelCountdownNotification,
  clearNotificationTranslationsCache 
} from './notifications';

class NotificationManager {
  constructor() {
    this.activeNotifications = new Map(); // 存储活跃的通知
    this.currentLanguage = null;
    this.init();
  }

  /**
   * 初始化通知管理器
   */
  init() {
    this.currentLanguage = this.getCurrentLanguage();
    
    // 监听语言变化
    if (typeof window !== 'undefined') {
      // 监听URL变化以检测语言切换
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      const handleStateChange = () => {
        const newLanguage = this.getCurrentLanguage();
        if (newLanguage !== this.currentLanguage) {
          this.handleLanguageChange(newLanguage);
        }
      };
      
      history.pushState = function(...args) {
        originalPushState.apply(this, args);
        handleStateChange();
      };
      
      history.replaceState = function(...args) {
        originalReplaceState.apply(this, args);
        handleStateChange();
      };
      
      window.addEventListener('popstate', handleStateChange);
    }
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage() {
    if (typeof window === 'undefined') return 'zh-CN';
    
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam) {
      if (langParam === 'en-US') return 'en-US';
      if (langParam === 'zh-CN') return 'zh-CN';
    }
    
    return 'zh-CN';
  }

  /**
   * 处理语言变化
   */
  handleLanguageChange(newLanguage) {
    console.log(`Language changed from ${this.currentLanguage} to ${newLanguage}`);
    
    // 清除翻译缓存
    clearNotificationTranslationsCache();
    
    // 更新所有活跃的通知
    this.updateActiveNotifications();
    
    this.currentLanguage = newLanguage;
  }

  /**
   * 更新所有活跃的通知
   */
  async updateActiveNotifications() {
    const notifications = Array.from(this.activeNotifications.values());
    
    for (const notification of notifications) {
      try {
        // 取消旧通知
        cancelCountdownNotification(notification.id);
        
        // 重新设置通知（会使用新语言）
        await scheduleCountdownNotification(notification, true);
        
        console.log(`Updated notification for ${notification.title} with new language`);
      } catch (error) {
        console.error(`Failed to update notification ${notification.id}:`, error);
      }
    }
  }

  /**
   * 添加通知
   */
  async addNotification(countdown, skipPermissionCheck = false) {
    try {
      const result = await scheduleCountdownNotification(countdown, skipPermissionCheck);
      
      if (result.success) {
        // 存储通知信息以便后续管理
        this.activeNotifications.set(countdown.id, {
          id: countdown.id,
          title: countdown.title,
          targetTime: countdown.targetTime
        });
        
        console.log(`Notification added and tracked: ${countdown.title}`);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to add notification:', error);
      return { success: false, needsPermission: false };
    }
  }

  /**
   * 移除通知
   */
  removeNotification(countdownId) {
    cancelCountdownNotification(countdownId);
    this.activeNotifications.delete(countdownId);
    console.log(`Notification removed: ${countdownId}`);
  }

  /**
   * 清除所有通知
   */
  clearAllNotifications() {
    for (const notificationId of this.activeNotifications.keys()) {
      cancelCountdownNotification(notificationId);
    }
    this.activeNotifications.clear();
    console.log('All notifications cleared');
  }

  /**
   * 获取活跃通知列表
   */
  getActiveNotifications() {
    return Array.from(this.activeNotifications.values());
  }
}

// 创建全局实例
const notificationManager = new NotificationManager();

export default notificationManager;

// 导出便捷方法
export const addNotification = (countdown, skipPermissionCheck) => 
  notificationManager.addNotification(countdown, skipPermissionCheck);

export const removeNotification = (countdownId) => 
  notificationManager.removeNotification(countdownId);

export const clearAllNotifications = () => 
  notificationManager.clearAllNotifications();

export const getActiveNotifications = () => 
  notificationManager.getActiveNotifications();
