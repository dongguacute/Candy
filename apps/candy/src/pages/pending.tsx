import React from 'react';
import { useAppContext } from '../context/AppContext';
import PendingIntakeList from '../components/PendingIntakeList';

export default function PendingPage() {
  const { t } = useAppContext();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-yellow-900 dark:text-yellow-100 sm:mb-10 sm:text-4xl">
        {t('Pending.title')}
      </h1>
      <PendingIntakeList />
    </div>
  );
}
