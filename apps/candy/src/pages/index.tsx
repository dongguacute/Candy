import React, { useState, useRef } from 'react';
import { dosageKeyForI18n } from '../dosageKey';
import { useAppContext, TimeToTake, Medication } from '../context/AppContext';
import { GsapModal, type GsapModalHandle } from '../components/GsapModal';
import { MdAdd, MdClose, MdImage, MdEmojiEmotions, MdMedication, MdWarning, MdEdit } from 'react-icons/md';

type MedModal = null | { type: 'add' } | { type: 'edit'; id: string };

export default function Home() {
  const { medications, addMedication, updateMedication, removeMedication, t } = useAppContext();
  const [medModal, setMedModal] = useState<MedModal>(null);
  const [medToDelete, setMedToDelete] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [times, setTimes] = useState<TimeToTake[]>([]);
  const [dosage, setDosage] = useState('1');
  const [iconType, setIconType] = useState<'emoji' | 'image'>('emoji');
  const [iconValue, setIconValue] = useState('💊');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const medModalRef = useRef<GsapModalHandle>(null);
  const deleteModalRef = useRef<GsapModalHandle>(null);

  const resetForm = () => {
    setName('');
    setTimes([]);
    setDosage('1');
    setIconType('emoji');
    setIconValue('💊');
  };

  const fillFormFromMedication = (med: Medication) => {
    setName(med.name);
    setTimes([...med.times]);
    setDosage(med.dosage ?? '1');
    setIconType(med.iconType);
    setIconValue(med.iconValue);
  };

  const openAddModal = () => {
    resetForm();
    setMedModal({ type: 'add' });
  };

  const openEditModal = (med: Medication) => {
    fillFormFromMedication(med);
    setMedModal({ type: 'edit', id: med.id });
  };

  const timeOptions: { value: TimeToTake; label: string }[] = [
    { value: 'breakfast', label: t('Settings.breakfast') },
    { value: 'lunch', label: t('Settings.lunch') },
    { value: 'dinner', label: t('Settings.dinner') },
    { value: 'bedtime', label: t('Settings.bedtime') },
  ];

  const dosageOptions = [
    { value: 'quarter', label: t('Home.dosageOptions.quarter') },
    { value: 'half', label: t('Home.dosageOptions.half') },
    { value: '1', label: t('Home.dosageOptions.1') },
    { value: '2', label: t('Home.dosageOptions.2') },
    { value: '3', label: t('Home.dosageOptions.3') },
    { value: '4', label: t('Home.dosageOptions.4') },
    { value: '5', label: t('Home.dosageOptions.5') },
    { value: '6', label: t('Home.dosageOptions.6') },
  ];

  const handleTimeToggle = (time: TimeToTake) => {
    if (times.includes(time)) {
      setTimes(times.filter(t => t !== time));
    } else {
      setTimes([...times, time]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconType('image');
        setIconValue(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(t('Home.errorName'));
      return;
    }
    if (times.length === 0) {
      alert(t('Home.errorTime'));
      return;
    }
    
    const payload = {
      name: name.trim(),
      times,
      dosage,
      iconType,
      iconValue,
    };
    if (medModal?.type === 'edit') {
      if (!updateMedication(medModal.id, payload)) {
        alert(t('Home.errorDuplicate'));
        return;
      }
    } else {
      if (!addMedication(payload)) {
        alert(t('Home.errorDuplicate'));
        return;
      }
    }
    medModalRef.current?.close();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-yellow-900 dark:text-yellow-100 sm:text-4xl">
          {t('Home.title')}
        </h1>
        <button
          type="button"
          onClick={openAddModal}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#FDEB9B] px-5 py-3 font-bold text-yellow-900 shadow-sm transition-all hover:bg-[#FCD34D] active:scale-[0.98] dark:bg-yellow-600 dark:text-yellow-50 dark:hover:bg-yellow-500 sm:w-auto sm:px-6 sm:hover:scale-105"
        >
          <MdAdd className="text-xl" /> {t('Home.addMedication')}
        </button>
      </div>

      {medModal && (
        <GsapModal
          ref={medModalRef}
          onCloseComplete={() => setMedModal(null)}
          panelClassName="flex max-h-[min(92dvh,100%)] max-w-md flex-col rounded-t-[2rem] border-4 border-[#FDEB9B] bg-[#FFFDF0] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl dark:border-gray-700 dark:bg-gray-800 sm:rounded-[2.5rem] sm:p-8 sm:pb-8"
        >
            <div className="mb-4 flex flex-shrink-0 items-start justify-between gap-4 sm:mb-6">
              <h2 className="pr-2 text-xl font-bold leading-tight text-yellow-900 dark:text-yellow-100 sm:text-2xl">
                {medModal.type === 'edit' ? t('Home.editMedication') : t('Home.addMedication')}
              </h2>
              <button
                type="button"
                onClick={() => medModalRef.current?.close()}
                className="shrink-0 p-2 bg-[#FEF5C8] hover:bg-[#FDEB9B] text-yellow-800 rounded-full transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto sm:space-y-8">
              <div>
                <label className="block text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-3 ml-2">
                  {t('Home.medicationName')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 rounded-full border-2 border-[#FDEB9B] dark:border-gray-600 bg-white dark:bg-gray-700 text-yellow-900 dark:text-gray-100 focus:ring-4 focus:ring-[#FDEB9B]/50 focus:border-[#FCD34D] outline-none transition-all placeholder-yellow-300 dark:placeholder-gray-400 font-medium"
                  placeholder={t('Home.placeholderName')}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-3 ml-2">
                  {t('Home.timeToTake')}
                </label>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {timeOptions.map(option => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleTimeToggle(option.value)}
                      className={`rounded-full px-4 py-2.5 text-xs font-bold transition-all active:scale-95 sm:px-6 sm:py-3 sm:text-sm ${
                        times.includes(option.value)
                          ? 'bg-[#FCD34D] text-yellow-900 shadow-md ring-2 ring-[#FCD34D] ring-offset-2 ring-offset-[#FFFDF0] dark:ring-offset-gray-800 dark:bg-yellow-500 dark:text-yellow-950'
                          : 'bg-white dark:bg-gray-700 text-yellow-700 dark:text-gray-300 border-2 border-[#FDEB9B] dark:border-gray-600 hover:bg-[#FEF5C8] dark:hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-3 ml-2">
                  {t('Home.dosage')}
                </label>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {dosageOptions.map(option => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setDosage(option.value)}
                      className={`rounded-full px-4 py-2.5 text-xs font-bold transition-all active:scale-95 sm:px-6 sm:py-3 sm:text-sm ${
                        dosage === option.value
                          ? 'bg-[#FCD34D] text-yellow-900 shadow-md ring-2 ring-[#FCD34D] ring-offset-2 ring-offset-[#FFFDF0] dark:ring-offset-gray-800 dark:bg-yellow-500 dark:text-yellow-950'
                          : 'bg-white dark:bg-gray-700 text-yellow-700 dark:text-gray-300 border-2 border-[#FDEB9B] dark:border-gray-600 hover:bg-[#FEF5C8] dark:hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-3 ml-2">
                  {t('Home.icon')}
                </label>
                <div className="flex flex-col items-stretch gap-4 rounded-[1.5rem] border-2 border-[#FDEB9B] bg-white p-4 dark:border-gray-600 dark:bg-gray-700 sm:flex-row sm:items-center sm:gap-6 sm:rounded-[2rem]">
                  <div className="w-20 h-20 rounded-full border-4 border-[#FDEB9B] dark:border-gray-600 flex items-center justify-center overflow-hidden bg-[#FFFDF0] dark:bg-gray-800 shadow-inner flex-shrink-0">
                    {iconType === 'emoji' ? (
                      <span className="text-4xl">{iconValue}</span>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={iconValue} alt="Icon" className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <MdEmojiEmotions className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 text-xl" />
                        <input
                          type="text"
                          value={iconType === 'emoji' ? iconValue : '💊'}
                          onChange={(e) => {
                            setIconType('emoji');
                            setIconValue(e.target.value || '💊');
                          }}
                          className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-[#FDEB9B] dark:border-gray-600 bg-[#FFFDF0] dark:bg-gray-800 focus:border-[#FCD34D] outline-none transition-colors text-center text-lg"
                          maxLength={2}
                          placeholder="💊"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold bg-[#FEF5C8] dark:bg-gray-600 hover:bg-[#FDEB9B] dark:hover:bg-gray-500 text-yellow-800 dark:text-gray-200 rounded-full transition-colors"
                      >
                        <MdImage className="text-lg" /> {t('Home.uploadImage')}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
              </div>

              <div className="mt-2 flex flex-shrink-0 flex-col-reverse gap-3 border-t-2 border-[#FDEB9B]/60 pt-5 dark:border-gray-600 sm:flex-row sm:justify-end sm:gap-4 sm:pt-6">
                <button
                  type="button"
                  onClick={() => medModalRef.current?.close()}
                  className="rounded-full px-6 py-3.5 font-bold text-yellow-700 transition-colors hover:bg-[#FEF5C8] dark:text-gray-300 dark:hover:bg-gray-700 sm:px-8 sm:py-4"
                >
                  {t('Home.cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#FCD34D] px-6 py-3.5 font-bold text-yellow-900 shadow-md transition-all hover:bg-[#FBBF24] active:scale-[0.98] dark:bg-yellow-500 dark:text-yellow-950 sm:px-8 sm:py-4 sm:hover:scale-105"
                >
                  {t('Home.save')}
                </button>
              </div>
            </form>
        </GsapModal>
      )}

      {medications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-yellow-700/50 dark:text-gray-500 sm:py-32">
          <MdMedication className="mb-6 text-6xl text-[#FDEB9B] dark:text-gray-700 sm:text-8xl" />
          <p className="mb-2 text-center text-xl font-bold text-yellow-800/60 dark:text-gray-400 sm:text-2xl">
            {t('Home.noMedications')}
          </p>
          <p className="text-center text-base sm:text-lg">
            {t('Home.addFirst')}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {medications.map((med) => (
            <li
              key={med.id}
              className="flex w-full flex-wrap items-center gap-3 rounded-2xl border-2 border-[#FDEB9B] bg-white px-4 py-3 shadow-sm transition hover:border-[#FCD34D] hover:shadow-md dark:border-gray-700 dark:bg-gray-800 sm:flex-nowrap sm:gap-4 sm:px-5 sm:py-3.5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#FDEB9B] bg-[#FFFDF0] dark:border-gray-600 dark:bg-gray-700">
                {med.iconType === 'emoji' ? (
                  <span className="text-2xl">{med.iconValue}</span>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={med.iconValue} alt="" className="h-full w-full object-cover" />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <h3 className="min-w-0 text-lg font-bold tracking-tight text-yellow-900 dark:text-gray-100 sm:max-w-[min(280px,40vw)] sm:shrink-0 sm:truncate">
                  {med.name}
                </h3>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span className="sr-only">{t('Home.timeToTake')}</span>
                  {med.times.map((timeKey) => (
                    <span
                      key={timeKey}
                      className="inline-flex shrink-0 items-center rounded-full border border-[#FDEB9B] bg-[#FEF5C8] px-3 py-1 text-xs font-bold text-yellow-800 dark:border-gray-600 dark:bg-gray-700 dark:text-yellow-200"
                    >
                      {timeOptions.find((opt) => opt.value === timeKey)?.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
                {med.dosage && (
                  <span className="whitespace-nowrap rounded-full border border-yellow-200 bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                    {t(`Home.dosageOptions.${dosageKeyForI18n(med.dosage)}`)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => openEditModal(med)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEF5C8] text-yellow-600 transition-colors hover:bg-[#FDEB9B] dark:bg-gray-700 dark:text-yellow-200 dark:hover:bg-gray-600"
                  title={t('Home.editMedication')}
                >
                  <MdEdit className="text-lg" />
                </button>
                <button
                  type="button"
                  onClick={() => setMedToDelete(med.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEF5C8] text-yellow-600 transition-colors hover:bg-red-100 hover:text-red-500 dark:bg-gray-700 dark:hover:bg-red-900/30"
                  title={t('Home.confirmDelete')}
                >
                  <MdClose className="text-lg" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Delete Confirmation Modal */}
      {medToDelete && (
        <GsapModal
          ref={deleteModalRef}
          onCloseComplete={() => setMedToDelete(null)}
          panelClassName="max-w-sm rounded-t-[2rem] border-4 border-[#FDEB9B] bg-[#FFFDF0] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center shadow-2xl dark:border-gray-700 dark:bg-gray-800 sm:rounded-[2.5rem] sm:p-8 sm:pb-8"
        >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <MdWarning className="text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
              {t('Home.confirmDelete')}
            </h2>
            <p className="text-yellow-800/70 dark:text-gray-400 mb-8 font-medium">
              {t('Home.deleteWarning')}
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <button
                type="button"
                onClick={() => deleteModalRef.current?.close()}
                className="rounded-full px-6 py-3 font-bold text-yellow-700 transition-colors hover:bg-[#FEF5C8] dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('Home.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  removeMedication(medToDelete);
                  deleteModalRef.current?.close();
                }}
                className="rounded-full bg-red-500 px-6 py-3 font-bold text-white shadow-md transition-all hover:bg-red-600 active:scale-[0.98] sm:hover:scale-105"
              >
                {t('Home.confirm')}
              </button>
            </div>
        </GsapModal>
      )}
    </div>
  );
}
