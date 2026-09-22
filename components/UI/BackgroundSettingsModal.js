import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiDroplet,
  FiClock,
  FiEye,
  FiImage,
  FiLayers,
  FiLink,
  FiMonitor,
  FiMove,
  FiTrash2,
  FiUpload,
  FiX
} from 'react-icons/fi';
import { useBackground } from '../../context/BackgroundContext';
import { useTheme } from '../../context/ThemeContext';
import imageStorage from '../../utils/imageStorage';
import { bucketFileSize, track } from '../../utils/analytics';

const hexToRgba = (hex, alpha) => {
  const normalized = hex?.replace('#', '');
  if (!normalized || !/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(14, 165, 233, ${alpha})`;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

function LayerControl({
  icon: Icon,
  title,
  description,
  enabled,
  opacity,
  onEnabledChange,
  onOpacityChange,
  accentColor,
  disabled = false
}) {
  return (
    <div className={`rounded-2xl border border-white/20 bg-white/15 p-4 dark:border-white/10 dark:bg-black/10 ${disabled ? 'opacity-55' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 rounded-xl bg-white/50 p-2 dark:bg-white/10" aria-hidden="true">
            <Icon className="text-lg" />
          </span>
          <div className="min-w-0">
            <div className="font-medium">{title}</div>
            <div className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {description}
            </div>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? '关闭' : '显示'}${title}`}
          disabled={disabled}
          onClick={() => onEnabledChange(!enabled)}
          className="relative h-6 w-11 shrink-0 rounded-full bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed dark:bg-gray-600 dark:focus:ring-offset-gray-900"
          style={enabled && !disabled ? { backgroundColor: accentColor, '--tw-ring-color': accentColor } : { '--tw-ring-color': accentColor }}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={opacity}
          disabled={disabled || !enabled}
          onChange={event => onOpacityChange(parseFloat(event.target.value))}
          aria-label={`${title}透明度`}
          className="h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200 disabled:cursor-not-allowed dark:bg-gray-700"
          style={{ accentColor }}
        />
        <span className="w-11 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {Math.round(opacity * 100)}%
        </span>
      </div>
    </div>
  );
}

export default function BackgroundSettingsModal({ onClose }) {
  const { accentColor } = useTheme();
  const {
    customBackgroundId,
    backgroundMode,
    backgroundPositionY,
    imageEnabled,
    imageOpacity,
    gradientEnabled,
    gradientOpacity,
    timerPanelOpacity,
    bgOpacity,
    blurAmount,
    setBackgroundMode,
    setBackgroundPositionY,
    setImageEnabled,
    setImageOpacity,
    setGradientEnabled,
    setGradientOpacity,
    setTimerPanelOpacity,
    setBgOpacity,
    setBlurAmount,
    setCustomBackgroundId,
    clearCustomBackground
  } = useBackground();

  const [activeTab, setActiveTab] = useState('url');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    const loadPreview = async () => {
      if (!customBackgroundId) {
        setPreviewUrl(null);
        return;
      }

      try {
        const imageData = await imageStorage.getImage(customBackgroundId);
        if (isCurrent) setPreviewUrl(imageData?.url || null);
      } catch (loadError) {
        console.error('加载背景预览失败:', loadError);
        if (isCurrent) setPreviewUrl(null);
      }
    };

    loadPreview();
    return () => { isCurrent = false; };
  }, [customBackgroundId]);

  const handleUrlUpload = async () => {
    if (!imageUrl.trim()) {
      setError('请输入图片 URL');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const id = await imageStorage.saveImageFromUrl(imageUrl.trim());
      setCustomBackgroundId(id);
      setSuccess('背景图片设置成功，可以继续调整显示效果');
      setImageUrl('');
      setActiveTab('preview');
      track('background_set_url');
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const id = await imageStorage.saveImage(file);
      setCustomBackgroundId(id);
      setSuccess('背景图片上传成功，可以继续调整显示效果');
      setActiveTab('preview');
      track('background_set_file', {
        size_bucket: bucketFileSize(file.size),
        mime: file.type || 'unknown'
      });
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleClearBackground = async () => {
    if (customBackgroundId) {
      try {
        await imageStorage.deleteImage(customBackgroundId);
      } catch (deleteError) {
        console.error('删除背景图片失败:', deleteError);
      }
    }

    clearCustomBackground();
    setPreviewUrl(null);
    setSuccess('已清除自定义图片，色块晕染设置保持不变');
    track('background_clear');
  };

  const backgroundModes = [
    { value: 'cover', label: '覆盖', icon: FiMonitor, description: '铺满整个屏幕' },
    { value: 'contain', label: '包含', icon: FiEye, description: '完整显示图片' },
    { value: 'repeat', label: '重复', icon: FiLink, description: '平铺图片' }
  ];

  const imageBackgroundStyle = {
    backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
    backgroundSize: backgroundMode === 'repeat' ? 'auto' : backgroundMode,
    backgroundPosition: backgroundMode === 'cover' ? `center ${backgroundPositionY}%` : 'center',
    backgroundRepeat: backgroundMode === 'repeat' ? 'repeat' : 'no-repeat',
    filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
    transform: blurAmount > 0 ? 'scale(1.04)' : 'none',
    opacity: imageEnabled ? imageOpacity : 0
  };

  const gradientPreviewStyle = {
    background: [
      `radial-gradient(circle at 18% 28%, ${hexToRgba(accentColor, 0.72)} 0%, transparent 43%)`,
      `radial-gradient(circle at 76% 22%, ${hexToRgba(accentColor, 0.44)} 0%, transparent 38%)`,
      'radial-gradient(circle at 62% 82%, rgba(236, 72, 153, 0.34) 0%, transparent 45%)'
    ].join(', '),
    opacity: gradientEnabled ? gradientOpacity : 0
  };

  const adjustPositionWithKeyboard = event => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setBackgroundPositionY(backgroundPositionY - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setBackgroundPositionY(backgroundPositionY + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="glass-card m-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">背景设置</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">组合图片与色块晕染，调整出更适合计时页面的层次</p>
          </div>
          <button type="button" aria-label="关闭背景设置" className="btn-glass-hover cursor-pointer rounded-full p-2" onClick={onClose}>
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2">
          {[
            { id: 'url', label: '图片 URL', icon: FiLink },
            { id: 'file', label: '上传文件', icon: FiUpload },
            { id: 'preview', label: '预览与调整', icon: FiEye }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                className={`rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isActive ? 'text-white' : 'bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20'}`}
                style={isActive ? { backgroundColor: accentColor } : {}}
                onClick={() => {
                  setActiveTab(tab.id);
                  track('background_tab_change', { tab: tab.id });
                }}
              >
                <Icon className="mr-2 inline" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.id === 'preview' ? '调整' : tab.id === 'file' ? '上传' : 'URL'}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4 rounded-xl bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4 rounded-xl bg-green-100 p-3 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'url' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <label htmlFor="background-url" className="mb-2 block text-sm font-medium">图片 URL</label>
              <input
                id="background-url"
                type="url"
                value={imageUrl}
                onChange={event => setImageUrl(event.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm focus:outline-none focus:ring-2 dark:border-white/10 dark:bg-black/10"
                style={{ '--tw-ring-color': accentColor }}
                disabled={isUploading}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">支持 JPEG、PNG、GIF、WebP 格式，请确保图片 URL 支持跨域访问。</p>
            <button type="button" className="w-full cursor-pointer rounded-xl py-3 font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: accentColor }} onClick={handleUrlUpload} disabled={isUploading || !imageUrl.trim()}>
              {isUploading ? '正在加载...' : '设置背景'}
            </button>
          </motion.div>
        )}

        {activeTab === 'file' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500">
              <input id="background-file-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
              <label htmlFor="background-file-input" className="flex cursor-pointer flex-col items-center">
                <FiUpload className="mb-3 text-4xl text-gray-400" />
                <p className="mb-1 text-lg font-medium">点击上传图片</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">支持 JPEG、PNG、GIF、WebP 格式</p>
              </label>
            </div>
            {isUploading && <div className="text-center text-gray-500 dark:text-gray-400">正在上传...</div>}
          </motion.div>
        )}

        {activeTab === 'preview' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <section aria-labelledby="background-preview-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 id="background-preview-title" className="text-sm font-medium">当前背景预览</h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">图层顺序与实际页面一致</p>
                </div>
                {backgroundMode === 'cover' && previewUrl && (
                  <button type="button" onClick={() => setBackgroundPositionY(50)} className="rounded-lg bg-white/20 px-3 py-1.5 text-xs transition-colors hover:bg-white/30 dark:bg-black/15 dark:hover:bg-black/25">
                    恢复居中
                  </button>
                )}
              </div>

              <div className="flex items-stretch gap-3">
                <div className="relative h-52 min-w-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <div className="absolute inset-0 transition-opacity duration-200" style={imageBackgroundStyle} />
                  <div className="absolute inset-0 transition-opacity duration-200" style={gradientPreviewStyle} />
                  <div className="absolute inset-0 bg-black transition-opacity duration-200" style={{ opacity: previewUrl && imageEnabled ? bgOpacity : 0 }} />
                  {!previewUrl && !gradientEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">当前未显示背景图层</div>
                  )}
                  <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-white/55 px-3 py-1 text-xs text-gray-700 shadow-sm backdrop-blur-md dark:bg-black/35 dark:text-gray-200">
                    <FiLayers className="mr-1.5 inline" />
                    图片 · 晕染 · 遮罩
                  </div>
                </div>

                {backgroundMode === 'cover' && previewUrl && (
                  <div className="flex w-12 shrink-0 flex-col items-center rounded-2xl border border-white/20 bg-white/15 py-2 dark:border-white/10 dark:bg-black/10">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">顶部</span>
                    <div className="flex min-h-0 flex-1 items-center justify-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={backgroundPositionY}
                        onChange={event => setBackgroundPositionY(parseInt(event.target.value, 10))}
                        onKeyDown={adjustPositionWithKeyboard}
                        aria-label="背景图片纵向位置"
                        aria-orientation="vertical"
                        aria-valuetext={`${backgroundPositionY}%`}
                        className="h-2 cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                        style={{ width: '8.5rem', transform: 'rotate(90deg)', accentColor }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">底部</span>
                    <span className="mt-1 text-[10px] tabular-nums" style={{ color: accentColor }}>{backgroundPositionY}%</span>
                  </div>
                )}
              </div>
              {backgroundMode === 'cover' && previewUrl && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <FiMove aria-hidden="true" />
                  使用右侧滑块调整图片的纵向取景位置
                </p>
              )}
            </section>

            <section aria-labelledby="background-layers-title">
              <h3 id="background-layers-title" className="mb-3 text-sm font-medium">背景图层</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <LayerControl
                  icon={FiImage}
                  title="自定义图片"
                  description={previewUrl ? '底层图片，可独立调整透明度' : '上传图片后即可启用'}
                  enabled={imageEnabled}
                  opacity={imageOpacity}
                  onEnabledChange={setImageEnabled}
                  onOpacityChange={setImageOpacity}
                  accentColor={accentColor}
                  disabled={!previewUrl}
                />
                <LayerControl
                  icon={FiDroplet}
                  title="色块晕染"
                  description="覆盖在图片上方，保留项目原有氛围"
                  enabled={gradientEnabled}
                  opacity={gradientOpacity}
                  onEnabledChange={setGradientEnabled}
                  onOpacityChange={setGradientOpacity}
                  accentColor={accentColor}
                />
              </div>
            </section>

            <section aria-labelledby="timer-panel-opacity-title" className="rounded-2xl border border-white/20 bg-white/10 p-4 dark:border-white/10 dark:bg-black/10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="rounded-xl bg-white/50 p-2 dark:bg-white/10" aria-hidden="true">
                    <FiClock className="text-lg" />
                  </span>
                  <div>
                    <h3 id="timer-panel-opacity-title" className="text-sm font-medium">计时主面板</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">调整时间数字、标签和自定义句子卡片的背景透明度</p>
                  </div>
                </div>
                <div
                  className="glass-card timer-panel-card shrink-0 rounded-xl px-3 py-2 text-sm font-semibold tabular-nums"
                  style={{
                    color: accentColor,
                    '--timer-panel-light-alpha': timerPanelOpacity,
                    '--timer-panel-dark-alpha': Math.min(timerPanelOpacity * 0.55, 0.55),
                    '--timer-panel-blur': `${Math.round(18 * Math.min(timerPanelOpacity / 0.7, 1))}px`
                  }}
                  aria-hidden="true"
                >
                  12:45
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <input
                  id="timer-panel-opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={timerPanelOpacity}
                  onChange={event => setTimerPanelOpacity(parseFloat(event.target.value))}
                  aria-label="计时主面板背景透明度"
                  className="h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                  style={{ accentColor }}
                />
                <span className="w-11 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">{Math.round(timerPanelOpacity * 100)}%</span>
              </div>
              <div className="mt-1 flex justify-between pr-14 text-xs text-gray-500 dark:text-gray-400"><span>透明</span><span>柔和</span><span>清晰</span></div>
            </section>

            <section aria-labelledby="background-mode-title">
              <h3 id="background-mode-title" className="mb-3 text-sm font-medium">图片显示方式</h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {backgroundModes.map(mode => {
                  const Icon = mode.icon;
                  const isActive = backgroundMode === mode.value;
                  return (
                    <button
                      type="button"
                      key={mode.value}
                      disabled={!previewUrl}
                      className={`rounded-xl border-2 p-3 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-45 sm:p-4 ${isActive ? 'border-current' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}`}
                      style={isActive ? { borderColor: accentColor, color: accentColor } : {}}
                      onClick={() => {
                        setBackgroundMode(mode.value);
                        track('background_mode_change', { mode: mode.value });
                      }}
                    >
                      <Icon className={`mx-auto mb-2 text-xl sm:text-2xl ${isActive ? '' : 'text-gray-400'}`} />
                      <div className="text-sm font-medium">{mode.label}</div>
                      <div className="mt-1 hidden text-xs text-gray-500 dark:text-gray-400 sm:block">{mode.description}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="background-image-adjustments" className={`space-y-5 rounded-2xl border border-white/20 bg-white/10 p-4 dark:border-white/10 dark:bg-black/10 ${!previewUrl ? 'opacity-55' : ''}`}>
              <h3 id="background-image-adjustments" className="text-sm font-medium">图片细节</h3>
              <div>
                <label htmlFor="background-blur" className="mb-3 block text-sm">高斯模糊：{blurAmount}px</label>
                <input id="background-blur" type="range" min="0" max="20" step="1" value={blurAmount} disabled={!previewUrl} onChange={event => setBlurAmount(parseInt(event.target.value, 10))} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 disabled:cursor-not-allowed dark:bg-gray-700" style={{ accentColor }} />
                <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400"><span>清晰</span><span>轻微</span><span>强烈</span></div>
              </div>
              <div>
                <label htmlFor="background-overlay" className="mb-3 block text-sm">深色遮罩：{Math.round(bgOpacity * 100)}%</label>
                <input id="background-overlay" type="range" min="0" max="1" step="0.05" value={bgOpacity} disabled={!previewUrl} onChange={event => setBgOpacity(parseFloat(event.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 disabled:cursor-not-allowed dark:bg-gray-700" style={{ accentColor }} />
                <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400"><span>无遮罩</span><span>适中</span><span>更暗</span></div>
              </div>
            </section>

            <button type="button" disabled={!previewUrl} className="w-full cursor-pointer rounded-xl bg-red-100 py-3 font-medium text-red-600 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50" onClick={handleClearBackground}>
              <FiTrash2 className="mr-2 inline" />
              清除自定义图片
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
