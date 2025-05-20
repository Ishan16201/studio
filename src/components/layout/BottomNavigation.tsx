'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpenText, Timer, ListChecks, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/journal', label: 'Journal', icon: BookOpenText },
  { href: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { href: '/habits', label: 'Habits', icon: ListChecks },
  { href: '/meditation', label: 'Meditate', icon: Headphones },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-card border-t border-border shadow-lg flex justify-around items-center md:hidden z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center text-xs p-2 rounded-md transition-colors duration-200',
              isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon className={cn('h-5 w-5 mb-0.5', isActive ? 'text-primary' : '')} strokeWidth={isActive ? 2.5 : 2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
