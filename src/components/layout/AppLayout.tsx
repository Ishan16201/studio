import type React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarNavigation from './SidebarNavigation';
import HeaderComponent from './HeaderComponent';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    // defaultOpen={false} for mobile to start closed, true for desktop default open
    // The useIsMobile hook inside SidebarProvider handles this logic better
    <SidebarProvider defaultOpen={true} collapsible="icon">
      <Sidebar variant="sidebar" side="left" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarNavigation />
      </Sidebar>
      <SidebarInset className="bg-background"> {/* This is the main content area */}
        <HeaderComponent />
        <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-x-hidden"> {/* Added overflow-x-hidden for safety */}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
