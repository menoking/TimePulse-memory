import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiCloud,
  FiDatabase,
  FiDownloadCloud,
  FiHardDrive,
  FiLogIn,
  FiLogOut,
  FiUploadCloud,
  FiX
} from 'react-icons/fi';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useTimers } from '../../context/SupabaseTimerContext';
import { useTranslation } from '../../hooks/useTranslation';

export default function LoginModal({ onClose }) {
  const { t } = useTranslation();
  const {
    isSupabaseConfigured,
    isAuthLoading,
    isAdmin,
    user,
    signIn,
    signOut
  } = useSupabaseAuth();
  const {
    timers,
    isDirty,
    isPublishing,
    publishError,
    loadError,
    loadErrorCode,
    dataSource,
    publishedVersion,
    publishedAt,
    hasLocalImport,
    localImportCount,
    importLocalTimers,
    publishTimers,
    refreshPublicData
  } = useTimers();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmImport, setConfirmImport] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const run = async (action, successMessage = '') => {
    setIsBusy(true);
    setError('');
    setSuccess('');
    try {
      await action();
      if (successMessage) setSuccess(successMessage);
    } catch (actionError) {
      setError(actionError.message || t('admin.unknownError', '操作失败，请稍后重试。'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogin = event => {
    event.preventDefault();
    run(
      () => signIn(email.trim(), password),
      t('admin.loginSuccess', '管理员登录成功。')
    );
  };

  const handlePublish = () => run(
    publishTimers,
    t('admin.publishSuccess', '发布成功，访客刷新后即可看到最新内容。')
  );

  const handleImport = () => {
    if (!confirmImport) {
      setConfirmImport(true);
      return;
    }
    const imported = importLocalTimers();
    setConfirmImport(false);
    if (imported) setSuccess(t('admin.importSuccess', '本机计时器已导入草稿，请检查后再发布。'));
  };

  const handleRefresh = () => {
    if (isDirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    run(
      () => refreshPublicData({ discardDraft: confirmDiscard }),
      t('admin.refreshSuccess', '已重新加载云端公开版本。')
    );
    setConfirmDiscard(false);
  };

  const disabled = isBusy || isPublishing || isAuthLoading;
  const sourceLabel = t(`admin.sources.${dataSource}`, dataSource);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 18, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 10, scale: 0.98, opacity: 0 }}
        className="glass-card my-4 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-7"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary-500">
              <FiCloud />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                {t('admin.eyebrow', 'Supabase 发布中心')}
              </span>
            </div>
            <h2 className="text-2xl font-semibold">
              {isAdmin ? t('admin.title', '公开计时器管理') : t('admin.loginTitle', '管理员登录')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isAdmin
                ? t('admin.description', '本机编辑保存为草稿，点击发布后访客才会看到变化。')
                : t('admin.loginDescription', '访客无需登录；这里只供站点所有者发布内容。')}
            </p>
          </div>
          <button className="rounded-full p-2 btn-glass-hover" onClick={onClose} aria-label={t('common.close', '关闭')}>
            <FiX className="text-xl" />
          </button>
        </div>

        {!isSupabaseConfigured && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-700 dark:text-amber-300">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{t('admin.notConfigured', 'Supabase 尚未配置')}</p>
                <p className="mt-1 leading-relaxed">
                  {t('admin.notConfiguredHint', '请复制 .env.example 为 .env.local，填写 Project URL 与 Publishable Key，再重新启动或部署。当前应用继续使用本地模式。')}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}
        {(publishError && !error) && (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-600 dark:text-red-300">
            {publishError}
          </div>
        )}
        {(isSupabaseConfigured && loadError && !error && !publishError) && (
          <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-700 dark:text-amber-300">
            {loadErrorCode === 'PGRST205'
              ? t('admin.databaseMissing', 'Supabase 数据表尚未初始化。请先在 SQL Editor 运行项目中的迁移文件。')
              : t('admin.cloudLoadFailed', '暂时无法读取 Supabase，请检查网络和项目配置。')}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <FiCheckCircle className="mt-0.5 shrink-0" />{success}
          </div>
        )}

        {isSupabaseConfigured && !isAdmin && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <label className="block text-sm font-medium">
              {t('admin.email', '管理员邮箱')}
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-white/20 bg-white/15 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-white/10 dark:bg-black/15"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              {t('admin.password', '密码')}
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-white/20 bg-white/15 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-white/10 dark:bg-black/15"
                required
              />
            </label>
            <button type="submit" className="btn-glass-primary flex w-full items-center justify-center gap-2 py-3" disabled={disabled}>
              <FiLogIn />{disabled ? t('common.loading', '加载中...') : t('admin.login', '登录管理')}
            </button>
          </form>
        )}

        {isAdmin && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 dark:bg-black/10">
                <div className="text-xs text-gray-500">{t('admin.currentSource', '当前数据')}</div>
                <div className="mt-1 flex items-center gap-2 font-semibold"><FiDatabase />{sourceLabel}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 dark:bg-black/10">
                <div className="text-xs text-gray-500">{t('admin.timerCount', '计时器数量')}</div>
                <div className="mt-1 text-lg font-semibold">{timers.length}</div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${isDirty ? 'border-amber-400/30 bg-amber-400/10' : 'border-emerald-400/30 bg-emerald-400/10'}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{isDirty ? t('admin.draftPending', '有未发布的更改') : t('admin.published', '当前内容已发布')}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {publishedVersion ? `v${publishedVersion}` : t('admin.neverPublished', '尚未首次发布')}
                    {publishedAt ? ` · ${new Date(publishedAt).toLocaleString()}` : ''}
                  </p>
                </div>
                {isDirty ? <FiHardDrive className="text-amber-500" /> : <FiCheckCircle className="text-emerald-500" />}
              </div>
            </div>

            {hasLocalImport && (
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 dark:bg-black/10">
                <div className="flex items-start gap-3">
                  <FiHardDrive className="mt-1 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">{t('admin.localDataFound', '发现本机旧数据')}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('admin.localDataCount', '当前浏览器中有 {{count}} 个计时器，可导入为发布草稿。').replace('{{count}}', localImportCount)}
                    </p>
                    {confirmImport && <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">{t('admin.importConfirm', '再次点击将用本机旧数据替换当前草稿。')}</p>}
                    <button type="button" className="mt-3 btn-glass-secondary flex items-center gap-2" onClick={handleImport} disabled={disabled}>
                      <FiDownloadCloud />{confirmImport ? t('common.confirm', '确认') : t('admin.importLocal', '导入本机数据')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {confirmDiscard && (
              <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-600 dark:text-red-300">
                {t('admin.discardConfirm', '再次点击“重新加载云端”将永久放弃当前未发布草稿。')}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" className="btn-glass-secondary flex items-center justify-center gap-2 py-3" onClick={handleRefresh} disabled={disabled}>
                <FiDownloadCloud />{t('admin.reloadPublic', '重新加载云端')}
              </button>
              <button type="button" className="btn-glass-primary flex items-center justify-center gap-2 py-3" onClick={handlePublish} disabled={disabled || !timers.length || (!isDirty && Boolean(publishedVersion))}>
                <FiUploadCloud />{isPublishing ? t('admin.publishing', '发布中...') : t('admin.publish', '发布给访客')}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/15 pt-4">
              <span className="max-w-[70%] truncate text-xs text-gray-500">{user?.email}</span>
              <button type="button" className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-red-500" onClick={() => run(signOut)} disabled={disabled}>
                <FiLogOut />{t('admin.logout', '退出管理')}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
