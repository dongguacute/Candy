import React from 'react';
import { dosageKeyForI18n } from '../dosageKey';
import { useAppContext, TimeToTake } from '../context/AppContext';
import { MdCheckCircle, MdPendingActions } from 'react-icons/md';

const PendingIntakeList: React.FC = () => {
  const { medications, t, pendingIntake, markPendingIntakeDone } = useAppContext();

  const timeOptions: { value: TimeToTake; label: string }[] = [
    { value: 'breakfast', label: t('Settings.breakfast') },
    { value: 'lunch', label: t('Settings.lunch') },
    { value: 'dinner', label: t('Settings.dinner') },
    { value: 'bedtime', label: t('Settings.bedtime') },
  ];

  const pendingVisible = pendingIntake.filter((item) =>
    medications.some((m) => m.id === item.medicationId)
  );

  if (pendingVisible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-amber-300/70 bg-[#FFFDF0]/80 px-4 py-14 text-center dark:border-amber-800/50 dark:bg-gray-900/40 sm:rounded-[2rem] sm:py-20">
        <MdPendingActions className="mb-4 text-5xl text-amber-300 dark:text-amber-800 sm:text-6xl" />
        <p className="text-base font-semibold text-amber-900/70 dark:text-amber-200/80 sm:text-lg">
          {t('Pending.empty')}
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-[1.5rem] border-2 border-amber-400/80 bg-[#FFF8E1] p-4 shadow-sm dark:border-amber-600/50 dark:bg-amber-950/40 sm:rounded-[2rem] sm:p-6">
      <p className="mb-4 text-sm font-medium text-amber-900/70 dark:text-amber-200/80 sm:mb-6">
        {t('Pending.hint')}
      </p>
      <ul className="space-y-3">
        {pendingVisible.map((item) => {
          const med = medications.find((m) => m.id === item.medicationId)!;
          const slotLabel =
            timeOptions.find((o) => o.value === item.timeSlot)?.label ?? item.timeSlot;
          return (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-amber-300/60 bg-white/90 px-4 py-3 dark:border-amber-800/50 dark:bg-gray-900/60 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-200 bg-[#FFFDF0] dark:border-amber-800 dark:bg-gray-800">
                  {med.iconType === 'emoji' ? (
                    <span className="text-2xl">{med.iconValue}</span>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={med.iconValue} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1 sm:pr-2">
                  <p className="break-words font-bold text-amber-950 dark:text-amber-50">{med.name}</p>
                  <p className="text-sm text-amber-800/80 dark:text-amber-200/70">
                    {t('Pending.slot')}: {slotLabel}
                    {med.dosage
                      ? ` · ${t(`Home.dosageOptions.${dosageKeyForI18n(med.dosage)}`)}`
                      : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => markPendingIntakeDone(item.id)}
                className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#FCD34D] px-4 py-2.5 text-sm font-bold text-amber-950 shadow-sm transition-transform active:scale-[0.98] hover:bg-amber-400 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400 sm:w-auto sm:justify-start sm:py-2 sm:hover:scale-105"
                aria-label={t('Pending.taken')}
              >
                <MdCheckCircle className="text-lg" />
                {t('Pending.taken')}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default PendingIntakeList;
