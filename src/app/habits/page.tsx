
'use client';

import { useState, useEffect } from 'react';
import HabitListComponent from '@/components/habits/HabitList';
import HabitActivityCalendar from '@/components/habits/HabitActivityCalendar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ListChecks, CalendarSearch, Info } from 'lucide-react';
import { format, startOfYear, endOfYear, parseISO } from 'date-fns';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { Habit } from '@/types';
import { db, USER_ID } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, getDocs, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyLogData {
  date: string; 
  habits: Record<string, boolean>;
}

const userHabitsCollectionPath = `userHabits/${USER_ID}/habits`;
const userDailyLogsCollectionPath = `userHabitsData/${USER_ID}/dailyLogs`;


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

  const fetchAllYearlyLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const yearStart = startOfYear(new Date(currentYear, 0, 1));
        const yearEnd = endOfYear(new Date(currentYear, 11, 31));

        const dailyLogsColRef = collection(db, userDailyLogsCollectionPath);
        const qLogs = query(dailyLogsColRef, 
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

  // Fetch all daily logs for the current year once
  useEffect(() => {
    fetchAllYearlyLogs();
  }, [currentYear, toast]);


  const handleTogglePastHabit = async (date: Date, habitName: string, currentStatus: boolean) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dailyDocRef = doc(db, userDailyLogsCollectionPath, dateString);

    // Optimistically update UI
    setAllDailyLogsForYear(prevLogs => {
      const logIndex = prevLogs.findIndex(log => log.date === dateString);
      const newStatus = !currentStatus;
      if (logIndex > -1) {
        const updatedLogs = [...prevLogs];
        const newHabits = { ...updatedLogs[logIndex].habits, [habitName]: newStatus };
        updatedLogs[logIndex] = { ...updatedLogs[logIndex], habits: newHabits };
        return updatedLogs;
      } else {
        // If no log exists for this day, create one
        const newLog: DailyLogData = { date: dateString, habits: { [habitName]: newStatus } };
        // Initialize other defined habits for this new log entry if they are not present
        definedHabits.forEach(h => {
          if (!(h.name in newLog.habits)) {
            newLog.habits[h.name] = false; // Default to false if not the one being toggled
          }
        });
        return [...prevLogs, newLog].sort((a, b) => a.date.localeCompare(b.date));
      }
    });

    try {
      const docSnap = await getDoc(dailyDocRef);
      let newHabitsData: Record<string, boolean> = {};

      if (docSnap.exists()) {
        newHabitsData = { ...docSnap.data().habits };
      } else {
        // If the document doesn't exist, initialize with all defined habits as false
        definedHabits.forEach(h => {
          newHabitsData[h.name] = false;
        });
      }
      newHabitsData[habitName] = !currentStatus; // Toggle the specific habit

      await setDoc(dailyDocRef, { date: dateString, habits: newHabitsData }, { merge: true });

      toast({
        title: 'Habit Updated',
        description: `"${habitName}" for ${dateString} marked as ${!currentStatus ? 'complete' : 'incomplete'}.`,
      });
    } catch (error) {
      console.error('Error updating past habit status:', error);
      toast({
        title: 'Update Error',
        description: 'Could not update habit status. Reverting change.',
        variant: 'destructive',
      });
      // Revert optimistic update by re-fetching
      await fetchAllYearlyLogs();
    }
  };


  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8"> 
      
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
        <h2 className="text-2xl font-semibold mb-2 text-foreground flex items-center">
            <CalendarSearch className="mr-3 h-7 w-7 text-primary"/>
            Habit Activity Heatmaps - {currentYear}
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
            Click on a square in the heatmaps below to toggle habit completion for past dates.
        </p>
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
              onTogglePastHabit={handleTogglePastHabit}
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

    