import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiChevronRight, FiX } from 'react-icons/fi';
import { useTranslation } from '../../hooks/useTranslation';

export default function StopwatchStopConfirmModal({ onClose, onConfirm, timerColor }) {
  const { t } = useTranslation();
  const [sliderValue, setSliderValue] = useState(0);

  const handleSliderChange = (event) => {
    const nextValue = Number(event.target.value);
    setSliderValue(nextValue);
    if (nextValue >= 100) {
      onConfirm();
    }
  };

  const resetIncompleteSlide = () => {
    if (sliderValue < 100) setSliderValue(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        className="glass-card w-full max-w-md p-6 rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 rounded-full bg-red-500/10 text-red-500">
              <FiAlertTriangle className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {t('stopConfirm.title', '确认停止并清零？')}
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('stopConfirm.description', '停止后计时将归零，全部分段记录也会被清除。')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
            aria-label={t('common.close', '关闭')}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="mt-7">
          <div className="relative h-14 rounded-full overflow-hidden border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10">
            <div
              className="absolute inset-0 origin-left transition-transform duration-75"
              style={{ transform: `scaleX(${sliderValue / 100})`, backgroundColor: `${timerColor || '#ef4444'}30` }}
            />
            <div className="absolute inset-0 flex items-center justify-center px-16 pointer-events-none text-sm font-medium text-gray-600 dark:text-gray-300">
              {t('stopConfirm.slide', '向右滑动以确认清零')}
              <FiChevronRight className="ml-1" />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={handleSliderChange}
              onMouseUp={resetIncompleteSlide}
              onTouchEnd={resetIncompleteSlide}
              onKeyUp={resetIncompleteSlide}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing opacity-70"
              style={{ accentColor: timerColor || '#ef4444' }}
              aria-label={t('stopConfirm.slide', '向右滑动以确认清零')}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" className="btn-glass-secondary" onClick={onClose}>
            {t('common.cancel', '取消')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
