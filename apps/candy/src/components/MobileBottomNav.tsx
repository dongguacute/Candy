import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useNavItems } from './navItems';

const MobileBottomNav: React.FC = () => {
  const router = useRouter();
  const navItems = useNavItems();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#FDEB9B] bg-[#FFFDF0]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/95 md:hidden"
      aria-label="Primary"
    >
      {navItems.map((item) => {
        const isActive = router.pathname === item.path;
        const badge = item.badge ?? 0;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`relative flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[0.65rem] font-semibold leading-tight transition-colors sm:text-xs ${
              isActive
                ? 'text-yellow-900 dark:text-yellow-50'
                : 'text-yellow-800/60 dark:text-gray-400'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                isActive
                  ? 'bg-[#FDEB9B] text-yellow-900 shadow-sm dark:bg-yellow-600 dark:text-yellow-50'
                  : 'text-yellow-800/80 dark:text-gray-300'
              }`}
            >
              {item.icon}
              {badge > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-amber-600 px-1 text-[0.6rem] font-bold text-white dark:bg-amber-500">
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : null}
            </span>
            <span className="line-clamp-2 text-center">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
