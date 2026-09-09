import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiPlus, FiTrash2, FiFlag } from 'react-icons/fi';
import { getAnniversaryTotalDays } from '../../utils/anniversaryUtils';
import { useTranslation } from '../../hooks/useTranslation';

const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

export default function MilestonesModal({ timer, onClose, onChange }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const add = event => {
    event.preventDefault();
    const moment = new Date(`${date}T12:00:00`);
    if (!name.trim() || moment < new Date(timer.startTime) || moment > new Date()) return setError(t('milestone.invalid', '请填写名称，并选择开始日至今天之间的日期'));
    onChange([...(timer.milestones || []), { id: `${Date.now()}`, name: name.trim(), date: moment.toISOString(), note: note.trim() }]);
    setName(''); setNote(''); setError('');
  };
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4" onClick={onClose}>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-semibold flex items-center gap-2"><FiFlag />{t('milestone.title', '人生里程碑')}</h2><button className="p-2 rounded-full btn-glass-hover" onClick={onClose}><FiX /></button></div>
      <form className="space-y-3" onSubmit={add}><div className="grid sm:grid-cols-2 gap-3"><input className="px-4 py-2 rounded-xl bg-white/10 border border-white/20" value={name} onChange={e => setName(e.target.value)} placeholder={t('milestone.name', '里程碑名称')} /><input type="date" className="px-4 py-2 rounded-xl bg-white/10 border border-white/20" value={date} min={new Date(timer.startTime).toISOString().slice(0, 10)} max={today()} onChange={e => setDate(e.target.value)} /></div><input className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20" value={note} onChange={e => setNote(e.target.value)} placeholder={t('milestone.note', '备注（可选）')} />{error && <p className="text-sm text-red-500">{error}</p>}<button className="btn-glass-primary w-full flex justify-center items-center gap-2"><FiPlus />{t('milestone.add', '添加里程碑')}</button></form>
      <div className="mt-5 space-y-2">{(timer.milestones || []).slice().sort((a,b) => new Date(b.date)-new Date(a.date)).map(item => <div key={item.id} className="rounded-2xl bg-white/10 border border-white/10 p-3 flex items-start gap-3"><div className="flex-1"><div className="font-medium">{item.name}</div><div className="text-xs text-gray-500 mt-1">{new Date(item.date).toLocaleDateString()} · {t('milestone.dayNumber', '第 {{days}} 天').replace('{{days}}', getAnniversaryTotalDays(timer.startTime, item.date, 'inclusive'))}</div>{item.note && <p className="text-sm text-gray-500 mt-1">{item.note}</p>}</div><button className="p-2 text-red-400" onClick={() => onChange((timer.milestones || []).filter(entry => entry.id !== item.id))} aria-label={t('common.delete', '删除')}><FiTrash2 /></button></div>)}{!(timer.milestones || []).length && <p className="text-center text-sm text-gray-500 py-6">{t('milestone.empty', '记录那些真正值得记住的节点')}</p>}</div>
    </motion.div>
  </motion.div>;
}
