import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiHeart, FiMessageCircle } from 'react-icons/fi';
import { useTimers } from '../../context/TimerContext';
import { useTranslation } from '../../hooks/useTranslation';

const localDateTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function AddAnniversaryModal({ onClose }) {
  const { addTimer } = useTimers();
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', customDescription: '', startTime: localDateTime(), displayMode: 'totalDays', countRule: 'elapsed', calendarType: 'solar', color: '#f43f5e', category: '', isPinned: true, annualReminder: false, reminderAdvanceDays: 0, milestoneDays: '100, 500, 1000' });
  const [error, setError] = useState('');
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = event => {
    event.preventDefault();
    const start = new Date(form.startTime);
    if (!form.name.trim()) return setError(t('anniversary.nameRequired', '请输入纪念日名称'));
    if (Number.isNaN(start.getTime()) || start > new Date()) return setError(t('anniversary.pastRequired', '开始时间必须有效且不能晚于现在'));
    addTimer({ type: 'anniversary', name: form.name.trim(), customDescription: form.customDescription.trim(), startTime: start.toISOString(), displayMode: form.displayMode, countRule: form.countRule, calendarType: form.calendarType, color: form.color, category: form.category.trim(), isPinned: form.isPinned, annualReminder: form.annualReminder, reminderAdvanceDays: Number(form.reminderAdvanceDays), milestoneDays: [...new Set(form.milestoneDays.split(/[,，\s]+/).map(Number).filter(value => value > 0))].sort((a, b) => a - b), milestones: [] });
    onClose();
  };
  const field = 'w-full px-4 py-2.5 rounded-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-rose-400 focus:outline-none';
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="glass-card w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl p-6" onSubmit={submit} onClick={event => event.stopPropagation()}>
      <div className="flex items-center justify-between mb-5"><div className="flex items-center gap-3"><span className="p-2 rounded-full bg-rose-500/15 text-rose-500"><FiHeart /></span><h2 className="text-xl font-semibold">{t('anniversary.create', '创建纪念日')}</h2></div><button type="button" className="p-2 rounded-full btn-glass-hover" onClick={onClose} aria-label={t('common.close', '关闭')}><FiX /></button></div>
      <div className="space-y-4">
        <label className="block text-sm">{t('anniversary.name', '名称')}<input className={`${field} mt-1`} value={form.name} onChange={e => update('name', e.target.value)} placeholder={t('anniversary.namePlaceholder', '例如：我们相识')} /></label>
        <label className="block text-sm">
          <span className="flex items-center justify-between"><span className="flex items-center gap-2"><FiMessageCircle className="text-gray-400" />{t('timer.customDescription', '自定义句子')}</span><span className="text-xs text-gray-400">{form.customDescription.length}/80</span></span>
          <textarea className={`${field} mt-1 resize-none leading-relaxed`} rows={3} maxLength={80} value={form.customDescription} onChange={e => update('customDescription', e.target.value)} placeholder={t('timer.customDescriptionPlaceholder', '例如：每一天，都值得好好纪念')} />
          <span className="mt-1.5 block text-xs text-gray-500 dark:text-gray-400">{t('timer.customDescriptionHint', '填写后将替代计时器底部的默认状态文案')}</span>
        </label>
        <label className="block text-sm">{t('anniversary.startTime', '开始日期与时间')}<input type="datetime-local" max={localDateTime()} className={`${field} mt-1`} value={form.startTime} onChange={e => update('startTime', e.target.value)} /></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">{t('anniversary.displayMode', '显示方式')}<select className={`${field} mt-1`} value={form.displayMode} onChange={e => update('displayMode', e.target.value)}><option value="totalDays">{t('anniversary.totalDays', '累计天数')}</option><option value="precise">{t('anniversary.preciseDuration', '年月日时分秒')}</option></select></label>
          <label className="text-sm">{t('anniversary.countRule', '计日规则')}<select className={`${field} mt-1`} value={form.countRule} onChange={e => update('countRule', e.target.value)}><option value="elapsed">{t('anniversary.elapsed', '满 24 小时计一天')}</option><option value="dateOnly">{t('anniversary.dateOnly', '按自然日')}</option><option value="inclusive">{t('anniversary.inclusive', '含开始日')}</option></select></label>
          <label className="text-sm">{t('anniversary.calendarType', '周年历法')}<select className={`${field} mt-1`} value={form.calendarType} onChange={e => update('calendarType', e.target.value)}><option value="solar">{t('anniversary.solar', '公历')}</option><option value="lunar">{t('anniversary.lunar', '农历')}</option></select></label>
          <label className="text-sm">{t('overview.category', '标签')}<input className={`${field} mt-1`} value={form.category} onChange={e => update('category', e.target.value)} placeholder={t('overview.categoryPlaceholder', '感情、成长、家庭')} /></label>
        </div>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isPinned} onChange={e => update('isPinned', e.target.checked)} />{t('overview.pinOnCreate', '创建后置顶')}</label>
        <div className="rounded-2xl border border-white/15 p-4 space-y-3"><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.annualReminder} onChange={e => update('annualReminder', e.target.checked)} />{t('anniversary.annualReminder', '每年周年提醒')}</label>{form.annualReminder && <label className="block text-sm">{t('anniversary.remindBefore', '提前提醒')}<select className={`${field} mt-1`} value={form.reminderAdvanceDays} onChange={e => update('reminderAdvanceDays', e.target.value)}><option value="0">{t('anniversary.sameDay', '当天')}</option><option value="1">1 {t('time.days', '天')}</option><option value="3">3 {t('time.days', '天')}</option><option value="7">7 {t('time.days', '天')}</option></select></label>}<label className="block text-sm">{t('anniversary.milestoneAlerts', '累计天数提醒')}<input className={`${field} mt-1`} value={form.milestoneDays} onChange={e => update('milestoneDays', e.target.value)} placeholder="100, 500, 1000" /></label></div>
        {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
      </div>
      <div className="flex gap-3 mt-6"><button type="button" className="btn-glass-secondary flex-1" onClick={onClose}>{t('common.cancel', '取消')}</button><button type="submit" className="btn-glass-primary flex-1">{t('common.create', '创建')}</button></div>
    </motion.form>
  </motion.div>;
}
