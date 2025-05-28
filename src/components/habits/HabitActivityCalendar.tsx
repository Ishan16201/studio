
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { db, USER_ID } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { format, subMonths, startOfYear, endOfYear, eachDayOfInterval, startOfMonth, endOfMonth, getMonth, getYear, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarSearch, Activity } from 'lucide-react';
import type { Habit } from '@/types'; // Import Habit type

interface DailyLogData { // Represents the Firestore document for a day
  date: string; // YYYY-MM-DD
  habits: Record<string, boolean>; // { "habitName1": true, "habitName2": false }
}

const getIntensityColorForHabit = (isCompleted: boolean | undefined): string => {
  if (isCompleted === undefined) return 'bg-muted/20 hover:bg-muted/40'; // Habit not tracked for this day or data missing
  return isCompleted ? 'bg-green-600 hover:bg-green-500' : 'bg-muted/40 hover:bg-muted/60'; // Completed or explicitly not completed
};

const MonthGrid: React.FC<{ month: Date; dailyLogs: DailyLogData[]; habitName: string }> = ({ month, dailyLogs, habitName }) => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfMonth = monthStart.getDay(); // 0 for Sunday, 1 for Monday, etc.

  const monthName = format(month, 'MMM');

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-muted-foreground mb-1">{monthName}</div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`blank-${i}`} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        ))}
        {daysInMonth.map((day) => {
          const dayLog = dailyLogs.find(d => isSameDay(new Date(d.date), day));
          const isCompleted = dayLog?.habits?.[habitName]; // Check if specific habit was completed
          const colorClass = getIntensityColorForHabit(isCompleted);
          
          return (
            <TooltipProvider key={day.toISOString()} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm cursor-default ${colorClass} transition-colors`}
                  />
                </TooltipTrigger>
                <TooltipContent className="text-xs p-2">
                  <p>{format(day, 'MMMM d, yyyy')}</p>
                  <p>
                    {isCompleted === true ? `${habitName}: Completed` : 
                     isCompleted === false ? `${habitName}: Not Completed` : 
                     `${habitName}: Not tracked`}
                  </p>
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
  allDailyLogsForYear: DailyLogData[]; // Pass all logs for the year to avoid re-fetching per habit
  currentYear: number;
  isLoadingLogs: boolean;
}

export default function HabitActivityCalendar({ habit, allDailyLogsForYear, currentYear, isLoadingLogs }: HabitActivityCalendarProps) {
  if (isLoadingLogs && !allDailyLogsForYear.length) { // Show skeleton if loading initial logs
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

  // Filter logs relevant to this specific habit's display (though rendering logic will use habit.name)
  // This isn't strictly necessary if MonthGrid handles the habitName lookup, but can be useful.
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
                dailyLogs={allDailyLogsForYear.filter(d => format(new Date(d.date), 'yyyy-MM') === format(month, 'yyyy-MM'))}
                habitName={habit.name}
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

    