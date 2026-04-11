import React from 'react';
import { MdList, MdSettings, MdPendingActions } from 'react-icons/md';
import { useAppContext } from '../context/AppContext';

export type NavItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
};

export function useNavItems(): NavItem[] {
  const { t, pendingIntake, medications } = useAppContext();
  const pendingCount = pendingIntake.filter((item) =>
    medications.some((m) => m.id === item.medicationId)
  ).length;

  return [
    { name: t('Sidebar.medications'), path: '/', icon: <MdList className="text-xl" /> },
    {
      name: t('Sidebar.pending'),
      path: '/pending',
      icon: <MdPendingActions className="text-xl" />,
      badge: pendingCount,
    },
    { name: t('Sidebar.settings'), path: '/settings', icon: <MdSettings className="text-xl" /> },
  ];
}
