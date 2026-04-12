import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { MdSettings, MdDeleteForever, MdWarning, MdAccessTime, MdSave, MdCheckCircle, MdInfo, MdOpenInNew, MdNotificationsActive } from 'react-icons/md';
import { ensureNotificationPermission, notifyNative } from '../lib/tauriNotifications';
import { TimePicker } from '../components/TimePicker';

export default function Settings() {
  const { 
    theme, 
    setTheme, 
    language,
    setLanguage,
    t,
    clearAllData, 
    breakfastTime, 
    lunchTime, 
    dinnerTime, 
    bedtimeTime, 
    setBreakfastTime, 
    setLunchTime, 
    setDinnerTime, 
    setBedtimeTime 
  } = useAppContext();
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [testNotifyBusy, setTestNotifyBusy] = useState(false);

  // 临时状态，用于在点击保存前暂存修改
  const [tempTimes, setTempTimes] = useState({
    breakfast: breakfastTime,
    lunch: lunchTime,
    dinner: dinnerTime,
    bedtime: bedtimeTime
  });

  // 当 Context 中的时间改变时同步（例如初始化或清除数据）
  useEffect(() => {
    setTempTimes({
      breakfast: breakfastTime,
      lunch: lunchTime,
      dinner: dinnerTime,
      bedtime: bedtimeTime
    });
  }, [breakfastTime, lunchTime, dinnerTime, bedtimeTime]);

  const handleSave = () => {
    setIsSaving(true);
    
    // 模拟保存过程
    setTimeout(() => {
      setBreakfastTime(tempTimes.breakfast);
      setLunchTime(tempTimes.lunch);
      setDinnerTime(tempTimes.dinner);
      setBedtimeTime(tempTimes.bedtime);
      
      setIsSaving(false);
      setShowSavedMessage(true);
      
      // 3秒后隐藏成功提示
      setTimeout(() => setShowSavedMessage(false), 3000);
    }, 600);
  };

  const isDirty = 
    tempTimes.breakfast !== breakfastTime ||
    tempTimes.lunch !== lunchTime ||
    tempTimes.dinner !== dinnerTime ||
    tempTimes.bedtime !== bedtimeTime;

  const handleClear = () => {
    clearAllData();
    setShowConfirm(false);
    alert(t('Settings.allCleared'));
  };

  const handleTestNotification = async () => {
    setTestNotifyBusy(true);
    try {
      const { isTauri } = await import('@tauri-apps/api/core');
      if (isTauri()) {
        const ok = await ensureNotificationPermission();
        if (!ok) {
          alert(t('Settings.testNotificationDenied'));
          return;
        }
        await notifyNative({
          title: t('Settings.testNotificationTitle'),
          body: t('Settings.testNotificationBody'),
        });
        return;
      }
      if (typeof window === 'undefined' || !('Notification' in window)) {
        alert(t('Settings.testNotificationUnsupported'));
        return;
      }
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }
      if (perm !== 'granted') {
        alert(t('Settings.testNotificationDenied'));
        return;
      }
      new Notification(t('Settings.testNotificationTitle'), {
        body: t('Settings.testNotificationBody'),
        icon: '/icons/icon-192x192.png',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`${t('Settings.testNotificationFailed')}\n${msg}`);
    } finally {
      setTestNotifyBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FDEB9B] text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100">
            <MdSettings className="text-2xl" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-yellow-900 dark:text-yellow-100 sm:text-4xl">
            {t('Settings.title')}
          </h1>
        </div>
      </div>
      
      <div className="mb-6 rounded-[1.5rem] border-2 border-[#FDEB9B] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:mb-10 sm:rounded-[2.5rem] sm:p-10">
        <h2 className="mb-6 text-xl font-bold text-yellow-900 dark:text-yellow-100 sm:mb-8 sm:text-2xl">
          {t('Settings.appearance')}
        </h2>
        <div className="flex flex-wrap gap-3">
          {(['auto', 'light', 'dark'] as const).map((t_key) => (
            <button
              key={t_key}
              onClick={() => setTheme(t_key)}
              className={`flex-1 min-w-[5.5rem] rounded-full border-2 px-4 py-3 text-base font-bold transition-all active:scale-95 sm:min-w-0 sm:flex-none sm:px-8 sm:py-4 sm:text-lg ${
                theme === t_key
                  ? 'bg-[#FCD34D] text-yellow-950 border-[#FCD34D] shadow-md ring-4 ring-[#FDEB9B]/50 dark:bg-yellow-500 dark:border-yellow-500 dark:ring-yellow-600/30'
                  : 'bg-[#FFFDF0] dark:bg-gray-700 text-yellow-800 dark:text-gray-300 border-[#FDEB9B] dark:border-gray-600 hover:bg-[#FEF5C8] dark:hover:bg-gray-600'
              }`}
            >
              {t(`Settings.${t_key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-[1.5rem] border-2 border-[#FDEB9B] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:mb-10 sm:rounded-[2.5rem] sm:p-10">
        <h2 className="mb-6 text-xl font-bold text-yellow-900 dark:text-yellow-100 sm:mb-8 sm:text-2xl">
          {t('Settings.language')}
        </h2>
        <div className="flex flex-wrap gap-3">
          {(['cn', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`min-w-[7rem] flex-1 rounded-full border-2 px-4 py-3 text-base font-bold transition-all active:scale-95 sm:min-w-0 sm:flex-none sm:px-8 sm:py-4 sm:text-lg ${
                language === l
                  ? 'bg-[#FCD34D] text-yellow-950 border-[#FCD34D] shadow-md ring-4 ring-[#FDEB9B]/50 dark:bg-yellow-500 dark:border-yellow-500 dark:ring-yellow-600/30'
                  : 'bg-[#FFFDF0] dark:bg-gray-700 text-yellow-800 dark:text-gray-300 border-[#FDEB9B] dark:border-gray-600 hover:bg-[#FEF5C8] dark:hover:bg-gray-600'
              }`}
            >
              {l === 'cn' ? '简体中文' : 'English'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-[1.5rem] border-2 border-[#FDEB9B] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:mb-10 sm:rounded-[2.5rem] sm:p-10">
        <h2 className="mb-4 flex flex-wrap items-center gap-2 text-xl font-bold text-yellow-900 dark:text-yellow-100 sm:mb-6 sm:gap-3 sm:text-2xl">
          <MdNotificationsActive className="text-2xl sm:text-3xl" aria-hidden />
          {t('Settings.notificationsSection')}
        </h2>
        <p className="mb-6 text-sm font-medium leading-relaxed text-yellow-800/85 dark:text-gray-300/90 sm:text-base">
          {t('Settings.notificationsHint')}
        </p>
        <button
          type="button"
          onClick={() => void handleTestNotification()}
          disabled={testNotifyBusy}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#FCD34D] bg-[#FFFDF0] px-6 py-4 text-base font-bold text-yellow-950 transition-all hover:bg-[#FEF5C8] active:scale-[0.98] disabled:opacity-60 dark:border-yellow-600 dark:bg-gray-700/80 dark:text-yellow-100 dark:hover:bg-gray-700 sm:w-auto sm:px-10"
        >
          {testNotifyBusy ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-950/30 border-t-yellow-950 dark:border-yellow-100/30 dark:border-t-yellow-100" />
          ) : (
            <MdNotificationsActive className="text-xl" aria-hidden />
          )}
          {t('Settings.testNotificationButton')}
        </button>
      </div>

      <div className="mb-6 rounded-[1.5rem] border-2 border-[#FDEB9B] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:mb-10 sm:rounded-[2.5rem] sm:p-10">
        <h2 className="mb-6 flex flex-wrap items-center gap-2 text-xl font-bold text-yellow-900 dark:text-yellow-100 sm:mb-8 sm:gap-3 sm:text-2xl">
          <MdAccessTime className="text-2xl sm:text-3xl" /> {t('Settings.presetTimes')}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#FDEB9B] bg-[#FFFDF0] p-4 dark:border-gray-600 dark:bg-gray-700/50 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-6">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 sm:text-xl">
                {t('Settings.breakfast')}
              </h3>
              <p className="text-sm font-medium text-yellow-800/60 dark:text-gray-400 sm:text-base">
                {t('Settings.breakfastDesc')}
              </p>
            </div>
            <div className="w-full shrink-0 sm:w-auto sm:self-center">
            <TimePicker
              label={t('Settings.breakfast')}
              value={tempTimes.breakfast}
              onChange={(v) => setTempTimes({ ...tempTimes, breakfast: v })}
            />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#FDEB9B] bg-[#FFFDF0] p-4 dark:border-gray-600 dark:bg-gray-700/50 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-6">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 sm:text-xl">
                {t('Settings.lunch')}
              </h3>
              <p className="text-sm font-medium text-yellow-800/60 dark:text-gray-400 sm:text-base">
                {t('Settings.lunchDesc')}
              </p>
            </div>
            <div className="w-full shrink-0 sm:w-auto sm:self-center">
            <TimePicker
              label={t('Settings.lunch')}
              value={tempTimes.lunch}
              onChange={(v) => setTempTimes({ ...tempTimes, lunch: v })}
            />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#FDEB9B] bg-[#FFFDF0] p-4 dark:border-gray-600 dark:bg-gray-700/50 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-6">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 sm:text-xl">
                {t('Settings.dinner')}
              </h3>
              <p className="text-sm font-medium text-yellow-800/60 dark:text-gray-400 sm:text-base">
                {t('Settings.dinnerDesc')}
              </p>
            </div>
            <div className="w-full shrink-0 sm:w-auto sm:self-center">
            <TimePicker
              label={t('Settings.dinner')}
              value={tempTimes.dinner}
              onChange={(v) => setTempTimes({ ...tempTimes, dinner: v })}
            />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#FDEB9B] bg-[#FFFDF0] p-4 dark:border-gray-600 dark:bg-gray-700/50 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-6">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 sm:text-xl">
                {t('Settings.bedtime')}
              </h3>
              <p className="text-sm font-medium text-yellow-800/60 dark:text-gray-400 sm:text-base">
                {t('Settings.bedtimeDesc')}
              </p>
            </div>
            <div className="w-full shrink-0 sm:w-auto sm:self-center">
            <TimePicker
              label={t('Settings.bedtime')}
              value={tempTimes.bedtime}
              onChange={(v) => setTempTimes({ ...tempTimes, bedtime: v })}
            />
            </div>
          </div>
        </div>

        {/* 保存按钮区域 */}
        <div className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:items-center sm:gap-6">
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={`flex w-full items-center justify-center gap-3 rounded-full px-8 py-4 text-lg font-black shadow-lg transition-all active:scale-95 sm:w-auto sm:px-10 sm:py-5 sm:text-xl ${
              isDirty && !isSaving
                ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-950 hover:shadow-xl hover:-translate-y-1'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
            }`}
          >
            {isSaving ? (
              <div className="w-6 h-6 border-4 border-yellow-950/20 border-t-yellow-950 rounded-full animate-spin" />
            ) : (
              <MdSave className="text-2xl" />
            )}
            {isSaving 
              ? t('Settings.saving') 
              : t('Settings.save')}
          </button>

          {showSavedMessage && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold animate-in fade-in slide-in-from-left-4">
              <MdCheckCircle className="text-2xl" />
              <span>{t('Settings.saved')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-[1.5rem] border-2 border-[#FDEB9B] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:mb-10 sm:rounded-[2.5rem] sm:p-10">
        <h2 className="mb-4 flex flex-wrap items-center gap-2 text-xl font-bold text-yellow-900 dark:text-yellow-100 sm:gap-3 sm:text-2xl">
          <MdInfo className="text-2xl shrink-0 text-yellow-600 dark:text-yellow-400 sm:text-3xl" aria-hidden />
          {t('Settings.disclaimerTitle')}
        </h2>
        <p className="mb-6 text-sm font-medium leading-relaxed text-yellow-800/85 dark:text-gray-300/90 sm:text-base">
          {t('Settings.disclaimerBody')}
        </p>
        <a
          href="https://github.com/dongguacute/Candy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-2 break-all rounded-full border-2 border-[#FDEB9B] bg-[#FFFDF0] px-4 py-2.5 text-sm font-bold text-yellow-900 transition-colors hover:border-[#FCD34D] hover:bg-[#FEF5C8] dark:border-gray-600 dark:bg-gray-700/80 dark:text-yellow-100 dark:hover:border-yellow-500 dark:hover:bg-gray-700"
        >
          <MdOpenInNew className="shrink-0 text-lg" aria-hidden />
          {t('Settings.sourceOnGitHub')}
          <span className="sr-only">{t('Settings.linkOpensNewTab')}</span>
        </a>
      </div>

      <div className="relative overflow-hidden rounded-[1.5rem] border-2 border-red-200 bg-[#FFF5F5] p-6 shadow-sm dark:border-red-800/30 dark:bg-red-900/20 sm:rounded-[2.5rem] sm:p-10">
        <div className="absolute -right-10 -top-10 text-red-100 dark:text-red-900/10 rotate-12">
          <MdWarning className="text-[15rem]" />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400 flex items-center gap-3">
            <MdWarning className="text-3xl" /> {t('Settings.dangerZone')}
          </h2>
          <p className="text-red-800/70 dark:text-red-300/70 mb-8 text-lg font-medium">
            {t('Settings.dangerDesc')}
          </p>
          
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-3 px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full shadow-md transition-all transform hover:scale-105"
            >
              <MdDeleteForever className="text-2xl" /> {t('Settings.clearAll')}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center bg-white/50 dark:bg-gray-800/50 p-6 rounded-[2rem] border border-red-200 dark:border-red-800/50">
              <span className="text-red-600 dark:text-red-400 font-bold text-lg flex items-center gap-2">
                <MdWarning className="text-2xl" /> {t('Settings.areYouSure')}
              </span>
              <div className="flex gap-4">
                <button
                  onClick={handleClear}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-md transition-all transform hover:scale-105"
                >
                  {t('Home.confirm')}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-8 py-3 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-full border-2 border-gray-200 dark:border-gray-600 transition-all"
                >
                  {t('Home.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
