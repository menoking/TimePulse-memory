import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck, FiChevronDown, FiClock, FiGlobe, FiHeart, FiPlayCircle, FiSliders, FiStar, FiTag, FiTrash2, FiX } from 'react-icons/fi';
import { getAnniversaryTotalDays, getDaysUntil, getNextAnniversary } from '../../utils/anniversaryUtils';
import { useTimers } from '../../context/SupabaseTimerContext';
import { useTranslation } from '../../hooks/useTranslation';

function FilterMenu({ id, label, value, options, icon: Icon, openMenu, setOpenMenu, onChange }) {
  const selected = options.find(option => option.value === value) || options[0];
  const isOpen = openMenu === id;
  return (
    <div className="relative min-w-[190px] flex-1 sm:flex-none">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setOpenMenu(isOpen ? null : id)}
        onKeyDown={event => event.key === 'Escape' && setOpenMenu(null)}
        className="group w-full rounded-2xl border border-white/20 bg-white/35 px-3.5 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-xl transition-colors hover:bg-white/50 active:scale-[0.98] dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/30"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/50 text-gray-600 dark:bg-white/10 dark:text-gray-300"><Icon /></span>
          <span className="min-w-0 flex-1"><span className="block text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</span><span className="block truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{selected.label}</span></span>
          <FiChevronDown className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            role="listbox"
            className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-white/25 bg-white/90 p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-gray-900/90"
          >
            {options.map(option => (
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                key={option.value}
                onClick={() => { onChange(option.value); setOpenMenu(null); }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors active:scale-[0.98] ${option.value === value ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10'}`}
              >
                <span>{option.label}</span>{option.value === value && <FiCheck />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TimerOverviewModal({ onClose }) {
  const { timers, setActiveTimerId, updateTimer, deleteTimer, canEdit } = useTimers();
  const { t } = useTranslation();
  const [sort, setSort] = useState('pinned');
  const [category, setCategory] = useState('all');
  const [openMenu, setOpenMenu] = useState(null);
  const categories = useMemo(() => [...new Set(timers.map(timer => timer.category).filter(Boolean))], [timers]);
  const list = useMemo(() => timers.filter(timer => category === 'all' || timer.category === category).slice().sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'upcoming') {
      const ad = a.type === 'anniversary' ? getDaysUntil(getNextAnniversary(a.startTime, new Date(), a.calendarType)) : 999999;
      const bd = b.type === 'anniversary' ? getDaysUntil(getNextAnniversary(b.startTime, new Date(), b.calendarType)) : 999999;
      return ad - bd;
    }
    return Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)) || new Date(b.createdAt) - new Date(a.createdAt);
  }), [timers, sort, category]);
  const icon = type => ({ anniversary: FiHeart, countdown: FiClock, stopwatch: FiPlayCircle, worldclock: FiGlobe }[type] || FiClock);
  const sortOptions = [
    { value: 'pinned', label: t('overview.sortPinned', '置顶优先') },
    { value: 'upcoming', label: t('overview.sortUpcoming', '最近周年') },
    { value: 'name', label: t('overview.sortName', '按名称') }
  ];
  const categoryOptions = [{ value: 'all', label: t('overview.allCategories', '全部标签') }, ...categories.map(item => ({ value: item, label: item }))];

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] overflow-y-auto bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
    <motion.div initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card mx-auto my-8 max-w-5xl rounded-3xl p-5 sm:p-7" onClick={event => { event.stopPropagation(); if (openMenu && event.target === event.currentTarget) setOpenMenu(null); }}>
      <div className="flex items-center justify-between"><div><h2 className="text-2xl font-semibold">{t('overview.title', '时间总览')}</h2><p className="mt-1 text-sm text-gray-500">{t('overview.subtitle', '把重要时间放在一眼可见的地方')}</p></div><button className="rounded-full p-2 btn-glass-hover" onClick={onClose} aria-label={t('common.close', '关闭')}><FiX /></button></div>
      <div className="my-5 rounded-3xl border border-white/15 bg-white/10 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] dark:bg-black/10">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <FilterMenu id="sort" label={t('overview.sortBy', '排序方式')} value={sort} options={sortOptions} icon={FiSliders} openMenu={openMenu} setOpenMenu={setOpenMenu} onChange={setSort} />
          <FilterMenu id="category" label={t('overview.filterByTag', '标签筛选')} value={category} options={categoryOptions} icon={FiTag} openMenu={openMenu} setOpenMenu={setOpenMenu} onChange={setCategory} />
          <div className="ml-auto flex items-center px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('overview.resultCount', '共 {{count}} 项').replace('{{count}}', list.length)}</div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map(timer => { const Icon = icon(timer.type); const next = timer.type === 'anniversary' ? getNextAnniversary(timer.startTime, new Date(), timer.calendarType) : null; return <motion.article layout key={timer.id} className="cursor-pointer rounded-3xl border border-white/15 bg-white/10 p-5 transition-colors hover:bg-white/20 dark:bg-black/10" onClick={() => { setActiveTimerId(timer.id); onClose(); }}><div className="flex items-start gap-3"><span className="rounded-full p-2" style={{ color: timer.color, backgroundColor: `${timer.color}20` }}><Icon /></span><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{timer.name}</h3><p className="text-xs text-gray-500">{timer.category || t(`timer.${timer.type}`, timer.type)}</p></div>{canEdit && <button className={`p-2 ${timer.isPinned ? 'text-amber-400' : 'text-gray-400'}`} onClick={event => { event.stopPropagation(); updateTimer(timer.id, { isPinned: !timer.isPinned }); }} aria-label={t('overview.pin', '置顶')}><FiStar fill={timer.isPinned ? 'currentColor' : 'none'} /></button>}</div>{timer.type === 'anniversary' ? <div className="mt-5"><div className="text-4xl font-semibold" style={{ color: timer.color }}>{getAnniversaryTotalDays(timer.startTime, new Date(), timer.countRule)}</div><div className="mt-1 text-sm text-gray-500">{t('anniversary.daysTogether', '已走过的天数')}</div><div className="mt-4 flex justify-between text-xs text-gray-500"><span>{new Date(timer.startTime).toLocaleDateString()}</span><span>{t('anniversary.nextIn', '{{days}} 天后周年').replace('{{days}}', getDaysUntil(next))}</span></div></div> : <p className="mt-5 text-sm text-gray-500">{timer.type === 'stopwatch' ? (timer.isRunning ? (timer.customDescription || t('timer.running', '运行中')) : t('timer.paused', '已暂停')) : timer.type === 'worldclock' ? timer.timezone : new Date(timer.targetDate).toLocaleString()}</p>}{canEdit && <div className="mt-3 flex justify-end"><button className="p-2 text-red-400" onClick={event => { event.stopPropagation(); deleteTimer(timer.id); }} aria-label={t('common.delete', '删除')}><FiTrash2 /></button></div>}</motion.article>; })}</div>
      {!list.length && <div className="py-14 text-center"><FiTag className="mx-auto mb-3 text-2xl text-gray-400" /><p className="font-medium">{t('overview.emptyFiltered', '这个标签下还没有计时器')}</p><button className="mt-2 text-sm text-gray-500 underline underline-offset-4" onClick={() => setCategory('all')}>{t('overview.showAll', '查看全部')}</button></div>}
    </motion.div>
  </motion.div>;
}
