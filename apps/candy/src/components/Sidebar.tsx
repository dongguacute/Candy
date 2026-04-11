import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MdList, MdSettings, MdLocalPharmacy, MdPendingActions } from 'react-icons/md';
import { useAppContext } from '../context/AppContext';

const Sidebar = () => {
  const router = useRouter();
  const { t, pendingIntake, medications } = useAppContext();

  const pendingCount = pendingIntake.filter((item) =>
    medications.some((m) => m.id === item.medicationId)
  ).length;

  const navItems: {
    name: string;
    path: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { name: t('Sidebar.medications'), path: '/', icon: <MdList className="text-xl" /> },
    {
      name: t('Sidebar.pending'),
      path: '/pending',
      icon: <MdPendingActions className="text-xl" />,
      badge: pendingCount,
    },
    { name: t('Sidebar.settings'), path: '/settings', icon: <MdSettings className="text-xl" /> },
  ];

  return (
    <aside className="w-64 bg-[#FFFDF0] dark:bg-gray-800 h-screen flex flex-col border-r border-[#FDEB9B] dark:border-gray-700">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FDEB9B] dark:bg-yellow-600 rounded-full flex items-center justify-center text-yellow-800 dark:text-yellow-100">
          <MdLocalPharmacy className="text-2xl" />
        </div>
        <h1 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">Candy Meds</h1>
      </div>
      <nav className="flex-1 px-6 space-y-3">
        {navItems.map((item) => {
          const isActive = router.pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center justify-between gap-3 px-5 py-4 rounded-full transition-all duration-300 font-medium ${
                isActive
                  ? 'bg-[#FDEB9B] text-yellow-900 shadow-sm dark:bg-yellow-600 dark:text-yellow-50'
                  : 'text-yellow-800/70 dark:text-gray-300 hover:bg-[#FEF5C8] dark:hover:bg-gray-700 hover:text-yellow-900'
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                {item.icon}
                <span className="truncate">{item.name}</span>
              </span>
              {(item.badge ?? 0) > 0 ? (
                <span className="shrink-0 min-w-[1.5rem] rounded-full bg-amber-600 px-2 py-0.5 text-center text-xs font-bold text-white dark:bg-amber-500">
                  {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
