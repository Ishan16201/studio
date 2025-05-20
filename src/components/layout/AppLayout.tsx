import type React from 'react';
import BottomNavigation from './BottomNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pb-bottom-nav"> {/* Add padding for bottom nav */}
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
