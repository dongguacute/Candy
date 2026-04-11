import React from 'react';
import Sidebar from './Sidebar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#FFFDF0] dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-10 text-yellow-950 dark:text-gray-100">
        {children}
      </main>
    </div>
  );
};

export default Layout;
