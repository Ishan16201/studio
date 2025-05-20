'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, BookOpenText, Timer, ListChecks, Headphones, CheckSquare, CalendarDays, Settings, LogOut, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/todo', label: 'To-Do List', icon: CheckSquare },
  { href: '/habits', label: 'Habit Tracker', icon: ListChecks }, // Using ListChecks as History icon is not in Lucide
  { href: '/meditation', label: 'Meditations', icon: Headphones },
  { href: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { href: '/journal', label: 'Journal', icon: BookOpenText },
];

export default function SidebarNavigation() {
  const pathname = usePathname();
  const { open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    // For non-mobile, sidebar might stay open or be controlled by user preference.
    // If you want it to close on non-mobile too: setOpen(false);
  };

  return (
    <SidebarContent className="p-2 bg-sidebar text-sidebar-foreground">
      <div className="flex flex-col h-full">
        <SidebarHeader className="p-2 mb-4">
          <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Grindset
            </h1>
          </Link>
        </SidebarHeader>

        <SidebarMenu className="flex-grow">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className={cn(
                    "w-full justify-start text-sm",
                    pathname === item.href 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  tooltip={item.label}
                  onClick={handleLinkClick}
                >
                  <a>
                    <item.icon className="h-5 w-5 mr-3 group-data-[collapsible=icon]:mr-0" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarFooter className="mt-auto p-2 border-t border-sidebar-border">
           {/* Example Footer items - replace or remove as needed */}
          <SidebarMenu>
            <SidebarMenuItem>
               <SidebarMenuButton 
                  className="w-full justify-start text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
                  tooltip="Settings"
                >
                <Settings className="h-5 w-5 mr-3 group-data-[collapsible=icon]:mr-0" />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
               <SidebarMenuButton 
                  className="w-full justify-start text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  tooltip="Log Out"
                >
                <LogOut className="h-5 w-5 mr-3 group-data-[collapsible=icon]:mr-0" />
                <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </div>
    </SidebarContent>
  );
}
