import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { dosageKeyForI18n } from '../dosageKey';
import { copy } from '@candy/copy';
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

const messagesMap = {
  cn: cnMessages,
  en: enMessages
};

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
  addMedication: (med: Omit<Medication, 'id'>) => void;
  updateMedication: (id: string, med: Omit<Medication, 'id'>) => void;
  removeMedication: (id: string) => void;
  clearAllData: () => void;
  pendingIntake: PendingIntakeItem[];
  markPendingIntakeDone: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('auto');
  const [language, setLanguageState] = useState<Language>('cn');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [breakfastTime, setBreakfastTimeState] = useState<string>('08:00');
  const [lunchTime, setLunchTimeState] = useState<string>('12:00');
  const [dinnerTime, setDinnerTimeState] = useState<string>('19:00');
  const [bedtimeTime, setBedtimeTimeState] = useState<string>('22:00');
  const [pendingIntake, setPendingIntake] = useState<PendingIntakeItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const lastNotifiedRef = useRef<Record<string, string>>({});

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

    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage) setLanguageState(storedLanguage);
    
    const storedMeds = localStorage.getItem('medications');
    if (storedMeds) setMedications(JSON.parse(storedMeds));

    const storedPending = localStorage.getItem('pendingIntake');
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
  }, [theme, mounted]);

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

        const relevantMeds = medications.filter((m) => m.times.includes(key as TimeToTake));
        if (relevantMeds.length === 0) continue;

        lastNotifiedRef.current[key] = today;

        const canNotify =
          typeof Notification !== 'undefined' && Notification.permission === 'granted';
        if (!canNotify) continue;

        const message = await copy(language);
        const medDetails = relevantMeds.map((m) => {
          const dosageText = m.dosage
            ? ` (${t(`Home.dosageOptions.${dosageKeyForI18n(m.dosage)}`)})`
            : '';
          return `${m.name}${dosageText}`;
        }).join(language === 'cn' ? '、' : ', ');

        const options = {
          body: `${message}\n${t('Notifications.take')}${medDetails}`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          vibrate: [200, 100, 200],
          tag: key,
          renotify: true,
        };

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification(t('Notifications.timeToTake'), options);
        } else {
          new Notification(t('Notifications.timeToTake'), options);
        }
      }
    };

    const interval = setInterval(checkScheduled, 30000);
    void checkScheduled();

    return () => clearInterval(interval);
  }, [mounted, breakfastTime, lunchTime, dinnerTime, bedtimeTime, medications, language, t]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const setLanguage = (newLang: Language) => setLanguageState(newLang);

  const setBreakfastTime = (newTime: string) => setBreakfastTimeState(newTime);
  const setLunchTime = (newTime: string) => setLunchTimeState(newTime);
  const setDinnerTime = (newTime: string) => setDinnerTimeState(newTime);
  const setBedtimeTime = (newTime: string) => setBedtimeTimeState(newTime);

  const addMedication = (med: Omit<Medication, 'id'>) => {
    setMedications([...medications, { ...med, id: Date.now().toString() }]);
  };

  const updateMedication = (id: string, updates: Omit<Medication, 'id'>) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...updates, id } : m))
    );
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
    setPendingIntake((prev) => prev.filter((p) => p.medicationId !== id));
  };

  const markPendingIntakeDone = (itemId: string) => {
    setPendingIntake((prev) => prev.filter((p) => p.id !== itemId));
  };

  const clearAllData = () => {
    setMedications([]);
    setThemeState('auto');
    setLanguageState('cn');
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
