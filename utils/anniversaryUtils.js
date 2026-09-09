import { addDays, differenceInCalendarDays, intervalToDuration, startOfDay, subDays } from 'date-fns';
import solarlunar from 'solarlunar';

export const DISPLAY_MODES = ['totalDays', 'calendar', 'precise'];
export const COUNT_RULES = ['elapsed', 'inclusive', 'dateOnly'];

const safeDate = value => value instanceof Date ? value : new Date(value);

export function getAnniversaryDuration(startValue, endValue = new Date(), rule = 'elapsed') {
  const start = safeDate(startValue);
  const end = safeDate(endValue);
  if (rule === 'dateOnly') return intervalToDuration({ start: startOfDay(start), end: startOfDay(end) });
  if (rule === 'inclusive') return intervalToDuration({ start: startOfDay(start), end: addDays(startOfDay(end), 1) });
  return intervalToDuration({ start, end });
}

export function getAnniversaryTotalDays(startValue, endValue = new Date(), rule = 'elapsed') {
  const start = safeDate(startValue);
  const end = safeDate(endValue);
  if (rule === 'dateOnly') return Math.max(0, differenceInCalendarDays(startOfDay(end), startOfDay(start)));
  if (rule === 'inclusive') return Math.max(1, differenceInCalendarDays(startOfDay(end), startOfDay(start)) + 1);
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
}

function solarAnniversary(start, now) {
  const make = year => {
    const day = Math.min(start.getDate(), new Date(year, start.getMonth() + 1, 0).getDate());
    return new Date(year, start.getMonth(), day, start.getHours(), start.getMinutes(), start.getSeconds());
  };
  const candidate = make(now.getFullYear());
  return candidate > now ? candidate : make(now.getFullYear() + 1);
}

function lunarAnniversary(start, now) {
  const lunar = solarlunar.solar2lunar(start.getFullYear(), start.getMonth() + 1, start.getDate());
  const candidates = [];
  for (let year = now.getFullYear() - 1; year <= now.getFullYear() + 2; year += 1) {
    try {
      let solar = solarlunar.lunar2solar(year, lunar.lMonth, lunar.lDay, Boolean(lunar.isLeap));
      if (!solar || solar === -1) solar = solarlunar.lunar2solar(year, lunar.lMonth, lunar.lDay, false);
      if (solar && solar !== -1) candidates.push(new Date(solar.cYear, solar.cMonth - 1, solar.cDay, start.getHours(), start.getMinutes(), start.getSeconds()));
    } catch (_) {}
  }
  return candidates.filter(date => date > now).sort((a, b) => a - b)[0] || solarAnniversary(start, now);
}

export function getNextAnniversary(startValue, now = new Date(), calendarType = 'solar') {
  const start = safeDate(startValue);
  return calendarType === 'lunar' ? lunarAnniversary(start, now) : solarAnniversary(start, now);
}

export function getDaysUntil(dateValue, now = new Date()) {
  return Math.max(0, differenceInCalendarDays(startOfDay(safeDate(dateValue)), startOfDay(now)));
}

export function getNextAnniversaryReminder(timer, now = new Date()) {
  const candidates = [];
  if (timer.annualReminder) {
    const anniversary = getNextAnniversary(timer.startTime, now, timer.calendarType);
    const reminder = subDays(anniversary, Number(timer.reminderAdvanceDays || 0));
    if (reminder > now) candidates.push({ date: reminder, kind: 'annual', anniversary });
  }
  (timer.milestoneDays || []).forEach(days => {
    const date = addDays(new Date(timer.startTime), Number(days));
    if (date > now) candidates.push({ date, kind: 'days', days: Number(days) });
  });
  return candidates.sort((a, b) => a.date - b.date)[0] || null;
}
