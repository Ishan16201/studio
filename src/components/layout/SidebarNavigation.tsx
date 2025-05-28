
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Home, BookOpenText, Timer, ListChecks, Headphones, CheckSquare, CalendarDays, Settings, LogOut, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/todo', label: 'To-Do List', icon: CheckSquare },
  { href: '/habits', label: 'Habit Tracker', icon: ListChecks },
  { href: '/meditation', label: 'Meditations', icon: Headphones },
  { href: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { href: '/journal', label: 'Journal', icon: PlusCircle },
];

// Custom SVG Logo component
const CustomLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <circle cx="12" cy="12" r="2" />
    <path
      fillRule="evenodd"
      d="M12 12 m0 -5 a5 5 0 1 0 0 10 a5 5 0 1 0 0 -10z M12 12 m0 -3 a3 3 0 1 1 0 6 a3 3 0 1 1 0 -6z"
    />
    <path
      fillRule="evenodd"
      d="M12 12 m0 -9 a9 9 0 1 0 0 18 a9 9 0 1 0 0 -18z M12 12 m0 -7 a7 7 0 1 1 0 14 a7 7 0 1 1 0 -14z"
    />
    <rect x="2" y="11" width="1" height="2" />
    <rect x="21" y="11" width="1" height="2" />
  </svg>
);


export default function SidebarNavigation() {
  const pathname = usePathname();
  const router = useRouter(); // Initialize router
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = () => {
    // Placeholder for actual Firebase logout logic
    console.log("Logout clicked");
    if (isMobile) setOpenMobile(false);
    router.push('/login'); // Redirect to login page
  };

  return (
    <SidebarContent className="p-2 bg-sidebar text-sidebar-foreground">
      <div className="flex flex-col h-full">
        <SidebarHeader className="p-2 mb-4">
          <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
            <CustomLogo className="w-8 h-8 text-primary" />
            {/* Grindset title removed from sidebar */}
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
          <SidebarMenu>
            <SidebarMenuItem>
               <Link href="/settings" legacyBehavior passHref>
                <SidebarMenuButton 
                    asChild
                    isActive={pathname === '/settings'}
                    className={cn(
                        "w-full justify-start text-sm",
                        pathname === '/settings' 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    tooltip="Settings"
                    onClick={handleLinkClick}
                    >
                    <a>
                        <Settings className="h-5 w-5 mr-3 group-data-[collapsible=icon]:mr-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                    </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
               <SidebarMenuButton 
                  className="w-full justify-start text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  tooltip="Log Out"
                  onClick={handleLogout} // Use new logout handler
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

