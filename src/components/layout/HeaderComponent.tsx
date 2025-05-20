'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function HeaderComponent() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
      <SidebarTrigger className="sm:hidden" /> {/* Only show on small screens */}
      <div className="flex items-center gap-2">
        {/* Title can be here if not in sidebar or if needed for mobile when sidebar is hidden */}
        {/* <Sparkles className="w-7 h-7 text-primary hidden sm:block" />
        <h1 className="text-2xl font-bold text-foreground hidden sm:block">Grindset</h1> */}
      </div>
      {/* Add other header elements like user profile, notifications here if needed */}
    </header>
  );
}
