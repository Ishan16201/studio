
'use client'; 

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpenText, History, Users, CalendarDays, CheckSquare, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import TodoListComponent from '@/components/todo/TodoListComponent';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

interface DashboardWidgetProps {
  title: string;
  description?: string;
  href?: string;
  icon?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
  borderColor?: string; 
}

function DashboardWidget({ title, description, href, icon: Icon, children, className, borderColor }: DashboardWidgetProps) {
  const content = (
    <Card className={cn("shadow-lg rounded-xl overflow-hidden h-full flex flex-col bg-card text-card-foreground", borderColor ? `border-2 ${borderColor}` : '', className)}>
      <CardHeader>
        <div className="flex items-center mb-1">
          {Icon && <Icon className="w-5 h-5 mr-2 text-primary" />}
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
        {description && <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between p-4 sm:p-6">
        {children}
        {href && (
          <Button asChild variant="outline" size="sm" className="mt-auto w-full group border-primary/50 hover:bg-primary/10">
            <Link href={href}>
              Go to {title}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return href && !children ? <Link href={href} className="block h-full">{content}</Link> : content;
}


function HomePageContent() {
  const today = new Date();
  const formattedDate = format(today, "eeee, MMMM do");
  const { user } = useAuth(); // Get user from AuthContext
  
  return (
    <div className="min-h-screen text-foreground p-0">
      <header className="mb-6 md:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Grindset</h1>
        <p className="text-xl text-muted-foreground mt-1">
          {user && user.name ? `Welcome back, ${user.name}!` : 'Your personal dashboard for focus and growth.'}
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <DashboardWidget
          title="Daily Tasks"
          borderColor="border-primary"
          className="lg:col-span-1 md:row-span-2"
        >
          <TodoListComponent 
            showTitle={false} 
            maxHeight="max-h-[280px] sm:max-h-[320px] md:max-h-[calc(100%-4rem)]"
            enableAdding={true} 
          />
        </DashboardWidget>

        <DashboardWidget
          title={formattedDate}
          borderColor="border-accent"
          className="lg:col-span-1 flex items-center justify-center text-center min-h-[150px] md:min-h-full"
        >
          <div className="p-4">
            <p className="text-3xl md:text-4xl font-bold text-foreground">{format(today, "do")}</p>
            <p className="text-lg md:text-xl text-muted-foreground">{format(today, "MMMM")}</p>
            <p className="text-sm text-muted-foreground">{format(today, "yyyy")}</p>
          </div>
        </DashboardWidget>
        
        <DashboardWidget
          title="Habit Tracker"
          description="Monitor your daily habits."
          href="/habits"
          icon={History}
          borderColor="border-green-500"
          className="lg:col-span-1 min-h-[150px] md:min-h-full"
        >
          <div className="text-center py-4 px-2">
             <p className="text-sm text-muted-foreground mb-3">Check in on your habit progress or start tracking.</p>
          </div>
        </DashboardWidget>

        <DashboardWidget
          title="Journal"
          description="Reflect and record your thoughts."
          href="/journal"
          icon={BookOpenText}
          borderColor="border-purple-500"
          className="lg:col-span-1 md:col-span-2 lg:col-start-2 min-h-[150px] md:min-h-full"
        >
          <div className="text-center py-4 px-2">
            <p className="text-sm text-muted-foreground mb-3">A new entry awaits your insights for today.</p>
          </div>
        </DashboardWidget>
        
        <DashboardWidget
          title="Upcoming Events"
          description="Your schedule at a glance."
          href="/calendar"
          icon={CalendarDays}
          borderColor="border-blue-500"
           className="lg:col-span-1 min-h-[150px] md:min-h-full"
        >
          <div className="text-center py-4 px-2">
            <p className="text-sm text-muted-foreground mb-3">Check your calendar for important dates and events.</p>
          </div>
        </DashboardWidget>

         <DashboardWidget
          title="Focus Tools"
          description="Pomodoro & Meditation."
          icon={Sparkles}
          borderColor="border-yellow-500"
          className="lg:col-span-1 md:col-span-2 lg:col-span-3 min-h-[150px] md:min-h-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            <Link href="/pomodoro" className="block p-4 bg-card hover:bg-secondary rounded-lg text-center border hover:border-primary transition-colors">
              <CardTitle className="text-md font-semibold">Pomodoro</CardTitle>
              <CardDescription className="text-xs">Boost Focus</CardDescription>
            </Link>
            <Link href="/meditation" className="block p-4 bg-card hover:bg-secondary rounded-lg text-center border hover:border-primary transition-colors">
                <CardTitle className="text-md font-semibold">Meditate</CardTitle>
              <CardDescription className="text-xs">Find Calm</CardDescription>
            </Link>
          </div>
        </DashboardWidget>

      </div>
      
      <footer className="text-center mt-8 sm:mt-10 py-5 text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Grindset. Stay focused.</p>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}
