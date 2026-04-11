import React from 'react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-dvh min-h-0 max-h-dvh overflow-hidden bg-[#FFFDF0] dark:bg-gray-900">
      <Sidebar />
      <main className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-yellow-950 [-webkit-overflow-scrolling:touch] dark:text-gray-100 sm:px-6 md:px-10 md:pb-10 md:pt-10">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
