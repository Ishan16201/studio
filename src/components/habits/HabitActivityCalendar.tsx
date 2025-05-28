
'use client';

import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import type { Habit } from '@/types';
import { cn } from '@/lib/utils';

interface DailyLogData {
  date: string; 
  habits: Record<string, boolean>;
}

const getIntensityColorForHabit = (isCompleted: boolean | undefined): string => {
  if (isCompleted === undefined) return 'bg-muted/20 hover:bg-muted/40 focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2'; // Not tracked or data missing
  return isCompleted ? 'bg-green-600 hover:bg-green-500 focus-visible:ring-green-400 focus-visible:ring-2 focus-visible:ring-offset-2' : 'bg-red-600/40 hover:bg-red-500/50 focus-visible:ring-red-400 focus-visible:ring-2 focus-visible:ring-offset-2'; // Completed or explicitly not completed
};

interface MonthGridProps {
  month: Date;
  dailyLogs: DailyLogData[];
  habitName: string;
  onTogglePastHabit: (date: Date, habitName: string, currentStatus: boolean) => Promise<void>;
}

const MonthGrid: React.FC<MonthGridProps> = ({ month, dailyLogs, habitName, onTogglePastHabit }) => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfMonth = monthStart.getDay(); 
  const monthName = format(month, 'MMM');

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-muted-foreground mb-1">{monthName}</div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`blank-${i}`} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        ))}
        {daysInMonth.map((day) => {
          const dayLog = dailyLogs.find(d => d.date === format(day, 'yyyy-MM-dd'));
          const isCompleted = dayLog?.habits?.[habitName];
          const colorClass = getIntensityColorForHabit(isCompleted);
          
          return (
            <TooltipProvider key={day.toISOString()} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onTogglePastHabit(day, habitName, isCompleted || false)}
                    aria-label={`Toggle ${habitName} for ${format(day, 'MMMM d, yyyy')}. Status: ${isCompleted ? 'Completed' : isCompleted === false ? 'Not Completed' : 'Not Tracked'}`}
                    className={cn(
                      "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-all duration-150 ease-in-out focus:outline-none",
                      colorClass
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent className="text-xs p-2">
                  <p>{format(day, 'MMMM d, yyyy')}</p>
                  <p>
                    {isCompleted === true ? `${habitName}: Completed` : 
                     isCompleted === false ? `${habitName}: Not Completed` : 
                     `${habitName}: Not tracked`}
                  </p>
                  <p className="text-muted-foreground/80 italic">Click to toggle</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};

interface HabitActivityCalendarProps {
  habit: Habit;
  allDailyLogsForYear: DailyLogData[];
  currentYear: number;
  isLoadingLogs: boolean;
  onTogglePastHabit: (date: Date, habitName: string, currentStatus: boolean) => Promise<void>;
}

export default function HabitActivityCalendar({ habit, allDailyLogsForYear, currentYear, isLoadingLogs, onTogglePastHabit }: HabitActivityCalendarProps) {
  if (isLoadingLogs && !allDailyLogsForYear.length) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <Activity className="mr-2 h-5 w-5 sm:h-6 sm:h-6 text-primary" />
            Activity for {habit.name} - {currentYear}
          </CardTitle>
          <CardDescription>Loading activity heatmap...</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const monthsToDisplay = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));

  const relevantLogsForHabit = useMemo(() => {
      return allDailyLogsForYear.filter(log => log.habits && habit.name in log.habits);
  }, [allDailyLogsForYear, habit.name]);


  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <Activity className="mr-2 h-5 w-5 sm:h-6 sm:h-6 text-primary" />
          Activity for "{habit.name}" - {currentYear}
        </CardTitle>
        <CardDescription>Daily completion consistency for this habit.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 overflow-x-auto">
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-around">
           {monthsToDisplay.map(month => (
            <MonthGrid 
                key={format(month, 'yyyy-MM')} 
                month={month} 
                dailyLogs={allDailyLogsForYear.filter(d => format(parseISO(d.date), 'yyyy-MM') === format(month, 'yyyy-MM'))}
                habitName={habit.name}
                onTogglePastHabit={onTogglePastHabit}
            />
          ))}
        </div>
        {relevantLogsForHabit.length === 0 && !isLoadingLogs && (
             <p className="text-center text-muted-foreground mt-4">No activity recorded for "{habit.name}" in {currentYear}.</p>
        )}
      </CardContent>
    </Card>
  );
}

    