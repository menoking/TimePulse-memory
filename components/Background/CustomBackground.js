import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBackground } from '../../context/BackgroundContext';
import imageStorage from '../../utils/imageStorage';

export default function CustomBackground() {
  const {
    customBackgroundId,
    backgroundMode,
    backgroundPositionY,
    imageEnabled,
    imageOpacity,
    blurAmount
  } = useBackground();
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    if (!customBackgroundId) {
      setImageUrl(null);
      setIsLoading(false);
      return () => { isCurrent = false; };
    }

    const loadImage = async () => {
      setIsLoading(true);

      try {
        const imageData = await imageStorage.getImage(customBackgroundId);
        if (isCurrent) {
          setImageUrl(imageData?.url || null);
        }
      } catch (error) {
        console.error('加载背景图片失败:', error);
        if (isCurrent) setImageUrl(null);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadImage();
    return () => { isCurrent = false; };
  }, [customBackgroundId]);

  const getBackgroundStyle = () => {
    if (backgroundMode === 'contain') {
      return {
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }

    if (backgroundMode === 'repeat') {
      return {
        backgroundSize: 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat'
      };
    }

    return {
      backgroundSize: 'cover',
      backgroundPosition: `center ${backgroundPositionY}%`,
      backgroundRepeat: 'no-repeat'
    };
  };

  if (!customBackgroundId || isLoading || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <AnimatePresence>
        <motion.div
          key={customBackgroundId}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: imageEnabled ? imageOpacity : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            backgroundImage: `url(${imageUrl})`,
            ...getBackgroundStyle(),
            filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
            transform: blurAmount > 0 ? 'scale(1.04)' : 'none'
          }}
        />
      </AnimatePresence>
    </div>
  );
}
