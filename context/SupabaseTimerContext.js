import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addNotification, removeNotification } from '../utils/notificationManager';
import { fetchPublicTimerPage, publishTimerPage } from '../utils/publicTimerRepository';
import { getDefaultTimer, getHolidaysList, syncAnniversaryNotification } from '../utils/timerDefaults';
import { useSupabaseAuth } from './SupabaseAuthContext';

const TimerContext = createContext(null);

const LEGACY_TIMERS_KEY = 'timers';
const LEGACY_ACTIVE_KEY = 'activeTimerId';
const PUBLIC_CACHE_KEY = 'timepulse_public_page_cache_v1';
const PUBLIC_ACTIVE_KEY = 'timepulse_public_active_timer_id';
const ADMIN_DRAFT_KEY = 'timepulse_admin_draft_v1';

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn(`[TimePulse] 无法读取 ${key}:`, error);
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[TimePulse] 无法保存 ${key}:`, error);
  }
}

function validTimers(value) {
  return Array.isArray(value)
    ? value.filter(timer => timer && typeof timer === 'object' && typeof timer.id === 'string')
    : [];
}

function resolveActiveTimerId(timers, preferredId) {
  if (preferredId && timers.some(timer => timer.id === preferredId)) return preferredId;
  return timers[0]?.id || null;
}

function cachePublicPage(page) {
  if (!page) return;
  writeJson(PUBLIC_CACHE_KEY, page);
}

export function TimerProvider({ children }) {
  const { isSupabaseConfigured, isAuthLoading, isAdmin, user } = useSupabaseAuth();
  const [timers, setTimers] = useState([]);
  const [activeTimerId, setActiveTimerIdState] = useState(null);
  const [holidaysList, setHolidaysList] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loadErrorCode, setLoadErrorCode] = useState('');
  const [publishError, setPublishError] = useState('');
  const [dataSource, setDataSource] = useState('loading');
  const [hasPublicPage, setHasPublicPage] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState(null);
  const [publishedAt, setPublishedAt] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [localImportCandidate, setLocalImportCandidate] = useState({ timers: [], activeTimerId: null });
  const previousAdminRef = useRef(null);
  const restoredAdminUserRef = useRef(null);
  const canEdit = !isSupabaseConfigured || isAdmin;

  const applyCollection = useCallback((nextTimers, preferredId, { scheduleNotifications = false } = {}) => {
    const normalized = validTimers(nextTimers);
    setTimers(normalized);
    setActiveTimerIdState(resolveActiveTimerId(normalized, preferredId));
    if (scheduleNotifications) {
      normalized.filter(timer => timer.type === 'anniversary').forEach(syncAnniversaryNotification);
    }
  }, []);

  const applyPublicPage = useCallback((page, source = 'public') => {
    if (!page) {
      applyCollection([], null);
      setHasPublicPage(false);
      setPublishedVersion(null);
      setPublishedAt(null);
      setDataSource('empty');
      return;
    }

    const visitorSelection = localStorage.getItem(PUBLIC_ACTIVE_KEY);
    applyCollection(page.timers, visitorSelection || page.featuredTimerId);
    setHasPublicPage(true);
    setPublishedVersion(page.version);
    setPublishedAt(page.publishedAt);
    setDataSource(source);
    cachePublicPage(page);
  }, [applyCollection]);

  const refreshPublicData = useCallback(async ({ discardDraft = false } = {}) => {
    if (!isSupabaseConfigured) return null;
    if (isAdmin && isDirty && !discardDraft) {
      const error = new Error('当前有未发布的草稿，请确认放弃草稿后再重新加载。');
      error.code = 'UNPUBLISHED_DRAFT';
      throw error;
    }

    setLoadError('');
    setLoadErrorCode('');
    const page = await fetchPublicTimerPage();
    applyPublicPage(page, 'public');
    if (discardDraft) {
      localStorage.removeItem(ADMIN_DRAFT_KEY);
      setIsDirty(false);
    }
    return page;
  }, [applyPublicPage, isAdmin, isDirty, isSupabaseConfigured]);

  useEffect(() => {
    setHolidaysList(getHolidaysList());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const legacyTimers = validTimers(readJson(LEGACY_TIMERS_KEY, []));
      const legacyActiveTimerId = localStorage.getItem(LEGACY_ACTIVE_KEY);
      setLocalImportCandidate({ timers: legacyTimers, activeTimerId: legacyActiveTimerId });

      if (!isSupabaseConfigured) {
        const localTimers = legacyTimers.length ? legacyTimers : [getDefaultTimer()];
        if (cancelled) return;
        applyCollection(localTimers, legacyActiveTimerId, { scheduleNotifications: true });
        setDataSource('local');
        setIsLoaded(true);
        return;
      }

      try {
        const page = await fetchPublicTimerPage();
        if (cancelled) return;
        applyPublicPage(page, 'public');
      } catch (error) {
        if (cancelled) return;
        console.error('[Supabase] 加载公开计时器失败:', error);
        setLoadError(error.message || '公开数据加载失败');
        setLoadErrorCode(error.code || 'UNKNOWN');
        const cachedPage = readJson(PUBLIC_CACHE_KEY, null);
        if (cachedPage?.timers) applyPublicPage(cachedPage, 'cache');
        else applyPublicPage(null);
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    };

    initialize();
    return () => { cancelled = true; };
  }, [applyCollection, applyPublicPage, isSupabaseConfigured]);

  useEffect(() => {
    if (!isLoaded || isAuthLoading || !isSupabaseConfigured) return;

    const wasAdmin = previousAdminRef.current === true;

    if (isAdmin && user && restoredAdminUserRef.current !== user.id) {
      const draft = readJson(ADMIN_DRAFT_KEY, null);
      if (draft?.dirty && Array.isArray(draft.timers)) {
        applyCollection(draft.timers, draft.activeTimerId, { scheduleNotifications: true });
        setPublishedVersion(currentVersion => draft.publishedVersion ?? currentVersion);
        setIsDirty(true);
        setDataSource('draft');
      }
      restoredAdminUserRef.current = user.id;
    } else if (!isAdmin && wasAdmin) {
      restoredAdminUserRef.current = null;
      setIsDirty(false);
      refreshPublicData().catch(error => {
        setLoadError(error.message || '退出后重新加载公开数据失败');
        setLoadErrorCode(error.code || 'UNKNOWN');
      });
    }

    previousAdminRef.current = isAdmin;
  }, [applyCollection, isAdmin, isAuthLoading, isLoaded, isSupabaseConfigured, refreshPublicData, user]);

  useEffect(() => {
    if (!isLoaded || !activeTimerId) return;
    if (!isSupabaseConfigured) localStorage.setItem(LEGACY_ACTIVE_KEY, activeTimerId);
    else if (!isAdmin) localStorage.setItem(PUBLIC_ACTIVE_KEY, activeTimerId);
  }, [activeTimerId, isAdmin, isLoaded, isSupabaseConfigured]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSupabaseConfigured) {
      writeJson(LEGACY_TIMERS_KEY, timers);
      return;
    }

    if (isAdmin) {
      writeJson(ADMIN_DRAFT_KEY, {
        timers,
        activeTimerId,
        dirty: isDirty,
        publishedVersion,
        savedAt: new Date().toISOString()
      });
    }
  }, [activeTimerId, isAdmin, isDirty, isLoaded, isSupabaseConfigured, publishedVersion, timers]);

  useEffect(() => {
    if (!isLoaded || !isSupabaseConfigured || isAdmin) return undefined;
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      refreshPublicData().catch(error => {
        setLoadError(error.message || '检查公开数据更新失败');
        setLoadErrorCode(error.code || 'UNKNOWN');
      });
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isAdmin, isLoaded, isSupabaseConfigured, refreshPublicData]);

  const markDirty = useCallback(() => {
    if (isSupabaseConfigured && isAdmin) {
      setIsDirty(true);
      setDataSource('draft');
    }
  }, [isAdmin, isSupabaseConfigured]);

  const setActiveTimerId = useCallback(id => {
    setActiveTimerIdState(id);
    markDirty();
  }, [markDirty]);

  const addTimer = useCallback(timerData => {
    if (!canEdit) return null;
    const newTimer = {
      ...timerData,
      id: timerData.id || uuidv4(),
      createdAt: timerData.createdAt || new Date().toISOString(),
      isAutoGenerated: timerData.isAutoGenerated === true,
      type: timerData.type || 'countdown'
    };
    if (newTimer.type === 'anniversary') Object.assign(newTimer, {
      displayMode: newTimer.displayMode || 'totalDays',
      countRule: newTimer.countRule || 'elapsed',
      calendarType: newTimer.calendarType || 'solar',
      annualReminder: Boolean(newTimer.annualReminder),
      reminderAdvanceDays: Number(newTimer.reminderAdvanceDays || 0),
      milestoneDays: newTimer.milestoneDays || [],
      milestones: newTimer.milestones || []
    });

    setTimers(previous => previous.some(timer => timer.id === newTimer.id)
      ? previous.map(timer => timer.id === newTimer.id ? newTimer : timer)
      : [...previous, newTimer]);
    setActiveTimerIdState(newTimer.id);
    markDirty();

    if (newTimer.type === 'countdown' || !newTimer.type) {
      addNotification({
        id: newTimer.id,
        title: newTimer.name,
        targetTime: new Date(newTimer.targetDate).getTime()
      }).catch(error => console.log('设置通知失败:', error));
    }
    if (newTimer.type === 'anniversary') syncAnniversaryNotification(newTimer);
    return newTimer.id;
  }, [canEdit, markDirty]);

  const deleteTimer = useCallback(id => {
    if (!canEdit) return false;
    removeNotification(id);
    removeNotification(`${id}-anniversary`);
    setTimers(previous => {
      const remaining = previous.filter(timer => timer.id !== id);
      const nextTimers = remaining.length ? remaining : [getDefaultTimer()];
      setActiveTimerIdState(current => current === id
        ? resolveActiveTimerId(nextTimers, null)
        : resolveActiveTimerId(nextTimers, current));
      return nextTimers;
    });
    markDirty();
    return true;
  }, [canEdit, markDirty]);

  const updateTimer = useCallback((id, updatedData) => {
    if (!canEdit) return false;
    setTimers(previous => {
      const nextTimers = previous.map(timer => {
        if (timer.id !== id) return timer;
        const resolved = typeof updatedData === 'function' ? updatedData(timer) : updatedData;
        return { ...timer, ...resolved };
      });
      const updatedTimer = nextTimers.find(timer => timer.id === id);
      if (updatedTimer && (updatedTimer.type === 'countdown' || !updatedTimer.type)) {
        addNotification({
          id: updatedTimer.id,
          title: updatedTimer.name,
          targetTime: new Date(updatedTimer.targetDate).getTime()
        }).catch(error => console.log('更新通知失败:', error));
      }
      if (updatedTimer?.type === 'anniversary') syncAnniversaryNotification(updatedTimer);
      return nextTimers;
    });
    markDirty();
    return true;
  }, [canEdit, markDirty]);

  const checkAndUpdateDefaultTimer = useCallback(() => {
    if (!canEdit) return;
    const defaultTimer = timers.find(timer => timer.isAutoGenerated === true);
    if (!defaultTimer || new Date(defaultTimer.targetDate) > new Date()) return;
    const replacement = getDefaultTimer();
    setTimers(previous => [replacement, ...previous.filter(timer => timer.id !== defaultTimer.id)]);
    setActiveTimerIdState(current => current === defaultTimer.id ? replacement.id : current);
    markDirty();
  }, [canEdit, markDirty, timers]);

  useEffect(() => {
    if (!isLoaded || !canEdit || timers.length === 0) return undefined;
    checkAndUpdateDefaultTimer();
    const intervalId = setInterval(checkAndUpdateDefaultTimer, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [canEdit, checkAndUpdateDefaultTimer, isLoaded, timers.length]);

  const importLocalTimers = useCallback(() => {
    if (!canEdit || localImportCandidate.timers.length === 0) return false;
    applyCollection(localImportCandidate.timers, localImportCandidate.activeTimerId, { scheduleNotifications: true });
    markDirty();
    return true;
  }, [applyCollection, canEdit, localImportCandidate, markDirty]);

  const publishTimers = useCallback(async () => {
    if (!isSupabaseConfigured) throw new Error('Supabase 尚未配置。');
    if (!isAdmin || !user) throw new Error('请先登录管理员账号。');
    if (!timers.length) throw new Error('至少需要一个计时器才能发布。');

    setIsPublishing(true);
    setPublishError('');
    try {
      const page = await publishTimerPage({
        ownerId: user.id,
        timers,
        featuredTimerId: activeTimerId,
        expectedVersion: publishedVersion
      });
      cachePublicPage(page);
      writeJson(ADMIN_DRAFT_KEY, {
        timers,
        activeTimerId: page.featuredTimerId,
        dirty: false,
        publishedVersion: page.version,
        savedAt: new Date().toISOString()
      });
      setPublishedVersion(page.version);
      setPublishedAt(page.publishedAt);
      setHasPublicPage(true);
      setIsDirty(false);
      setDataSource('public');
      return page;
    } catch (error) {
      setPublishError(error.message || '发布失败');
      throw error;
    } finally {
      setIsPublishing(false);
    }
  }, [activeTimerId, isAdmin, isSupabaseConfigured, publishedVersion, timers, user]);

  const getActiveTimer = useCallback(
    () => timers.find(timer => timer.id === activeTimerId) || null,
    [activeTimerId, timers]
  );

  return (
    <TimerContext.Provider value={{
      timers,
      activeTimerId,
      setActiveTimerId,
      addTimer,
      deleteTimer,
      updateTimer,
      getActiveTimer,
      holidaysList,
      checkAndUpdateDefaultTimer,
      canEdit,
      isSupabaseConfigured,
      isLoaded,
      isPublishing,
      isDirty,
      loadError,
      loadErrorCode,
      publishError,
      dataSource,
      hasPublicPage,
      publishedVersion,
      publishedAt,
      hasLocalImport: localImportCandidate.timers.length > 0,
      localImportCount: localImportCandidate.timers.length,
      importLocalTimers,
      publishTimers,
      refreshPublicData
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimers() {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimers must be used within TimerProvider');
  return context;
}
