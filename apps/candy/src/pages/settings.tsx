import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { MdSettings, MdDeleteForever, MdWarning, MdAccessTime, MdSave, MdCheckCircle } from 'react-icons/md';
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-[#FDEB9B] dark:bg-yellow-600 rounded-full flex items-center justify-center text-yellow-800 dark:text-yellow-100">
          <MdSettings className="text-2xl" />
        </div>
        <h1 className="text-4xl font-extrabold text-yellow-900 dark:text-yellow-100 tracking-tight">
          {t('Settings.title')}
        </h1>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 mb-10 shadow-sm border-2 border-[#FDEB9B] dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-8 text-yellow-900 dark:text-yellow-100">
          {t('Settings.appearance')}
        </h2>
        <div className="flex gap-4">
          {(['auto', 'light', 'dark'] as const).map((t_key) => (
            <button
              key={t_key}
              onClick={() => setTheme(t_key)}
              className={`px-8 py-4 rounded-full font-bold text-lg transition-all transform active:scale-95 border-2 ${
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

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 mb-10 shadow-sm border-2 border-[#FDEB9B] dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-8 text-yellow-900 dark:text-yellow-100">
          {t('Settings.language')}
        </h2>
        <div className="flex gap-4">
          {(['cn', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`px-8 py-4 rounded-full font-bold text-lg transition-all transform active:scale-95 border-2 ${
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

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 mb-10 shadow-sm border-2 border-[#FDEB9B] dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-8 text-yellow-900 dark:text-yellow-100 flex items-center gap-3">
          <MdAccessTime className="text-3xl" /> {t('Settings.presetTimes')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-6 bg-[#FFFDF0] dark:bg-gray-700/50 rounded-3xl border-2 border-[#FDEB9B] dark:border-gray-600">
            <div>
              <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                {t('Settings.breakfast')}
              </h3>
              <p className="text-yellow-800/60 dark:text-gray-400 font-medium">
                {t('Settings.breakfastDesc')}
              </p>
            </div>
            <TimePicker
              label={t('Settings.breakfast')}
              value={tempTimes.breakfast}
              onChange={(v) => setTempTimes({ ...tempTimes, breakfast: v })}
            />
          </div>

          <div className="flex items-center justify-between p-6 bg-[#FFFDF0] dark:bg-gray-700/50 rounded-3xl border-2 border-[#FDEB9B] dark:border-gray-600">
            <div>
              <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                {t('Settings.lunch')}
              </h3>
              <p className="text-yellow-800/60 dark:text-gray-400 font-medium">
                {t('Settings.lunchDesc')}
              </p>
            </div>
            <TimePicker
              label={t('Settings.lunch')}
              value={tempTimes.lunch}
              onChange={(v) => setTempTimes({ ...tempTimes, lunch: v })}
            />
          </div>

          <div className="flex items-center justify-between p-6 bg-[#FFFDF0] dark:bg-gray-700/50 rounded-3xl border-2 border-[#FDEB9B] dark:border-gray-600">
            <div>
              <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                {t('Settings.dinner')}
              </h3>
              <p className="text-yellow-800/60 dark:text-gray-400 font-medium">
                {t('Settings.dinnerDesc')}
              </p>
            </div>
            <TimePicker
              label={t('Settings.dinner')}
              value={tempTimes.dinner}
              onChange={(v) => setTempTimes({ ...tempTimes, dinner: v })}
            />
          </div>

          <div className="flex items-center justify-between p-6 bg-[#FFFDF0] dark:bg-gray-700/50 rounded-3xl border-2 border-[#FDEB9B] dark:border-gray-600">
            <div>
              <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                {t('Settings.bedtime')}
              </h3>
              <p className="text-yellow-800/60 dark:text-gray-400 font-medium">
                {t('Settings.bedtimeDesc')}
              </p>
            </div>
            <TimePicker
              label={t('Settings.bedtime')}
              value={tempTimes.bedtime}
              onChange={(v) => setTempTimes({ ...tempTimes, bedtime: v })}
            />
          </div>
        </div>

        {/* 保存按钮区域 */}
        <div className="mt-10 flex items-center gap-6">
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={`flex items-center gap-3 px-10 py-5 rounded-full font-black text-xl transition-all transform active:scale-95 shadow-lg ${
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

      <div className="bg-[#FFF5F5] dark:bg-red-900/20 rounded-[2.5rem] p-10 shadow-sm border-2 border-red-200 dark:border-red-800/30 relative overflow-hidden">
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
