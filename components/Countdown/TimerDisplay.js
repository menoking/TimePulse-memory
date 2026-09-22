import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { intervalToDuration } from 'date-fns';
import { useTimers } from '../../context/SupabaseTimerContext';
import { useFullscreen } from '../../context/FullscreenContext';
import { useBackground } from '../../context/BackgroundContext';
import { useTranslation } from '../../hooks/useTranslation';
import DigitColumn from './DigitColumn';
import { addNotification } from '../../utils/notificationManager';
import { track, bucketDurationMs } from '../../utils/analytics';
import { FiActivity, FiMessageCircle, FiPlay, FiPause, FiSquare, FiFlag, FiList, FiCalendar } from 'react-icons/fi';
import LapTimesModal from '../UI/LapTimesModal';
import StopwatchStopConfirmModal from '../UI/StopwatchStopConfirmModal';
import MilestonesModal from '../UI/MilestonesModal';
import { getAnniversaryDuration, getAnniversaryTotalDays, getDaysUntil, getNextAnniversary } from '../../utils/anniversaryUtils';

const EMPTY_TIME_VALUE = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

export default function TimerDisplay() {
  const { getActiveTimer, updateTimer, checkAndUpdateDefaultTimer, canEdit } = useTimers();
  const { isFullscreen, timerFontSize, labelFontSize } = useFullscreen();
  const { timerPanelOpacity } = useBackground();
  const { t, currentLang } = useTranslation();
  const [timeValue, setTimeValue] = useState(EMPTY_TIME_VALUE);
  const [showDays, setShowDays] = useState(true);
  const [showYears, setShowYears] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLapModalOpen, setIsLapModalOpen] = useState(false);
  const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(false);
  const [showAnniversarySwitchHint, setShowAnniversarySwitchHint] = useState(false);
  const [totalDays, setTotalDays] = useState(0);
  const [nextAnniversary, setNextAnniversary] = useState(null);
  const [visitorDisplayMode, setVisitorDisplayMode] = useState('totalDays');
  
  // 使用 ref 跟踪最后计算的时间，避免不必要的重渲染
  const lastTimeRef = useRef(EMPTY_TIME_VALUE);
  const timerIdRef = useRef(null);
  const syncTimerRef = useRef(null); // 高频同步定时器
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0); // 记录已暂停的总时间
  const lastSecondRef = useRef(-1); // 记录上一次的秒数
  
  // 判断两个时间对象是否相等
  const areTimesEqual = (time1, time2) => {
    return time1.years === time2.years &&
           time1.months === time2.months &&
           time1.days === time2.days && 
           time1.hours === time2.hours && 
           time1.minutes === time2.minutes && 
           time1.seconds === time2.seconds;
  };

  // 自动对时系统 - 高精度时间同步
  const startTimeSyncSystem = () => {
    // 清除现有的定时器
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
    }
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }
    
    // 只在页面可见时启动高频检测
    if (document.visibilityState !== 'visible') {
      return;
    }
    
    const tick = () => {
      const timer = getActiveTimer();
      if (timer && document.visibilityState === 'visible') calculateTime(timer);
      timerIdRef.current = setTimeout(tick, 1000 - (Date.now() % 1000) + 8);
    };
    syncTimerRef.current = setTimeout(tick, 1000 - (Date.now() % 1000) + 8);
  };
  
  // 统一的计时计算函数
  const calculateTime = (timer) => {
    // 当页面在后台时，可能会暂停
    if (document.visibilityState !== 'visible') {
      return;
    }
    
    switch (timer.type) {
      case 'stopwatch':
        calculateStopwatchTime(timer);
        break;
      case 'anniversary':
        calculateAnniversaryTime(timer);
        break;
      case 'worldclock':
        calculateWorldClockTime(timer);
        break;
      default: // countdown
        calculateCountdownTime(timer);
        break;
    }
  };

  const calculateAnniversaryTime = (timer) => {
    const now = new Date();
    const duration = getAnniversaryDuration(timer.startTime, now, timer.countRule || 'elapsed');
    const next = getNextAnniversary(timer.startTime, now, timer.calendarType || 'solar');
    const value = { years: duration.years || 0, months: duration.months || 0, days: duration.days || 0, hours: duration.hours || 0, minutes: duration.minutes || 0, seconds: duration.seconds || 0 };
    if (!areTimesEqual(value, lastTimeRef.current)) { setTimeValue(value); lastTimeRef.current = value; }
    setTotalDays(current => { const nextValue = getAnniversaryTotalDays(timer.startTime, now, timer.countRule || 'elapsed'); return current === nextValue ? current : nextValue; });
    setNextAnniversary(current => current && current.getTime() === next.getTime() ? current : next);
  };
  
  // 判断是否只有秒数变化（避免分钟数字不必要的重新渲染）
  const isOnlySecondsChanged = (time1, time2) => {
    return time1.years === time2.years &&
           time1.months === time2.months &&
           time1.days === time2.days && 
           time1.hours === time2.hours && 
           time1.minutes === time2.minutes && 
           time1.seconds !== time2.seconds;
  };
  
  // 计算倒计时剩余时间
  const calculateCountdownTime = (timer) => {
    const now = new Date();
    const targetDate = new Date(timer.targetDate);
    const difference = targetDate - now;
    
    if (difference <= 0) {
      // 倒计时结束
      if (!isFinished) {
        setIsFinished(true);
        setTimeValue(EMPTY_TIME_VALUE);
        lastTimeRef.current = EMPTY_TIME_VALUE;

        try {
          const createdAt = timer.createdAt ? new Date(timer.createdAt).getTime() : null;
          const totalMs = createdAt ? targetDate.getTime() - createdAt : null;
          track('countdown_finished', {
            duration_bucket: totalMs !== null ? bucketDurationMs(totalMs) : 'unknown',
          });
        } catch (e) {}
        
        // 检查并更新过期的默认计时器
        if (checkAndUpdateDefaultTimer) {
          checkAndUpdateDefaultTimer();
        }
        
        // 当倒计时结束时发送通知
        try {
          console.log('倒计时结束，尝试发送通知:', timer.name);
          addNotification({
            id: timer.id,
            title: timer.name,
            targetTime: Date.now()
          }).catch(error => {
            console.error('发送倒计时结束通知失败:', error);
          });
        } catch (error) {
          console.error('发送倒计时结束通知失败:', error);
        }
      }
      return;
    }
    
    // 倒计时未结束
    if (isFinished) {
      setIsFinished(false);
    }
    
    // 计算天、时、分、秒
    const totalDays = Math.floor(difference / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const days = totalDays % 365;
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);
    
    const newTimeLeft = { years, months: 0, days, hours, minutes, seconds };
    
    // 只有当时间真正变化时才更新状态
    if (!areTimesEqual(newTimeLeft, lastTimeRef.current)) {
      setTimeValue(newTimeLeft);
      lastTimeRef.current = newTimeLeft;
      setShowYears(years > 0);
      setShowDays(days > 0 || years > 0); // 当有年份或天数大于0时显示天数
    }
  };
  
  // 计算秒表经过时间
  const calculateStopwatchTime = (timer) => {
    const now = new Date();
    const startTime = new Date(timer.startTime);
    let endTime = startTime;
    
    if (timer.isRunning) {
      // 正在运行中
      endTime = now;
    } else if (timer.pausedAt) {
      // 已暂停，显示暂停时的时间
      endTime = new Date(timer.pausedAt);
    }

    const effectiveStart = new Date(startTime.getTime() + (timer.totalPausedTime || 0));
    const hasValidRange = !Number.isNaN(effectiveStart.getTime()) && endTime >= effectiveStart;
    const duration = hasValidRange
      ? intervalToDuration({ start: effectiveStart, end: endTime })
      : EMPTY_TIME_VALUE;
    const newTimeValue = {
      years: duration.years || 0,
      months: duration.months || 0,
      days: duration.days || 0,
      hours: duration.hours || 0,
      minutes: duration.minutes || 0,
      seconds: duration.seconds || 0
    };
    
    // 智能更新：只有当时间确实变化时才更新状态
    // 秒表仅在数值发生变化时更新
    if (!areTimesEqual(newTimeValue, lastTimeRef.current)) {
      // 如果只是秒数变化，我们延迟更新其他数字避免闪烁
      if (timer.type === 'stopwatch' && isOnlySecondsChanged(newTimeValue, lastTimeRef.current)) {
        // 只更新秒数
        setTimeValue(prev => ({ ...prev, seconds: newTimeValue.seconds }));
      } else {
        // 全部更新
        setTimeValue(newTimeValue);
      }
      lastTimeRef.current = newTimeValue;
      setShowYears(newTimeValue.years > 0);
      setShowDays(newTimeValue.days > 0 || newTimeValue.months > 0 || newTimeValue.years > 0);
    }
  };
  
  // 计算世界时钟时间
  const calculateWorldClockTime = (timer) => {
    const now = new Date();
    const timeInTimezone = new Date(now.toLocaleString("en-US", {timeZone: timer.timezone}));
    
    const hours = timeInTimezone.getHours();
    const minutes = timeInTimezone.getMinutes();
    const seconds = timeInTimezone.getSeconds();
    
    const newTimeValue = { 
      years: 0,
      months: 0,
      days: 0, 
      hours: hours, 
      minutes: minutes, 
      seconds: seconds 
    };
    
    if (!areTimesEqual(newTimeValue, lastTimeRef.current)) {
      setTimeValue(newTimeValue);
      lastTimeRef.current = newTimeValue;
      setShowYears(false); // 世界时钟不显示年数
      setShowDays(false); // 世界时钟不显示天数
    }
  };
  
  // 主计时逻辑
  useEffect(() => {
    // 清除之前的定时器
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
    }
    
    const timer = getActiveTimer();
    if (!timer) return;
    
    // 设置初始运行状态
    if (timer.type === 'stopwatch') {
      setIsRunning(timer.isRunning === true);
      pausedTimeRef.current = timer.totalPausedTime || 0;
    }
    
    // 步骤1：刚打开页面/切换计时器时，执行一次主进程
    calculateTime(timer);
    
    // 步骤2：然后开始高频检测
    startTimeSyncSystem();
    
    // 处理页面可见性变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 页面重新可见时，重新执行步骤1和2
        const activeTimer = getActiveTimer();
        if (activeTimer) {
          // 步骤1：执行一次主进程
          calculateTime(activeTimer);
          // 步骤2：开始高频检测
          startTimeSyncSystem();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(timerIdRef.current);
      clearInterval(syncTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getActiveTimer, isFinished, checkAndUpdateDefaultTimer, isRunning]);
  
  // 秒表控制函数
  const handleStopwatchControl = (action) => {
    const timer = getActiveTimer();
    if (!timer || timer.type !== 'stopwatch') return;
    
    const now = new Date();
    
    switch (action) {
      case 'play':
        if (timer.pausedAt) {
          // 从暂停状态恢复，计算已暂停的总时间
          const pausedDuration = now - new Date(timer.pausedAt);
          const newTotalPausedTime = (timer.totalPausedTime || 0) + pausedDuration;
          updateTimer(timer.id, {
            isRunning: true,
            pausedAt: null,
            totalPausedTime: newTotalPausedTime
          });
        } else {
          // 第一次开始
          updateTimer(timer.id, {
            isRunning: true,
            startTime: timer.startTime || now.toISOString(),
            pausedAt: null,
            totalPausedTime: timer.totalPausedTime || 0
          });
        }
        setIsRunning(true);
        track('stopwatch_play');
        break;

      case 'pause':
        updateTimer(timer.id, {
          isRunning: false,
          pausedAt: now.toISOString()
        });
        setIsRunning(false);
        track('stopwatch_pause');
        break;

      case 'stop':
        updateTimer(timer.id, {
          isRunning: false,
          startTime: now.toISOString(),
          pausedAt: null,
          totalPausedTime: 0,
          laps: [] // 清空分段记录
        });
        setIsRunning(false);
        setTimeValue(EMPTY_TIME_VALUE);
        lastTimeRef.current = EMPTY_TIME_VALUE;
        track('stopwatch_stop');
        break;

      case 'lap':
        // Record lap time
        const startTime = new Date(timer.startTime);
        const elapsedMs = now - startTime - (timer.totalPausedTime || 0);
        const laps = timer.laps || [];
        // Use a combination of timestamp and random to avoid collision
        const newLap = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now.toISOString(),
          elapsedMs: elapsedMs,
          label: ''
        };
        updateTimer(timer.id, {
          laps: [...laps, newLap]
        });
        track('stopwatch_lap', { lap_count: laps.length + 1 });
        break;
    }
  };

  const handleRenameLap = (lapId, label) => {
    const timer = getActiveTimer();
    if (!timer || timer.type !== 'stopwatch') return;
    updateTimer(timer.id, (latestTimer) => ({
      laps: (latestTimer.laps || []).map((lap) => lap.id === lapId ? { ...lap, label } : lap)
    }));
    track('stopwatch_lap_rename');
  };

  const handleDeleteLap = (lapId) => {
    const timer = getActiveTimer();
    if (!timer || timer.type !== 'stopwatch') return;
    updateTimer(timer.id, (latestTimer) => ({
      laps: (latestTimer.laps || []).filter((lap) => lap.id !== lapId)
    }));
    track('stopwatch_lap_delete');
  };
  
  // 格式化为两位数
  const formatNumber = (num) => {
    return num.toString().padStart(2, '0');
  };
  
  const activeTimer = getActiveTimer();

  useEffect(() => {
    setVisitorDisplayMode(activeTimer?.displayMode === 'totalDays' ? 'totalDays' : 'precise');
  }, [activeTimer?.id, activeTimer?.displayMode]);

  useEffect(() => {
    try {
      setShowAnniversarySwitchHint(localStorage.getItem('timepulse-anniversary-switch-hint-seen') !== 'true');
    } catch (error) {
      setShowAnniversarySwitchHint(true);
    }
  }, []);

  // 字体大小映射
  const getTimerFontSizeClasses = () => {
    if (isFullscreen) {
      // 全屏模式：使用固定大尺寸
      return {
        small: 'text-5xl sm:text-6xl md:text-7xl',
        medium: 'text-6xl sm:text-7xl md:text-8xl',
        large: 'text-7xl sm:text-8xl md:text-9xl'
      };
    } else {
      // 普通模式：使用响应式尺寸
      return {
        small: 'text-4xl sm:text-5xl md:text-6xl',
        medium: 'text-5xl sm:text-6xl md:text-7xl',
        large: 'text-6xl sm:text-7xl md:text-8xl'
      };
    }
  };

  const getLabelFontSizeClasses = () => {
    return {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'
    };
  };

  const timerClasses = getTimerFontSizeClasses();
  const labelClasses = getLabelFontSizeClasses();
  const visibleStopwatchUnits = ['years', 'months', 'days', 'hours', 'minutes', 'seconds']
    .filter((unit) => timeValue[unit] > 0);
  const anniversaryUnits = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];
  const firstAnniversaryValue = anniversaryUnits.findIndex(unit => timeValue[unit] > 0);
  const visibleAnniversaryUnits = firstAnniversaryValue < 0 ? ['seconds'] : anniversaryUnits.slice(firstAnniversaryValue);
  const anniversaryDisplayMode = canEdit
    ? (activeTimer?.displayMode === 'totalDays' ? 'totalDays' : 'precise')
    : visitorDisplayMode;

  if (!activeTimer) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <p className="text-xl text-gray-400">{t('timer.noActiveTimer')}</p>
      </div>
    );
  }
  
  // 获取显示标题和描述
  const getTimerTitle = () => {
    switch (activeTimer.type) {
      case 'stopwatch':
        return activeTimer.name;
      case 'anniversary':
        return activeTimer.name;
      case 'worldclock':
        return activeTimer.name; // 直接使用用户设置的名称
      default:
        return activeTimer.name;
    }
  };
  
  const getTimerDescription = () => {
    switch (activeTimer.type) {
      case 'stopwatch':
        return isRunning ? (activeTimer.customDescription?.trim() || t('timer.running')) : t('timer.paused');
      case 'anniversary':
        return activeTimer.customDescription?.trim() || t('timer.running');
      case 'worldclock':
        return `${activeTimer.country} - ${activeTimer.timezone}`;
      default:
        return `${t('timer.target')}: ${new Date(activeTimer.targetDate).toLocaleString()}`;
    }
  };

  const handleAnniversaryDisplayToggle = () => {
    if (activeTimer.type !== 'anniversary') return;

    const nextMode = anniversaryDisplayMode === 'totalDays' ? 'precise' : 'totalDays';
    if (canEdit) updateTimer(activeTimer.id, { displayMode: nextMode });
    else setVisitorDisplayMode(nextMode);
    setShowAnniversarySwitchHint(false);
    try {
      localStorage.setItem('timepulse-anniversary-switch-hint-seen', 'true');
    } catch (error) {}
    track('anniversary_display_toggle', { display_mode: nextMode });
  };
  
  return (
    <motion.div 
      className="flex flex-col items-center justify-center text-center px-4 relative z-10"
      style={{
        '--timer-panel-light-alpha': timerPanelOpacity,
        '--timer-panel-dark-alpha': Math.min(timerPanelOpacity * 0.55, 0.55),
        '--timer-panel-blur': `${Math.round(18 * Math.min(timerPanelOpacity / 0.7, 1))}px`
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      key={activeTimer.id}
    >
      {/* 计时器名称 */}
      <motion.h2
        className={`${isFullscreen ? 'text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-3xl'} font-medium mb-4`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          color: activeTimer.color,
          transition: 'color 0.3s var(--transition-timing)'
        }}
      >
        {getTimerTitle()}
      </motion.h2>
      
      {/* 时间显示 */}
      <motion.div
        className={activeTimer.type === 'stopwatch' || activeTimer.type === 'anniversary'
          ? `flex flex-wrap gap-3 sm:gap-4 items-start justify-center max-w-6xl ${activeTimer.type === 'anniversary' ? 'cursor-pointer select-none outline-none transition-[filter] duration-200 hover:brightness-[1.03] focus-visible:brightness-110' : ''}`
          : `flex items-center justify-center ${showYears ? 'flex-col sm:flex-row gap-2 sm:gap-0' : 'flex-row'} space-x-0 sm:space-x-4`
        }
        role={activeTimer.type === 'anniversary' ? 'button' : undefined}
        tabIndex={activeTimer.type === 'anniversary' ? 0 : undefined}
        aria-label={activeTimer.type === 'anniversary'
          ? t(anniversaryDisplayMode === 'totalDays' ? 'anniversary.showPrecise' : 'anniversary.showTotalDays', anniversaryDisplayMode === 'totalDays' ? '显示年月日时分秒' : '显示累计天数')
          : undefined}
        title={activeTimer.type === 'anniversary' ? t('anniversary.switchHint', '点击时间切换显示方式') : undefined}
        onClick={activeTimer.type === 'anniversary' ? handleAnniversaryDisplayToggle : undefined}
        onKeyDown={activeTimer.type === 'anniversary' ? (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleAnniversaryDisplayToggle();
          }
        } : undefined}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {activeTimer.type === 'anniversary' ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={anniversaryDisplayMode}
              className="flex max-w-full flex-wrap items-start justify-center gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 6, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.985 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {anniversaryDisplayMode === 'totalDays' ? (
                <div className="glass-card timer-panel-card rounded-[2rem] px-10 py-7 sm:px-16 sm:py-9 min-w-[240px]">
                  <div className="text-6xl sm:text-8xl font-semibold tracking-tight" style={{ color: activeTimer.color }}>{totalDays}</div>
                  <div className="mt-2 text-sm text-gray-500">{t('anniversary.daysTogether', '已走过的天数')}</div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {visibleAnniversaryUnits.map(unit => <motion.div layout key={unit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><DigitColumn value={formatNumber(timeValue[unit])} label={t(`time.${unit}`)} color={activeTimer.color || '#f43f5e'} fontSize={isFullscreen ? timerFontSize : 'small'} labelFontSize={labelFontSize} /></motion.div>)}
                </AnimatePresence>
              )}
            </motion.div>
          </AnimatePresence>
        ) : activeTimer.type === 'stopwatch' ? (
          <AnimatePresence mode="popLayout">
            {visibleStopwatchUnits.map((unit) => (
              <motion.div
                key={unit}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.9 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <DigitColumn
                  value={formatNumber(timeValue[unit])}
                  label={t(`time.${unit}`)}
                  color={activeTimer.color || '#0ea5e9'}
                  fontSize={isFullscreen ? timerFontSize : 'small'}
                  labelFontSize={labelFontSize}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <>
            {showYears && (
              <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                <DigitColumn
                  value={formatNumber(timeValue.years)}
                  label={t('time.years')}
                  color={activeTimer.color || '#0ea5e9'}
                  fontSize={timerFontSize}
                  labelFontSize={labelFontSize}
                />
                <span className={`${timerClasses[timerFontSize]} font-thin text-gray-400`}>:</span>
                {showDays && (
                  <>
                    <DigitColumn
                      value={formatNumber(timeValue.days)}
                      label={t('time.days')}
                      color={activeTimer.color || '#0ea5e9'}
                      fontSize={timerFontSize}
                      labelFontSize={labelFontSize}
                    />
                    <span className="text-4xl sm:text-5xl md:text-6xl font-thin text-gray-400 hidden sm:inline">:</span>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center justify-center space-x-2 sm:space-x-4">
              {!showYears && showDays && (
                <>
                  <DigitColumn
                    value={formatNumber(timeValue.days)}
                    label={t('time.days')}
                    color={activeTimer.color || '#0ea5e9'}
                    fontSize={timerFontSize}
                    labelFontSize={labelFontSize}
                  />
                  <span className={`${timerClasses[timerFontSize]} font-thin text-gray-400`}>:</span>
                </>
              )}
              <DigitColumn
                value={formatNumber(timeValue.hours)}
                label={t('time.hours')}
                color={activeTimer.color || '#0ea5e9'}
                fontSize={timerFontSize}
                labelFontSize={labelFontSize}
              />
              <span className="text-4xl sm:text-5xl md:text-6xl font-thin text-gray-400">:</span>
              <DigitColumn
                value={formatNumber(timeValue.minutes)}
                label={t('time.minutes')}
                color={activeTimer.color || '#0ea5e9'}
                fontSize={timerFontSize}
                labelFontSize={labelFontSize}
              />
              <span className="text-4xl sm:text-5xl md:text-6xl font-thin text-gray-400">:</span>
              <DigitColumn
                value={formatNumber(timeValue.seconds)}
                label={t('time.seconds')}
                color={activeTimer.color || '#0ea5e9'}
                fontSize={timerFontSize}
                labelFontSize={labelFontSize}
              />
            </div>
          </>
        )}
      </motion.div>

      {activeTimer.type === 'anniversary' && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <AnimatePresence initial={false}>
            {showAnniversarySwitchHint && (
              <motion.p
                className="text-xs text-gray-500/80 dark:text-gray-400/80"
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.2 }}
              >
                {t('anniversary.switchHint', '点击时间切换显示方式')}
              </motion.p>
            )}
          </AnimatePresence>
          <button className="glass-card timer-panel-card px-5 py-2.5 rounded-full flex items-center gap-2" style={{ color: activeTimer.color }} onClick={() => setIsMilestonesOpen(true)}><FiCalendar />{t('milestone.title', '人生里程碑')}</button>
          {nextAnniversary && <p className="text-sm text-gray-500">{t('anniversary.nextIn', '{{days}} 天后周年').replace('{{days}}', getDaysUntil(nextAnniversary))}</p>}
        </div>
      )}
      
      {/* 秒表控制按钮 */}
      {activeTimer.type === 'stopwatch' && canEdit && (
        <motion.div 
          className="mt-8 flex space-x-4 relative"
          style={{ 
            zIndex: 40,
            pointerEvents: 'auto'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => handleStopwatchControl(isRunning ? 'pause' : 'play')}
            className="glass-card timer-panel-card p-4 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer select-none"
            style={{ 
              color: activeTimer.color,
              zIndex: 41,
              position: 'relative',
              pointerEvents: 'auto',
              userSelect: 'none'
            }}
          >
            {isRunning ? <FiPause className="text-xl pointer-events-none" /> : <FiPlay className="text-xl pointer-events-none" />}
          </button>
          <button
            onClick={() => handleStopwatchControl('lap')}
            disabled={!isRunning}
            className="glass-card timer-panel-card p-4 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              color: activeTimer.color,
              zIndex: 41,
              position: 'relative',
              pointerEvents: 'auto',
              userSelect: 'none'
            }}
          >
            <FiFlag className="text-xl pointer-events-none" />
          </button>
          <button
            onClick={() => setIsStopConfirmOpen(true)}
            className="glass-card timer-panel-card p-4 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer select-none"
            style={{ 
              color: activeTimer.color,
              zIndex: 41,
              position: 'relative',
              pointerEvents: 'auto',
              userSelect: 'none'
            }}
          >
            <FiSquare className="text-xl pointer-events-none" />
          </button>
        </motion.div>
      )}
      
      {/* 倒计时结束提示 */}
      <AnimatePresence>
        {isMilestonesOpen && activeTimer.type === 'anniversary' && <MilestonesModal timer={activeTimer} readOnly={!canEdit} onClose={() => setIsMilestonesOpen(false)} onChange={milestones => updateTimer(activeTimer.id, { milestones })} />}
      </AnimatePresence>

      <AnimatePresence>
        {isFinished && activeTimer.type === 'countdown' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mt-8 glass-card timer-panel-card px-6 py-4 rounded-xl"
          >
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
              {t('timer.finished')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 描述信息 */}
      {activeTimer.type === 'stopwatch' || activeTimer.type === 'anniversary' ? (
        <motion.div
          className="mt-6 max-w-xl"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="glass-card timer-panel-card flex items-center gap-3 rounded-2xl border border-white/15 px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 dark:bg-white/10" style={{ color: activeTimer.color }}>
              {activeTimer.type === 'stopwatch' && !isRunning ? <FiPause /> : activeTimer.customDescription?.trim() ? <FiMessageCircle /> : <FiActivity />}
            </span>
            <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-200">{getTimerDescription()}</p>
          </div>
          {activeTimer.type === 'anniversary' && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('anniversary.since', '始于')} {new Date(activeTimer.startTime).toLocaleString()}</p>}
        </motion.div>
      ) : (
        <motion.p className="mt-6 text-sm text-gray-500 dark:text-gray-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>{getTimerDescription()}</motion.p>
      )}
      
      {/* 分段计时按钮 */}
      {activeTimer.type === 'stopwatch' && activeTimer.laps && activeTimer.laps.length > 0 && (
        <motion.button
          className="mt-6 glass-card timer-panel-card px-6 py-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer"
          style={{ 
            color: activeTimer.color,
            zIndex: 10,
            position: 'relative',
            pointerEvents: 'auto'
          }}
          onClick={() => { setIsLapModalOpen(true); track('lap_modal_open'); }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-2">
            <FiList className="text-xl" />
            <span className="font-medium">{t('lap.title')}</span>
            <span className="text-sm opacity-70">({activeTimer.laps.length})</span>
          </div>
        </motion.button>
      )}
      
      {/* 分段计时弹窗 */}
      <AnimatePresence>
        {isLapModalOpen && activeTimer.type === 'stopwatch' && (
          <LapTimesModal 
            onClose={() => setIsLapModalOpen(false)}
            laps={activeTimer.laps || []}
            timerColor={activeTimer.color}
            onRenameLap={handleRenameLap}
            onDeleteLap={handleDeleteLap}
            readOnly={!canEdit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStopConfirmOpen && activeTimer.type === 'stopwatch' && canEdit && (
          <StopwatchStopConfirmModal
            onClose={() => setIsStopConfirmOpen(false)}
            onConfirm={() => {
              setIsStopConfirmOpen(false);
              setIsLapModalOpen(false);
              handleStopwatchControl('stop');
            }}
            timerColor={activeTimer.color}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
