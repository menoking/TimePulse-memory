import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2, FiX } from 'react-icons/fi';
import { useTranslation } from '../../hooks/useTranslation';

export default function LapTimesModal({ onClose, laps, timerColor, onRenameLap, onDeleteLap, readOnly = false }) {
  const { t, currentLang } = useTranslation();
  const [draftLabels, setDraftLabels] = useState({});

  useEffect(() => {
    setDraftLabels((previous) => (laps || []).reduce((next, lap) => {
      next[lap.id] = previous[lap.id] ?? lap.label ?? '';
      return next;
    }, {}));
  }, [laps]);

  const saveLabel = (lap) => {
    const label = (draftLabels[lap.id] || '').trim();
    if (label !== (lap.label || '')) {
      onRenameLap?.(lap.id, label);
    }
  };

  // Format milliseconds to time string
  const formatTimeFromMs = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const formatNumber = (num) => num.toString().padStart(2, '0');
    
    if (hours > 0) {
      return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
    }
    return `${formatNumber(minutes)}:${formatNumber(seconds)}`;
  };

  if (!laps || laps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto py-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card w-full max-w-md m-4 p-6 rounded-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{t('lap.title')}</h2>
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={onClose}
            >
              <FiX className="text-xl" />
            </button>
          </div>
          
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('lap.noLaps')}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              className="btn-glass-secondary"
              onClick={onClose}
            >
              {t('common.close')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto py-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-md m-4 p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold" style={{ color: timerColor }}>
            {t('lap.title')}
          </h2>
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {laps.length} {t('lap.lapTime')}
        </div>

        <div className="space-y-2">
          {laps.slice().reverse().map((lap, index) => {
            const lapNumber = laps.length - index;
            const prevLap = lapNumber > 1 ? laps[lapNumber - 2] : null;
            const intervalMs = prevLap ? lap.elapsedMs - prevLap.elapsedMs : lap.elapsedMs;
            
            return (
              <motion.div
                key={lap.id}
                className="p-3 rounded-lg bg-white/5 dark:bg-black/5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex justify-between items-center gap-3">
                  <span className="font-medium shrink-0" style={{ color: timerColor }}>
                    {currentLang === 'en-US' ? `Lap ${lapNumber}` : `第 ${lapNumber} 段`}
                  </span>
                  <div className="flex space-x-4 text-sm">
                    <div className="text-right">
                      <div className="text-gray-400 text-xs">{t('lap.lapInterval')}</div>
                      <div className="font-mono">{formatTimeFromMs(intervalMs)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400 text-xs">{t('lap.totalTime')}</div>
                      <div className="font-mono">{formatTimeFromMs(lap.elapsedMs)}</div>
                    </div>
                  </div>
                </div>
                {!readOnly && <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={draftLabels[lap.id] || ''}
                    onChange={(event) => setDraftLabels((previous) => ({
                      ...previous,
                      [lap.id]: event.target.value
                    }))}
                    onBlur={() => saveLabel(lap)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur();
                    }}
                    maxLength={50}
                    placeholder={t('lap.labelPlaceholder', '为此分段添加标签')}
                    className="min-w-0 flex-1 px-3 py-2 rounded-lg bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
                    aria-label={t('lap.labelPlaceholder', '为此分段添加标签')}
                  />
                  <button
                    type="button"
                    onClick={() => onDeleteLap?.(lap.id)}
                    className="p-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    title={t('lap.delete', '删除此分段')}
                    aria-label={t('lap.delete', '删除此分段')}
                  >
                    <FiTrash2 />
                  </button>
                </div>}
                {readOnly && lap.label && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{lap.label}</p>}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="btn-glass-secondary"
            onClick={onClose}
          >
            {t('common.close')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
