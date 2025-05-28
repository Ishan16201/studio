
'use client';

import { useState, useEffect } from 'react';
import HabitListComponent from '@/components/habits/HabitList';
import HabitActivityCalendar from '@/components/habits/HabitActivityCalendar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ListChecks, CalendarSearch, Info } from 'lucide-react';
import { format } from 'date-fns';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { Habit } from '@/types';
import { db, USER_ID } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, getDocs, where, startOfYear, endOfYear } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyLogData {
  date: string; 
  habits: Record<string, boolean>;
}

const userHabitsCollectionPath = `userHabits/${USER_ID}/habits`;

function HabitsPageContent() {
  const today = format(new Date(), "eeee, MMMM do"); 
  const [definedHabits, setDefinedHabits] = useState<Habit[]>([]);
  const [isLoadingHabits, setIsLoadingHabits] = useState(true);
  
  const [allDailyLogsForYear, setAllDailyLogsForYear] = useState<DailyLogData[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  // Fetch defined habits
  useEffect(() => {
    setIsLoadingHabits(true);
    const habitsColRef = collection(db, userHabitsCollectionPath);
    const q = query(habitsColRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedHabits = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          createdAt: doc.data().createdAt,
          userId: doc.data().userId,
        }));
        setDefinedHabits(fetchedHabits);
        setIsLoadingHabits(false);
      },
      (error) => {
        console.error('Error fetching habit definitions for page:', error);
        toast({
          title: 'Error Loading Habits',
          description: 'Could not load your habit definitions for heatmap display.',
          variant: 'destructive',
        });
        setIsLoadingHabits(false);
      }
    );
    return () => unsubscribe();
  }, [toast]);

  // Fetch all daily logs for the current year once
  useEffect(() => {
    const fetchAllYearlyLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const yearStart = startOfYear(new Date(currentYear, 0, 1));
        const yearEnd = endOfYear(new Date(currentYear, 11, 31));

        const dailyHabitsCol = collection(db, `dailyHabits/${USER_ID}`);
        const qLogs = query(dailyHabitsCol, 
                        where('date', '>=', format(yearStart, 'yyyy-MM-dd')),
                        where('date', '<=', format(yearEnd, 'yyyy-MM-dd'))
                       );
        const snapshot = await getDocs(qLogs);
        
        const logs: DailyLogData[] = snapshot.docs.map(doc => {
          const docData = doc.data();
          return { date: docData.date, habits: docData.habits as Record<string, boolean> || {} };
        });
        setAllDailyLogsForYear(logs);
      } catch (error) {
        console.error("Error fetching all habit activity data for year:", error);
        toast({
          title: 'Error Loading Activity Data',
          description: 'Could not load yearly activity for heatmaps.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchAllYearlyLogs();
  }, [currentYear, toast]);

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8"> {/* Increased max-width */}
      
      <Card className="shadow-xl rounded-xl mb-8">
        <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-xl p-4 sm:p-6">
           <div className="mx-auto bg-primary-foreground/20 p-3 rounded-full w-fit mb-2">
             <ListChecks className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
           </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Daily Habit Tracker</CardTitle>
          <CardDescription className="text-primary-foreground/80 text-sm sm:text-base">
            Today is <span className="font-semibold">{today}</span>. Manage your habits and track daily progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <HabitListComponent />
        </CardContent>
      </Card>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-1 text-foreground flex items-center">
            <CalendarSearch className="mr-3 h-7 w-7 text-primary"/>
            Habit Activity Heatmaps - {currentYear}
        </h2>
        <p className="text-muted-foreground mb-6">Visualize your consistency for each habit over the year. Heatmaps are for display only.</p>
         <div className="flex items-start space-x-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-md mb-4">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
            <p>Clicking on heatmap squares to modify past data is not yet supported. Use the list above to track today's habits.</p>
        </div>
      </div>

      {isLoadingHabits || isLoadingLogs ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(2).fill(0).map((_, i) => (
            <Card key={i} className="shadow-lg rounded-xl">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : definedHabits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {definedHabits.map(habit => (
            <HabitActivityCalendar 
              key={habit.id} 
              habit={habit}
              allDailyLogsForYear={allDailyLogsForYear}
              currentYear={currentYear}
              isLoadingLogs={isLoadingLogs} 
            />
          ))}
        </div>
      ) : (
        <Card className="shadow-lg rounded-xl">
            <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No habits defined yet. Add some habits in the "Daily Habit Tracker" section above to see their activity heatmaps here.</p>
            </CardContent>
        </Card>
      )}
      
      <p className="text-center text-sm text-muted-foreground mt-10 sm:mt-12">
        Consistency is key. Keep building those habits!
      </p>
    </div>
  );
}

export default function HabitsPage() {
  return (
    <ProtectedRoute>
      <HabitsPageContent />
    </ProtectedRoute>
  );
}

    