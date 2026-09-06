/**
 * IndexedDB 图片存储工具
 * 用于存储自定义背景图片
 */

const DB_NAME = 'TimePulseDB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_backgrounds';

class ImageStorage {
  constructor() {
    this.db = null;
  }

  /**
   * 初始化数据库
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('无法打开 IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  /**
   * 确保 DB 已初始化
   */
  async ensureDB() {
    if (!this.db) {
      await this.initDB();
    }
  }

  /**
   * 保存图片文件
   * @param {File} file - 图片文件对象
   * @returns {Promise<string>} 图片 ID
   */
  async saveImage(file) {
    await this.ensureDB();

    // 不限制文件大小（因为存储在本地 IndexedDB）

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('只支持 JPEG、PNG、GIF 和 WebP 格式的图片');
    }

    // 获取图片尺寸
    const dimensions = await this.getImageDimensions(file);

    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const imageData = {
      id,
      type: 'file',
      url: URL.createObjectURL(file),
      blob: file,
      metadata: {
        size: file.size,
        mimeType: file.type,
        width: dimensions.width,
        height: dimensions.height,
        uploadedAt: new Date().toISOString(),
        name: file.name
      }
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.add(imageData);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('保存图片失败'));
    });
  }

  /**
   * 从 URL 下载并保存图片
   * @param {string} url - 图片 URL
   * @returns {Promise<string>} 图片 ID
   */
  async saveImageFromUrl(url) {
    await this.ensureDB();

    try {
      // 下载图片
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`下载图片失败: ${response.status}`);
      }

      const blob = await response.blob();

      // 不限制文件大小（因为存储在本地 IndexedDB）

      // 验证文件类型
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(blob.type)) {
        throw new Error('只支持 JPEG、PNG、GIF 和 WebP 格式的图片');
      }

      // 获取图片尺寸
      const dimensions = await this.getImageDimensions(blob);

      const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const imageData = {
        id,
        type: 'url',
        url: url,
        blob: blob,
        metadata: {
          size: blob.size,
          mimeType: blob.type,
          width: dimensions.width,
          height: dimensions.height,
          uploadedAt: new Date().toISOString()
        }
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.add(imageData);

        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(new Error('保存图片失败'));
      });
    } catch (error) {
      throw new Error(`从 URL 保存图片失败: ${error.message}`);
    }
  }

  /**
   * 获取图片
   * @param {string} id - 图片 ID
   * @returns {Promise<Object|null>} 图片数据
   */
  async getImage(id) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // 如果是 file 类型，重新创建 blob URL
          if (result.type === 'file' && result.blob) {
            result.url = URL.createObjectURL(result.blob);
          }
        }
        resolve(result || null);
      };
      request.onerror = () => reject(new Error('获取图片失败'));
    });
  }

  /**
   * 获取所有图片
   * @returns {Promise<Array>} 所有图片数据
   */
  async getAllImages() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const results = request.result.map(img => {
          // 如果是 file 类型，重新创建 blob URL
          if (img.type === 'file' && img.blob) {
            img.url = URL.createObjectURL(img.blob);
          }
          return img;
        });
        resolve(results);
      };
      request.onerror = () => reject(new Error('获取图片列表失败'));
    });
  }

  /**
   * 删除图片
   * @param {string} id - 图片 ID
   * @returns {Promise<void>}
   */
  async deleteImage(id) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('删除图片失败'));
    });
  }

  /**
   * 清空所有图片
   * @returns {Promise<void>}
   */
  async clearAll() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('清空图片失败'));
    });
  }

  /**
   * 获取图片尺寸
   * @param {File|Blob} file - 图片文件
   * @returns {Promise<Object>} { width, height }
   */
  getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('无法读取图片尺寸'));
      };

      img.src = url;
    });
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// 导出单例
const imageStorage = new ImageStorage();
export default imageStorage;
