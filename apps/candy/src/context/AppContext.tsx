import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { copy } from '@candy/copy';
import cnMessages from '../../messages/cn.json';
import enMessages from '../../messages/en.json';

export type Theme = 'auto' | 'light' | 'dark';
export type Language = 'cn' | 'en';
export type TimeToTake = 'breakfast' | 'lunch' | 'dinner' | 'bedtime';

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
  removeMedication: (id: string) => void;
  clearAllData: () => void;
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
  const [mounted, setMounted] = useState(false);
  const lastNotifiedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedTheme) setThemeState(storedTheme);

    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage) setLanguageState(storedLanguage);
    
    const storedMeds = localStorage.getItem('medications');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedMeds) setMedications(JSON.parse(storedMeds));

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
    localStorage.setItem('breakfastTime', breakfastTime);
    localStorage.setItem('lunchTime', lunchTime);
    localStorage.setItem('dinnerTime', dinnerTime);
    localStorage.setItem('bedtimeTime', bedtimeTime);
  }, [breakfastTime, lunchTime, dinnerTime, bedtimeTime, mounted]);

  // 请求通知权限
  useEffect(() => {
    if (mounted && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [mounted]);

  // 定时检查提醒
  useEffect(() => {
    if (!mounted) return;

    // 注册 Service Worker 并在后台运行
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // SW 已就绪
      });
    }

    const checkNotifications = async () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const today = now.toDateString();

      const timeConfigs: Record<TimeToTake, string> = {
        breakfast: breakfastTime,
        lunch: lunchTime,
        dinner: dinnerTime,
        bedtime: bedtimeTime,
      };

      for (const [key, scheduledTime] of Object.entries(timeConfigs)) {
        if (currentTime === scheduledTime) {
          // 确保同一时间点今天只提醒一次
          if (lastNotifiedRef.current[key] !== today) {
            const relevantMeds = medications.filter(m => m.times.includes(key as TimeToTake));
            if (relevantMeds.length > 0) {
              const message = await copy(language);
              const medNames = relevantMeds.map(m => m.name).join(language === 'cn' ? '、' : ', ');
              
              const options = {
                body: `${message}\n${t('Notifications.take')}${medNames}`,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                vibrate: [200, 100, 200],
                tag: key,
                renotify: true
              };

              if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                const registration = await navigator.serviceWorker.ready;
                registration.showNotification(t('Notifications.timeToTake'), options);
              } else {
                new Notification(t('Notifications.timeToTake'), options);
              }
              
              lastNotifiedRef.current[key] = today;
            }
          }
        }
      }
    };

    const interval = setInterval(checkNotifications, 30000); // 每30秒检查一次
    checkNotifications(); // 立即检查一次

    return () => clearInterval(interval);
  }, [mounted, breakfastTime, lunchTime, dinnerTime, bedtimeTime, medications]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const setLanguage = (newLang: Language) => setLanguageState(newLang);

  const setBreakfastTime = (newTime: string) => setBreakfastTimeState(newTime);
  const setLunchTime = (newTime: string) => setLunchTimeState(newTime);
  const setDinnerTime = (newTime: string) => setDinnerTimeState(newTime);
  const setBedtimeTime = (newTime: string) => setBedtimeTimeState(newTime);

  const t = (path: string) => {
    const keys = path.split('.');
    let current: any = messagesMap[language];
    for (const key of keys) {
      if (current && current[key]) {
        current = current[key];
      } else {
        return path;
      }
    }
    return current;
  };

  const addMedication = (med: Omit<Medication, 'id'>) => {
    setMedications([...medications, { ...med, id: Date.now().toString() }]);
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
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
      removeMedication, 
      clearAllData 
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
