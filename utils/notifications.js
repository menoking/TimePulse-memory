// 存储待处理的通知，用于Service Worker激活前
const pendingNotifications = [];

// 存储用户的通知权限偏好
const NOTIFICATION_PREFERENCE_KEY = 'timepulse_notification_preference';

// 通知翻译缓存
let notificationTranslations = null;

/**
 * 获取当前语言
 * @returns {string} 语言代码
 */
function getCurrentLanguage() {
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
}

/**
 * 加载通知翻译文件
 * @returns {Promise<object>} 翻译对象
 */
async function loadNotificationTranslations() {
  if (notificationTranslations) {
    return notificationTranslations;
  }
  
  try {
    const lang = getCurrentLanguage();
    const locale = lang === 'en-US' ? 'en' : 'zh';
    const response = await fetch(`/locales/${locale}/common.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${locale} translations`);
    }
    const translations = await response.json();
    notificationTranslations = translations;
    return translations;
  } catch (error) {
    console.error('Failed to load notification translations:', error);
    // 返回默认的中文翻译
    return {
      notification: {
        messages: {
          countdownEnded: "倒计时结束",
          countdownEndedBody: "您设置的倒计时\"{title}\"已经结束。",
          testNotification: "通知测试",
          testNotificationBody: "这是一个测试通知，用于验证通知功能是否正常工作。"
        }
      }
    };
  }
}

/**
 * 获取本地化的通知消息
 * @param {string} key - 翻译键
 * @param {object} replacements - 替换变量
 * @returns {Promise<string>} 本地化消息
 */
async function getLocalizedNotificationMessage(key, replacements = {}) {
  const translations = await loadNotificationTranslations();
  
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, pathKey) => {
      return current && current[pathKey] !== undefined ? current[pathKey] : null;
    }, obj);
  };
  
  let message = getNestedValue(translations, key);
  
  if (!message) {
    console.warn(`Translation not found for key: ${key}`);
    return key;
  }
  
  // 替换变量
  Object.keys(replacements).forEach(placeholder => {
    const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
    message = message.replace(regex, replacements[placeholder]);
  });
  
  return message;
}

/**
 * 清除通知翻译缓存（在语言切换时调用）
 */
export function clearNotificationTranslationsCache() {
  notificationTranslations = null;
  console.log('通知翻译缓存已清除');
}

/**
 * 获取用户的通知权限偏好
 * @returns {string} 'allowed' | 'denied' | 'not_set'
 */
export function getNotificationPreference() {
  if (typeof window === 'undefined') return 'not_set';
  return localStorage.getItem(NOTIFICATION_PREFERENCE_KEY) || 'not_set';
}

/**
 * 设置用户的通知权限偏好
 * @param {string} preference 'allowed' | 'denied'
 */
export function setNotificationPreference(preference) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_PREFERENCE_KEY, preference);
}

/**
 * 检查是否应该显示通知权限弹窗
 * @returns {boolean} 是否应该显示弹窗
 */
export function shouldShowNotificationModal() {
  if (!('Notification' in window)) {
    return false;
  }

  const preference = getNotificationPreference();
  
  // 如果用户已经选择了"不再提醒"，则不显示
  if (preference === 'denied') {
    return false;
  }

  // 如果浏览器权限已经是granted，也不需要显示
  if (Notification.permission === 'granted') {
    return false;
  }

  // 如果浏览器权限是denied，也不显示（用户已经在浏览器层面拒绝）
  if (Notification.permission === 'denied') {
    return false;
  }

  // 其他情况（权限为default且用户偏好为not_set或allowed）显示弹窗
  return true;
}

/**
 * 检查通知权限状态
 * @returns {Promise<boolean>} 权限是否已获取
 */
async function checkNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('此浏览器不支持通知');
    return false;
  }

  const permission = Notification.permission;
  console.log('当前通知权限状态:', permission);
  
  return permission === 'granted';
}

/**
 * 请求通知权限（由弹窗组件调用）
 * @returns {Promise<boolean>} 权限是否已获取
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('此浏览器不支持通知');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('请求通知权限失败:', error);
    return false;
  }
}

/**
 * 为倒计时设置通知
 * @param {Object} countdown - 倒计时对象
 * @param {string} countdown.id - 倒计时ID
 * @param {string} countdown.title - 倒计时标题
 * @param {number} countdown.targetTime - 倒计时目标时间戳
 * @param {boolean} skipPermissionCheck - 是否跳过权限检查（当权限已经确认时）
 * @returns {Promise<{success: boolean, needsPermission: boolean}>} 操作结果
 */
export async function scheduleCountdownNotification(countdown, skipPermissionCheck = false) {
  console.log('scheduleCountdownNotification 被调用:', { countdown, skipPermissionCheck });
  
  if (!countdown || !countdown.targetTime || !countdown.title) {
    console.error('无效的倒计时数据:', countdown);
    return { success: false, needsPermission: false };
  }

  // 检查Service Worker API是否可用
  if (!('serviceWorker' in navigator)) {
    console.log('此浏览器不支持Service Worker，无法设置通知');
    return { success: false, needsPermission: false };
  }

  // 如果不跳过权限检查，检查是否需要显示权限弹窗
  if (!skipPermissionCheck && shouldShowNotificationModal()) {
    console.log('需要显示权限弹窗');
    // 派发需要权限的事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('needNotificationPermission', {
        detail: { countdown }
      }));
    }
    return { success: false, needsPermission: true };
  }

  // 检查通知权限
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) {
    console.log('无法设置通知：权限未获取');
    return { success: false, needsPermission: false };
  }

  // 获取本地化的通知消息
  const notificationTitle = await getLocalizedNotificationMessage(
    'notification.messages.countdownEnded'
  );
  const notificationBody = await getLocalizedNotificationMessage(
    'notification.messages.countdownEndedBody',
    { title: countdown.title }
  );

  // 创建通知数据
  const notificationData = {
    action: 'scheduleNotification',
    title: notificationTitle,
    body: notificationBody,
    timestamp: countdown.targetTime,
    id: countdown.id
  };

  console.log('准备发送通知数据到Service Worker:', notificationData);

  // 如果Service Worker已激活，直接发送消息
  if (navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage(notificationData);
      console.log('已设置倒计时通知:', countdown.title);
      return { success: true, needsPermission: false };
    } catch (error) {
      console.error('发送消息到Service Worker失败:', error);
      return { success: false, needsPermission: false };
    }
  }

  // 如果Service Worker尚未激活，将通知加入等待队列
  console.log('Service Worker未激活，将通知加入等待队列');
  pendingNotifications.push(notificationData);
  
  // 监听Service Worker控制状态变化
  navigator.serviceWorker.ready.then(registration => {
    // 使用一次性控制器状态检查
    const checkController = () => {
      if (navigator.serviceWorker.controller) {
        // Service Worker已激活，发送所有待处理通知
        while (pendingNotifications.length > 0) {
          const notification = pendingNotifications.shift();
          navigator.serviceWorker.controller.postMessage(notification);
          console.log('已从等待队列发送通知:', notification.title);
        }
      } else {
        // 继续等待Service Worker激活
        console.log('Service Worker仍未激活，继续等待...');
        setTimeout(checkController, 500);
      }
    };
    
    // 开始检查
    checkController();
  }).catch(error => {
    console.error('Service Worker ready 错误:', error);
  });

  return { success: true, needsPermission: false };
}

/**
 * 取消已设置的倒计时通知
 * @param {string} countdownId - 倒计时ID
 */
export function cancelCountdownNotification(countdownId) {
  console.log('取消通知:', countdownId);
  
  if ('serviceWorker' in navigator) {
    // 通知Service Worker取消定时器
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        action: 'cancelNotification',
        id: countdownId
      });
    }
    
    // 同时清理已显示的通知
    navigator.serviceWorker.ready.then(registration => {
      registration.getNotifications({ tag: countdownId }).then(notifications => {
        notifications.forEach(notification => {
          notification.close();
          console.log('已关闭通知:', countdownId);
        });
      });
    });
  }
}

/**
 * 测试通知功能
 * @returns {Promise<boolean>} 测试是否成功
 */
export async function testNotification() {
  console.log('开始测试通知功能...');
  
  // 检查浏览器支持
  if (!('Notification' in window)) {
    console.error('浏览器不支持通知');
    return false;
  }
  
  // 检查权限
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error('用户拒绝了通知权限');
      return false;
    }
  }
  
  // 发送测试通知
  try {
    // 获取本地化的测试通知消息
    const testTitle = await getLocalizedNotificationMessage(
      'notification.messages.testNotification'
    );
    const testBody = await getLocalizedNotificationMessage(
      'notification.messages.testNotificationBody'
    );
    
    const testCountdown = {
      id: 'test-' + Date.now(),
      title: testTitle,
      targetTime: Date.now() + 1000 // 1秒后触发
    };
    
    // 创建通知数据（跳过标题处理，直接使用测试消息）
    const notificationData = {
      action: 'scheduleNotification',
      title: testTitle,
      body: testBody,
      timestamp: testCountdown.targetTime,
      id: testCountdown.id
    };
    
    // 直接发送到 Service Worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(notificationData);
      console.log('测试通知已发送');
      return true;
    } else {
      console.error('Service Worker未激活');
      return false;
    }
  } catch (error) {
    console.error('测试通知失败:', error);
    return false;
  }
}
