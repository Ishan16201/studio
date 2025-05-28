
'use client';

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HeaderComponent() {
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
      {/* This button will trigger sidebar for both mobile (as sheet) and desktop (collapse/expand) */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="w-6 h-6" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      
      <div className="flex items-center gap-2">
        {/* Title can be here if not in sidebar or if needed for mobile when sidebar is hidden */}
      </div>
      {/* Add other header elements like user profile, notifications here if needed */}
    </header>
  );
}
