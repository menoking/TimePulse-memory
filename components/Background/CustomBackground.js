import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackground } from '../../context/BackgroundContext';
import imageStorage from '../../utils/imageStorage';

export default function CustomBackground() {
  const { customBackgroundId, backgroundMode, bgOpacity, blurAmount } = useBackground();
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!customBackgroundId) {
      setImageUrl(null);
      setIsLoading(false);
      return;
    }

    const loadImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const imageData = await imageStorage.getImage(customBackgroundId);
        if (imageData) {
          setImageUrl(imageData.url);
        } else {
          setError('未找到背景图片');
        }
      } catch (err) {
        console.error('加载背景图片失败:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [customBackgroundId]);

  // 背景模式对应的样式
  const getBackgroundStyle = () => {
    if (!imageUrl) return {};

    switch (backgroundMode) {
      case 'contain':
        return {
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      case 'repeat':
        return {
          backgroundSize: 'auto',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat'
        };
      case 'cover':
      default:
        return {
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
    }
  };

  if (!customBackgroundId || isLoading) {
    return null;
  }

  if (error) {
    // 加载失败时返回 null，让 GradientBackground 显示
    return null;
  }

  return (
    <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
      <AnimatePresence>
        {imageUrl && (
          <motion.div
            key={customBackgroundId}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              backgroundImage: `url(${imageUrl})`,
              ...getBackgroundStyle(),
              filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none'
            }}
          />
        )}
      </AnimatePresence>

      {/* 遮罩层 - 确保文字可读性 */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: bgOpacity }}
        transition={{ duration: 0.3 }}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 1)'
        }}
      />
    </div>
  );
}
