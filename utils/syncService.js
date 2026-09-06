/**
 * 同步服务 - 与远程缓存API交互
 */

const API_URL = 'https://cache.ravelloh.top/api';

/**
 * 检查网络连接状态
 * @returns {boolean} 是否在线
 */
const checkOnlineStatus = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

/**
 * 保存数据到远程缓存
 * @param {string} uuid - 同步ID
 * @param {string} password - 密码
 * @param {Object} data - 要保存的数据
 * @param {number} expiredTime - 过期时间(毫秒)
 * @returns {Promise} 响应结果
 */
export async function saveToRemoteCache(uuid, password, data, expiredTime = 30 * 24 * 60 * 60 * 1000) {
  // 首先检查网络状态
  if (!checkOnlineStatus()) {
    throw new Error('您当前处于离线状态，无法同步数据');
  }
  
  try {
    const response = await fetch(`${API_URL}?mode=set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: JSON.stringify(data),
        password,
        safeIP: '*.*.*.*', // 允许所有IP访问
        expiredTime,
        uuid
      })
    });

    if (!response.ok) {
      throw new Error(`API响应错误: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('保存数据到远程缓存失败:', error);
    throw error;
  }
}

/**
 * 从远程缓存获取数据
 * @param {string} uuid - 同步ID
 * @param {string} password - 密码
 * @param {boolean} shouldDelete - 读取后是否删除
 * @returns {Promise} 响应结果
 */
export async function getFromRemoteCache(uuid, password, shouldDelete = false) {
  // 首先检查网络状态
  if (!checkOnlineStatus()) {
    throw new Error('您当前处于离线状态，无法获取远程数据');
  }
  
  try {
    const response = await fetch(`${API_URL}?mode=get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uuid,
        password,
        shouldDelete
      })
    });

    if (!response.ok) {
      throw new Error(`API响应错误: ${response.status}`);
    }

    const result = await response.json();
    
    // 检查API返回状态
    if (result.status === "success" || result.code === 200) {
      try {
        // API返回成功但没有数据
        if (!result.data) {
          throw new Error('同步ID不存在或无法访问');
        }
        
        // 尝试解析数据 - 处理嵌套JSON字符串情况
        let parsedData;
        if (typeof result.data === 'string') {
          parsedData = JSON.parse(result.data);
        } else {
          parsedData = result.data;
        }
        
        return parsedData;
      } catch (parseError) {
        // 如果解析失败但API返回成功，可能是数据格式问题
        console.error('解析远程数据失败:', parseError);
        throw new Error('数据格式错误，无法解析');
      }
    } else {
      throw new Error(result.message || '获取数据失败');
    }
  } catch (error) {
    console.error('从远程缓存获取数据失败:', error);
    throw error;
  }
}
