
'use client';

import React, { useEffect, useState } from 'react';
import { db, USER_ID } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { format, subMonths, startOfYear, endOfYear, eachDayOfInterval, startOfMonth, endOfMonth, getMonth, getYear, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarSearch } from 'lucide-react';

interface DailyHabitData {
  date: string; // YYYY-MM-DD
  completedCount: number;
  totalHabits: number;
}

const getIntensityColor = (count: number, total: number): string => {
  if (total === 0 || count === 0) return 'bg-muted/30 hover:bg-muted/50'; // No activity or no habits defined
  const percentage = count / total;
  if (percentage >= 0.75) return 'bg-green-700 hover:bg-green-600'; // Strong activity
  if (percentage >= 0.5) return 'bg-green-500 hover:bg-green-400'; // Medium activity
  if (percentage > 0) return 'bg-green-300 hover:bg-green-200'; // Light activity
  return 'bg-muted/30 hover:bg-muted/50'; // No activity
};


const MonthGrid: React.FC<{ month: Date; data: DailyHabitData[]; year: number }> = ({ month, data, year }) => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfMonth = monthStart.getDay(); // 0 for Sunday, 1 for Monday, etc.

  const monthName = format(month, 'MMM');

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-muted-foreground mb-1">{monthName}</div>
      <div className="grid grid-cols-7 gap-1">
        {/* Render blank cells for days before the first day of the month */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`blank-${i}`} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        ))}
        {daysInMonth.map((day) => {
          const dayData = data.find(d => isSameDay(new Date(d.date), day));
          const completedCount = dayData?.completedCount || 0;
          const totalHabits = dayData?.totalHabits || 0; // Assume if no data, no habits defined for that day
          const colorClass = getIntensityColor(completedCount, totalHabits);
          
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
                  <p>{completedCount > 0 ? `${completedCount} habit${completedCount > 1 ? 's' : ''} completed` : 'No habits tracked'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};


export default function HabitActivityCalendar() {
  const [activityData, setActivityData] = useState<DailyHabitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        // Fetch data for the current year, or adjust as needed
        const yearStart = startOfYear(new Date(currentYear, 0, 1));
        const yearEnd = endOfYear(new Date(currentYear, 11, 31));

        const dailyHabitsCol = collection(db, `dailyHabits/${USER_ID}`);
        const q = query(dailyHabitsCol, 
                        where('date', '>=', format(yearStart, 'yyyy-MM-dd')),
                        where('date', '<=', format(yearEnd, 'yyyy-MM-dd'))
                       );
        const snapshot = await getDocs(q);
        
        const data: DailyHabitData[] = snapshot.docs.map(doc => {
          const docData = doc.data();
          const habits = docData.habits as Record<string, boolean> || {};
          const completedCount = Object.values(habits).filter(Boolean).length;
          const totalHabits = Object.keys(habits).length;
          return { date: docData.date, completedCount, totalHabits };
        });
        setActivityData(data);
      } catch (error) {
        console.error("Error fetching habit activity data:", error);
        // Handle error appropriately, maybe set an error state
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentYear]);

  if (isLoading) {
    return (
      <Card className="shadow-lg rounded-xl mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarSearch className="mr-2 h-6 w-6 text-primary" />
            Habit Activity {currentYear}
          </CardTitle>
          <CardDescription>Loading activity heatmap...</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const monthsToDisplay = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));

  return (
    <Card className="shadow-lg rounded-xl mt-8">
      <CardHeader>
        <CardTitle className="flex items-center text-xl sm:text-2xl">
          <CalendarSearch className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Habit Activity - {currentYear}
        </CardTitle>
        <CardDescription>Your daily habit completion consistency.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 overflow-x-auto">
        <div className="flex flex-wrap gap-2 sm:gap-4 justify-around">
           {monthsToDisplay.map(month => (
            <MonthGrid 
                key={format(month, 'yyyy-MM')} 
                month={month} 
                data={activityData.filter(d => format(new Date(d.date), 'yyyy-MM') === format(month, 'yyyy-MM'))}
                year={currentYear}
            />
          ))}
        </div>
        {activityData.length === 0 && !isLoading && (
             <p className="text-center text-muted-foreground mt-6">No habit activity recorded for {currentYear}. Start tracking your habits!</p>
        )}
      </CardContent>
    </Card>
  );
}

