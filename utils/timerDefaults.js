import solarlunar from 'solarlunar';
import { addNotification, removeNotification } from './notificationManager';
import { getNextAnniversaryReminder } from './anniversaryUtils';

export function syncAnniversaryNotification(timer) {
  const id = `${timer.id}-anniversary`;
  removeNotification(id);
  const reminder = getNextAnniversaryReminder(timer);
  if (!reminder) return;

  const isEnglish = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('lang') === 'en-US';

  addNotification({
    id,
    title: timer.name,
    targetTime: reminder.date.getTime(),
    notificationTitle: isEnglish ? 'TimePulse anniversary reminder' : 'TimePulse 纪念日提醒',
    notificationBody: reminder.kind === 'days'
      ? (isEnglish
        ? `${timer.name} reaches ${reminder.days} days today.`
        : `${timer.name} 今天已走过 ${reminder.days} 天。`)
      : (isEnglish
        ? `${timer.name} has an anniversary coming up.`
        : `${timer.name} 的周年纪念日快到了。`)
  }).catch(error => console.log('设置纪念日提醒失败:', error));
}

function getQingmingDate(year) {
  const day = Math.floor((year - 2000) * 0.2422 + 4.81) - Math.floor((year - 2000) / 4);
  return new Date(Date.UTC(year, 3, day));
}

function generateFixedHolidays(year) {
  const createDate = (monthIndex, day) => new Date(Date.UTC(year, monthIndex, day)).toISOString();

  return [
    { name: `${year}年元旦`, date: createDate(0, 1), color: '#1890FF' },
    { name: `${year}年情人节`, date: createDate(1, 14), color: '#EB2F96' },
    { name: `${year}年妇女节`, date: createDate(2, 8), color: '#C71585' },
    { name: `${year}年植树节`, date: createDate(2, 12), color: '#52C41A' },
    { name: `${year}年愚人节`, date: createDate(3, 1), color: '#722ED1' },
    { name: `${year}年青年节`, date: createDate(4, 4), color: '#722ED1' },
    { name: `${year}年劳动节`, date: createDate(4, 1), color: '#FA8C16' },
    { name: `${year}年清明节`, date: getQingmingDate(year).toISOString(), color: '#228B22' },
    { name: `${year}年儿童节`, date: createDate(5, 1), color: '#13C2C2' },
    { name: `${year}年建党节`, date: createDate(6, 1), color: '#FF0000' },
    { name: `${year}年建军节`, date: createDate(7, 1), color: '#CF1322' },
    { name: `${year}年教师节`, date: createDate(8, 10), color: '#096DD9' },
    { name: `${year}年国庆节`, date: createDate(9, 1), color: '#FF4D4F' },
    { name: `${year}年万圣节`, date: createDate(9, 31), color: '#FF7A45' },
    { name: `${year}年平安夜`, date: createDate(11, 24), color: '#36CFC9' },
    { name: `${year}年圣诞节`, date: createDate(11, 25), color: '#F759AB' }
  ];
}

function calculateDynamicHolidays(year) {
  const firstDayOfMay = new Date(Date.UTC(year, 4, 1));
  const daysUntilSecondSunday = (7 - firstDayOfMay.getUTCDay()) % 7 + 7;
  const firstDayOfJune = new Date(Date.UTC(year, 5, 1));
  const daysUntilThirdSunday = (7 - firstDayOfJune.getUTCDay()) % 7 + 14;
  const firstDayOfNovember = new Date(Date.UTC(year, 10, 1));
  const daysToThursday = (4 + 7 - firstDayOfNovember.getUTCDay()) % 7;

  return [
    {
      name: `${year}年母亲节`,
      date: new Date(Date.UTC(year, 4, 1 + daysUntilSecondSunday)).toISOString(),
      color: '#F759AB'
    },
    {
      name: `${year}年父亲节`,
      date: new Date(Date.UTC(year, 5, 1 + daysUntilThirdSunday)).toISOString(),
      color: '#1890FF'
    },
    {
      name: `${year}年感恩节`,
      date: new Date(Date.UTC(year, 10, 1 + daysToThursday + 21)).toISOString(),
      color: '#FAAD14'
    }
  ];
}

function getChineseFestivals(year) {
  const holidays = [
    { name: `${year}年春节`, lunarMonth: 1, lunarDay: 1, color: '#FF0000' },
    { name: `${year}年元宵节`, lunarMonth: 1, lunarDay: 15, color: '#FF6347' },
    { name: `${year}年端午节`, lunarMonth: 5, lunarDay: 5, color: '#32CD32' },
    { name: `${year}年七夕节`, lunarMonth: 7, lunarDay: 7, color: '#FF1493' },
    { name: `${year}年中元节`, lunarMonth: 7, lunarDay: 15, color: '#708090' },
    { name: `${year}年中秋节`, lunarMonth: 8, lunarDay: 15, color: '#FFA500' },
    { name: `${year}年重阳节`, lunarMonth: 9, lunarDay: 9, color: '#800080' },
    { name: `${year}年腊八节`, lunarMonth: 12, lunarDay: 8, color: '#8B4513' }
  ];

  return holidays.map(holiday => {
    const solarDate = solarlunar.lunar2solar(
      year,
      holiday.lunarMonth,
      holiday.lunarDay,
      false
    );
    return {
      name: holiday.name,
      date: new Date(Date.UTC(
        solarDate.cYear,
        solarDate.cMonth - 1,
        solarDate.cDay
      )).toISOString(),
      color: holiday.color
    };
  });
}

function getAllHolidays() {
  const year = new Date().getFullYear();
  return [year, year + 1].flatMap(item => [
    ...generateFixedHolidays(item),
    ...calculateDynamicHolidays(item),
    ...getChineseFestivals(item)
  ]);
}

export function getHolidaysList() {
  const now = new Date();
  return getAllHolidays()
    .filter(holiday => new Date(holiday.date) > now)
    .sort((left, right) => new Date(left.date) - new Date(right.date));
}

export function getDefaultTimer() {
  const nextHoliday = getHolidaysList()[0];
  return {
    id: 'default',
    name: nextHoliday.name,
    targetDate: nextHoliday.date,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    color: nextHoliday.color,
    createdAt: new Date().toISOString(),
    isAutoGenerated: true
  };
}
