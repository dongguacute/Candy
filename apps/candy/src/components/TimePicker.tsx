import gsap from 'gsap';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { MdAccessTime, MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/md';
import { useAppContext } from '../context/AppContext';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label }) => {
  const { t } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 内部临时状态，用于处理输入过程
  const [displayHours, setDisplayHours] = useState('');
  const [displayMinutes, setDisplayMinutes] = useState('');

  // 当外部 value 改变或打开弹窗时，同步内部状态
  useEffect(() => {
    const [h, m] = value.split(':');
    setDisplayHours(h);
    setDisplayMinutes(m);
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !dropdownRef.current) return;
    gsap.fromTo(
      dropdownRef.current,
      { opacity: 0, y: -10, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out' }
    );
  }, [isOpen]);

  const updateFinalTime = (h: string, m: string) => {
    const finalH = h.padStart(2, '0');
    const finalM = m.padStart(2, '0');
    onChange(`${finalH}:${finalM}`);
  };

  const adjustHours = (delta: number) => {
    let next = parseInt(displayHours || '0', 10) + delta;
    if (next > 23) next = 0;
    if (next < 0) next = 23;
    const nextStr = next.toString().padStart(2, '0');
    setDisplayHours(nextStr);
    updateFinalTime(nextStr, displayMinutes);
  };

  const adjustMinutes = (delta: number) => {
    let next = parseInt(displayMinutes || '0', 10) + delta;
    if (next > 59) next = 0;
    if (next < 0) next = 59;
    const nextStr = next.toString().padStart(2, '0');
    setDisplayMinutes(nextStr);
    updateFinalTime(displayHours, nextStr);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDisplayHours(val);
    if (val.length === 2 || (val.length === 1 && parseInt(val, 10) > 2)) {
      const num = parseInt(val, 10);
      if (num >= 0 && num <= 23) {
        updateFinalTime(val, displayMinutes);
      }
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDisplayMinutes(val);
    if (val.length === 2 || (val.length === 1 && parseInt(val, 10) > 5)) {
      const num = parseInt(val, 10);
      if (num >= 0 && num <= 59) {
        updateFinalTime(displayHours, val);
      }
    }
  };

  const handleBlur = () => {
    // 失去焦点时补全格式
    const h = (parseInt(displayHours, 10) || 0).toString().padStart(2, '0');
    const m = (parseInt(displayMinutes, 10) || 0).toString().padStart(2, '0');
    setDisplayHours(h);
    setDisplayMinutes(m);
    updateFinalTime(h, m);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex w-full items-center justify-between gap-3 rounded-2xl border-2 bg-white px-4 py-3 transition-all duration-300 hover:shadow-lg active:scale-95 sm:w-auto sm:justify-start sm:gap-4 sm:rounded-3xl sm:px-6 sm:py-4 dark:bg-gray-800 ${
          isOpen 
            ? 'border-yellow-400 ring-4 ring-yellow-400/20 shadow-md' 
            : 'border-[#FDEB9B] dark:border-gray-600 hover:border-yellow-300'
        }`}
      >
        <div className="flex min-w-0 flex-col items-start text-left">
          <span className="mb-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-50 sm:text-xs">{label}</span>
          <span className="text-xl font-black tabular-nums text-yellow-950 dark:text-yellow-50 sm:text-2xl">
            {value}
          </span>
        </div>
        <MdAccessTime className={`shrink-0 text-xl transition-transform duration-300 sm:text-2xl ${isOpen ? 'rotate-12 text-yellow-500' : 'text-yellow-300'}`} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 z-50 mt-3 max-w-[min(100%,calc(100vw-2rem))] origin-top rounded-2xl border-2 border-yellow-100 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800 sm:left-auto sm:right-0 sm:mt-4 sm:min-w-[240px] sm:max-w-none sm:rounded-[2.5rem] sm:p-6"
        >
          <div className="flex items-center justify-center gap-4">
            {/* Hours */}
            <div className="flex flex-col items-center gap-1">
              <button 
                type="button"
                onClick={() => adjustHours(1)}
                className="p-1 hover:bg-yellow-50 dark:hover:bg-gray-700 rounded-lg text-yellow-600 transition-colors"
              >
                <MdKeyboardArrowUp className="text-2xl" />
              </button>
              <input
                type="text"
                value={displayHours}
                onChange={handleHourChange}
                onBlur={handleBlur}
                placeholder="00"
                className="text-4xl font-black text-yellow-950 dark:text-yellow-50 w-16 text-center bg-yellow-50/50 dark:bg-gray-700/50 rounded-xl py-2 border-2 border-transparent focus:border-yellow-400 focus:outline-none tabular-nums transition-all"
              />
              <button 
                type="button"
                onClick={() => adjustHours(-1)}
                className="p-1 hover:bg-yellow-50 dark:hover:bg-gray-700 rounded-lg text-yellow-600 transition-colors"
              >
                <MdKeyboardArrowDown className="text-2xl" />
              </button>
            </div>

            <span className="text-4xl font-black text-yellow-300 dark:text-gray-600">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center gap-1">
              <button 
                type="button"
                onClick={() => adjustMinutes(1)}
                className="p-1 hover:bg-yellow-50 dark:hover:bg-gray-700 rounded-lg text-yellow-600 transition-colors"
              >
                <MdKeyboardArrowUp className="text-2xl" />
              </button>
              <input
                type="text"
                value={displayMinutes}
                onChange={handleMinuteChange}
                onBlur={handleBlur}
                placeholder="00"
                className="text-4xl font-black text-yellow-950 dark:text-yellow-50 w-16 text-center bg-yellow-50/50 dark:bg-gray-700/50 rounded-xl py-2 border-2 border-transparent focus:border-yellow-400 focus:outline-none tabular-nums transition-all"
              />
              <button 
                type="button"
                onClick={() => adjustMinutes(-1)}
                className="p-1 hover:bg-yellow-50 dark:hover:bg-gray-700 rounded-lg text-yellow-600 transition-colors"
              >
                <MdKeyboardArrowDown className="text-2xl" />
              </button>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t-2 border-yellow-50 dark:border-gray-700 flex justify-center">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold rounded-full text-sm transition-all shadow-sm hover:shadow-md"
            >
              {t('Home.done')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
