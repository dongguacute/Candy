import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { dosageKeyForI18n } from '../dosageKey';
import { copy } from '@candy/copy';
import {
  cancelNotificationIds,
  ensureNotificationPermission,
  isNotificationPermissionGranted,
  isTauriMobileShell,
  notifyNative,
  scheduleDailyAlarmNotification,
  SLOT_NOTIFICATION_IDS,
} from '../lib/tauriNotifications';
import cnMessages from '../../messages/cn.json';
import enMessages from '../../messages/en.json';

export type Theme = 'auto' | 'light' | 'dark';
export type Language = 'cn' | 'en';
export type TimeToTake = 'breakfast' | 'lunch' | 'dinner' | 'bedtime';

export interface Medication {
  id: string;
  name: string;
  times: TimeToTake[];
  iconType: 'emoji' | 'image';
  iconValue: string;
  dosage?: string;
}

/** 当前时间 ≥ 预设时间即出现在待服用列表；超过此时长未勾选则自动清除（毫秒） */
export const PENDING_INTAKE_TTL_MS = 6 * 60 * 60 * 1000;

export interface PendingIntakeItem {
  id: string;
  medicationId: string;
  timeSlot: TimeToTake;
  /** 该次提醒写入列表的时间 */
  createdAt: number;
}

/** 比较两条药物数据是否完全一致（忽略 id） */
function medicationDataEqual(
  a: Omit<Medication, 'id'>,
  b: Omit<Medication, 'id'>
): boolean {
  if (a.name.trim() !== b.name.trim()) return false;
  if (a.iconType !== b.iconType || a.iconValue !== b.iconValue) return false;
  if ((a.dosage ?? '1') !== (b.dosage ?? '1')) return false;
  const ta = [...a.times].sort().join('\0');
  const tb = [...b.times].sort().join('\0');
  return ta === tb;
}

function toMedicationData(m: Medication): Omit<Medication, 'id'> {
  return {
    name: m.name,
    times: m.times,
    dosage: m.dosage,
    iconType: m.iconType,
    iconValue: m.iconValue,
  };
}

const messagesMap = {
  cn: cnMessages,
  en: enMessages
};

function isValidLanguage(value: string | null): value is Language {
  return value === 'cn' || value === 'en';
}

/** 无本地偏好时：浏览器语言为中文系 → cn，否则 en */
function detectBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  const list =
    typeof navigator.languages !== 'undefined' && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];
  for (const tag of list) {
    if (tag.toLowerCase().startsWith('zh')) return 'cn';
  }
  return 'en';
}

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  medications: Medication[];
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  bedtimeTime: string;
  setBreakfastTime: (time: string) => void;
  setLunchTime: (time: string) => void;
  setDinnerTime: (time: string) => void;
  setBedtimeTime: (time: string) => void;
  addMedication: (med: Omit<Medication, 'id'>) => boolean;
  updateMedication: (id: string, med: Omit<Medication, 'id'>) => boolean;
  removeMedication: (id: string) => void;
  clearAllData: () => void;
  pendingIntake: PendingIntakeItem[];
  markPendingIntakeDone: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('auto');
  const [language, setLanguageState] = useState<Language>('en');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [breakfastTime, setBreakfastTimeState] = useState<string>('08:00');
  const [lunchTime, setLunchTimeState] = useState<string>('12:00');
  const [dinnerTime, setDinnerTimeState] = useState<string>('19:00');
  const [bedtimeTime, setBedtimeTimeState] = useState<string>('22:00');
  const [pendingIntake, setPendingIntake] = useState<PendingIntakeItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const lastNotifiedRef = useRef<Record<string, string>>({});
  /** 今日已点击「已服用」的 pending id，避免清除后又被定时检测加回 */
  const completedIntakeIdsRef = useRef<Set<string>>(new Set());

  const persistCompletedIntakeIds = useCallback(() => {
    localStorage.setItem(
      'completedIntakeIds',
      JSON.stringify([...completedIntakeIdsRef.current])
    );
  }, []);

  const t = useCallback((path: string) => {
    const keys = path.split('.');
    let current: unknown = messagesMap[language];
    for (const key of keys) {
      if (current && typeof current === 'object' && key in (current as object)) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return path;
      }
    }
    return typeof current === 'string' ? current : path;
  }, [language]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme;
    if (storedTheme) setThemeState(storedTheme);

    const storedLanguage = localStorage.getItem('language');
    if (isValidLanguage(storedLanguage)) {
      setLanguageState(storedLanguage);
    } else {
      setLanguageState(detectBrowserLanguage());
    }
    
    const storedMeds = localStorage.getItem('medications');
    if (storedMeds) setMedications(JSON.parse(storedMeds));

    const storedPending = localStorage.getItem('pendingIntake');
    const todayStr = new Date().toDateString();
    if (storedPending) {
      try {
        const parsed: PendingIntakeItem[] = JSON.parse(storedPending);
        const now = Date.now();
        let medIds: Set<string> | null = null;
        if (storedMeds) {
          const meds: Medication[] = JSON.parse(storedMeds);
          medIds = new Set(meds.map((m) => m.id));
        }
        setPendingIntake(
          parsed.filter((p) => {
            if (now - p.createdAt > PENDING_INTAKE_TTL_MS) return false;
            if (medIds && !medIds.has(p.medicationId)) return false;
            return true;
          })
        );
      } catch {
        // ignore
      }
    }

    const storedCompleted = localStorage.getItem('completedIntakeIds');
    if (storedCompleted) {
      try {
        const parsed: string[] = JSON.parse(storedCompleted);
        completedIntakeIdsRef.current = new Set(parsed.filter((id) => id.endsWith(todayStr)));
        if (completedIntakeIdsRef.current.size !== parsed.length) {
          localStorage.setItem(
            'completedIntakeIds',
            JSON.stringify([...completedIntakeIdsRef.current])
          );
        }
      } catch {
        // ignore
      }
    }

    const storedBreakfastTime = localStorage.getItem('breakfastTime');
    if (storedBreakfastTime) setBreakfastTimeState(storedBreakfastTime);
    const storedLunchTime = localStorage.getItem('lunchTime');
    if (storedLunchTime) setLunchTimeState(storedLunchTime);
    const storedDinnerTime = localStorage.getItem('dinnerTime');
    if (storedDinnerTime) setDinnerTimeState(storedDinnerTime);
    const storedBedtimeTime = localStorage.getItem('bedtimeTime');
    if (storedBedtimeTime) setBedtimeTimeState(storedBedtimeTime);
    
    // Set mounted after state updates to avoid synchronous setState warning
    setTimeout(() => setMounted(true), 0);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('theme', theme);
    localStorage.setItem('language', language);
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme, language, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('medications', JSON.stringify(medications));
  }, [medications, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('pendingIntake', JSON.stringify(pendingIntake));
  }, [pendingIntake, mounted]);

  /** 超过 6 小时未勾选的条目自动移除 */
  useEffect(() => {
    if (!mounted) return;
    const prune = () => {
      const now = Date.now();
      setPendingIntake((prev) =>
        prev.filter((p) => now - p.createdAt <= PENDING_INTAKE_TTL_MS)
      );
    };
    const interval = setInterval(prune, 30000);
    prune();
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('breakfastTime', breakfastTime);
    localStorage.setItem('lunchTime', lunchTime);
    localStorage.setItem('dinnerTime', dinnerTime);
    localStorage.setItem('bedtimeTime', bedtimeTime);
  }, [breakfastTime, lunchTime, dinnerTime, bedtimeTime, mounted]);

  /** Tauri（含 Android）：请求 POST_NOTIFICATIONS 等（插件在原生侧已创建 default 通知渠道） */
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    void (async () => {
      const { isTauri } = await import('@tauri-apps/api/core');
      if (!isTauri() || cancelled) return;
      await ensureNotificationPermission();
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  /**
   * Android / iOS：用系统 Alarm 注册「每天在 HH:mm」的本地通知，进程被杀仍可触发。
   * 桌面 Tauri 仍依赖下方 setInterval + notifyNative。
   */
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    void (async () => {
      const { isTauri } = await import('@tauri-apps/api/core');
      if (!isTauri() || !isTauriMobileShell() || cancelled) return;
      if (!(await isNotificationPermissionGranted())) {
        await cancelNotificationIds(Object.values(SLOT_NOTIFICATION_IDS));
        return;
      }
      await cancelNotificationIds(Object.values(SLOT_NOTIFICATION_IDS));
      if (cancelled) return;

      const slots: TimeToTake[] = ['breakfast', 'lunch', 'dinner', 'bedtime'];
      const times: Record<TimeToTake, string> = {
        breakfast: breakfastTime,
        lunch: lunchTime,
        dinner: dinnerTime,
        bedtime: bedtimeTime,
      };

      for (const slot of slots) {
        if (cancelled) return;
        const relevantMeds = medications.filter((m) => m.times.includes(slot));
        if (relevantMeds.length === 0) continue;

        const [h, min] = times[slot].split(':').map(Number);
        const message = await copy(language);
        const medDetails = relevantMeds
          .map((m) => {
            const dosageText = m.dosage
              ? ` (${t(`Home.dosageOptions.${dosageKeyForI18n(m.dosage)}`)})`
              : '';
            return `${m.name}${dosageText}`;
          })
          .join(language === 'cn' ? '、' : ', ');
        const body = `${message}\n${t('Notifications.take')}${medDetails}`;

        try {
          await scheduleDailyAlarmNotification({
            id: SLOT_NOTIFICATION_IDS[slot],
            title: t('Notifications.timeToTake'),
            body,
            hour: h,
            minute: min,
          });
        } catch {
          // 单次失败不阻断其它时段
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    mounted,
    medications,
    breakfastTime,
    lunchTime,
    dinnerTime,
    bedtimeTime,
    language,
    t,
  ]);

  // 定时检查：当前时间 ≥ 预设时间即写入待服用（不依赖通知）；整点仅在已授权时发系统通知
  useEffect(() => {
    if (!mounted) return;

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.ready;
    }

    const parseHHMMToToday = (hhmm: string, ref: Date): Date => {
      const [h, m] = hhmm.split(':').map(Number);
      const d = new Date(ref);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const checkScheduled = async () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const today = now.toDateString();

      const timeConfigs: Record<TimeToTake, string> = {
        breakfast: breakfastTime,
        lunch: lunchTime,
        dinner: dinnerTime,
        bedtime: bedtimeTime,
      };

      // 跨日：只保留「日期后缀为今日」的已完成 id，并落盘
      const completed = completedIntakeIdsRef.current;
      let completedPruned = false;
      for (const id of [...completed]) {
        if (!id.endsWith(today)) {
          completed.delete(id);
          completedPruned = true;
        }
      }
      if (completedPruned) {
        persistCompletedIntakeIds();
      }

      setPendingIntake((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const toAdd: PendingIntakeItem[] = [];
        for (const [key, scheduledTime] of Object.entries(timeConfigs)) {
          const slot = key as TimeToTake;
          if (now < parseHHMMToToday(scheduledTime, now)) continue;

          const relevantMeds = medications.filter((m) => m.times.includes(slot));
          for (const med of relevantMeds) {
            const id = `${med.id}-${slot}-${today}`;
            if (existingIds.has(id)) continue;
            if (completed.has(id)) continue;
            toAdd.push({
              id,
              medicationId: med.id,
              timeSlot: slot,
              createdAt: Date.now(),
            });
            existingIds.add(id);
          }
        }
        if (toAdd.length === 0) return prev;
        return [...prev, ...toAdd];
      });

      for (const [key, scheduledTime] of Object.entries(timeConfigs)) {
        if (currentTime !== scheduledTime) continue;
        if (lastNotifiedRef.current[key] === today) continue;

        const slot = key as TimeToTake;
        const relevantMeds = medications.filter((m) => {
          if (!m.times.includes(slot)) return false;
          return !completedIntakeIdsRef.current.has(`${m.id}-${slot}-${today}`);
        });
        if (relevantMeds.length === 0) continue;

        const { isTauri } = await import('@tauri-apps/api/core');
        // 移动端曾完全依赖 AlarmManager；国产系统上闹钟可能不响，前台开着也无提示。
        // 前台且页面可见时仍走 notifyNative，与系统闹钟并行；后台/划掉进程仍只靠已注册的定时通知。
        if (
          isTauri() &&
          isTauriMobileShell() &&
          typeof document !== 'undefined' &&
          document.visibilityState !== 'visible'
        ) {
          continue;
        }

        const message = await copy(language);
        const medDetails = relevantMeds.map((m) => {
          const dosageText = m.dosage
            ? ` (${t(`Home.dosageOptions.${dosageKeyForI18n(m.dosage)}`)})`
            : '';
          return `${m.name}${dosageText}`;
        }).join(language === 'cn' ? '、' : ', ');
        const body = `${message}\n${t('Notifications.take')}${medDetails}`;

        if (isTauri()) {
          if (!(await isNotificationPermissionGranted())) continue;
          try {
            await notifyNative({
              title: t('Notifications.timeToTake'),
              body,
            });
            lastNotifiedRef.current[key] = today;
          } catch {
            // 忽略单次失败，避免打断定时器
          }
          continue;
        }

        const canNotify =
          typeof Notification !== 'undefined' && Notification.permission === 'granted';
        if (!canNotify) continue;

        const options = {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          vibrate: [200, 100, 200],
          tag: key,
          renotify: true,
        };

        try {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(t('Notifications.timeToTake'), options);
          } else {
            new Notification(t('Notifications.timeToTake'), options);
          }
          lastNotifiedRef.current[key] = today;
        } catch {
          // 单次展示失败不标记已提醒，便于下一 tick 重试
        }
      }
    };

    const interval = setInterval(checkScheduled, 30000);
    void checkScheduled();

    return () => clearInterval(interval);
  }, [
    mounted,
    breakfastTime,
    lunchTime,
    dinnerTime,
    bedtimeTime,
    medications,
    language,
    t,
    persistCompletedIntakeIds,
  ]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const setLanguage = (newLang: Language) => setLanguageState(newLang);

  const setBreakfastTime = (newTime: string) => setBreakfastTimeState(newTime);
  const setLunchTime = (newTime: string) => setLunchTimeState(newTime);
  const setDinnerTime = (newTime: string) => setDinnerTimeState(newTime);
  const setBedtimeTime = (newTime: string) => setBedtimeTimeState(newTime);

  const addMedication = (med: Omit<Medication, 'id'>) => {
    let isDuplicate = false;
    setMedications((prev) => {
      isDuplicate = prev.some((m) => medicationDataEqual(med, toMedicationData(m)));
      if (isDuplicate) return prev;
      return [...prev, { ...med, id: Date.now().toString() }];
    });
    return !isDuplicate;
  };

  const updateMedication = (id: string, updates: Omit<Medication, 'id'>) => {
    let isDuplicate = false;
    setMedications((prev) => {
      isDuplicate = prev.some(
        (m) =>
          m.id !== id && medicationDataEqual(updates, toMedicationData(m))
      );
      if (isDuplicate) return prev;
      return prev.map((m) => (m.id === id ? { ...updates, id } : m));
    });
    return !isDuplicate;
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
    setPendingIntake((prev) => prev.filter((p) => p.medicationId !== id));
    let removed = false;
    for (const cid of [...completedIntakeIdsRef.current]) {
      if (cid.startsWith(`${id}-`)) {
        completedIntakeIdsRef.current.delete(cid);
        removed = true;
      }
    }
    if (removed) persistCompletedIntakeIds();
  };

  const markPendingIntakeDone = (itemId: string) => {
    setPendingIntake((prev) => prev.filter((p) => p.id !== itemId));
    completedIntakeIdsRef.current.add(itemId);
    persistCompletedIntakeIds();
  };

  const clearAllData = () => {
    setMedications([]);
    setThemeState('auto');
    localStorage.removeItem('language');
    setLanguageState(detectBrowserLanguage());
    setBreakfastTimeState('08:00');
    setLunchTimeState('12:00');
    setDinnerTimeState('19:00');
    setBedtimeTimeState('22:00');
    localStorage.removeItem('medications');
    localStorage.removeItem('theme');
    localStorage.removeItem('breakfastTime');
    localStorage.removeItem('lunchTime');
    localStorage.removeItem('dinnerTime');
    localStorage.removeItem('bedtimeTime');
    localStorage.removeItem('pendingIntake');
    localStorage.removeItem('completedIntakeIds');
    completedIntakeIdsRef.current = new Set();
    setPendingIntake([]);
  };

  return (
    <AppContext.Provider value={{ 
      theme, 
      setTheme, 
      language,
      setLanguage,
      t,
      medications, 
      breakfastTime, 
      lunchTime, 
      dinnerTime, 
      bedtimeTime, 
      setBreakfastTime, 
      setLunchTime, 
      setDinnerTime, 
      setBedtimeTime, 
      addMedication,
      updateMedication,
      removeMedication, 
      clearAllData,
      pendingIntake,
      markPendingIntakeDone,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
