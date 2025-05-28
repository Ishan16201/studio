
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db, USER_ID, firebaseInitialized, firebaseInitError as fbInitError } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { Habit, DailyHabits } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, AlertTriangle } from 'lucide-react';

const getDailyHabitsDocPath = (date: Date) => {
  const dateString = format(date, 'yyyy-MM-dd');
  return `userHabitsData/${USER_ID}/dailyLogs/${dateString}`;
};

const userHabitsCollectionPath = `userHabits/${USER_ID}/habits`;

export default function HabitListComponent() {
  const [definedHabits, setDefinedHabits] = useState<Habit[]>([]);
  const [dailyCompletions, setDailyCompletions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newHabitName, setNewHabitName] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [initError, setInitError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!firebaseInitialized) {
      setInitError(fbInitError || "Firebase is not initialized. Please check configuration.");
      setIsLoading(false);
      return;
    }
    if (!db) {
        setInitError("Firestore database instance is not available.");
        setIsLoading(false);
        return;
    }
    setInitError(null); // Clear init error if Firebase is good

    setIsLoading(true);
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
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching habit definitions:', error);
        toast({
          title: 'Error Loading Habit Definitions',
          description: 'Could not load your habit list. Please check your connection or browser storage. Showing empty list.',
          variant: 'destructive',
        });
        setDefinedHabits([]);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [toast]);

  const fetchDailyCompletions = useCallback(async () => {
    if (!firebaseInitialized || !db) return;
    try {
      const dailyDocRef = doc(db, getDailyHabitsDocPath(currentDate));
      const docSnap = await getDoc(dailyDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as DailyHabits;
        setDailyCompletions(data.habits || {});
      } else {
        setDailyCompletions({});
      }
    } catch (error) {
      console.error('Error fetching daily habit completions:', error);
      toast({
        title: 'Error Loading Daily Progress',
        description: `Could not load progress for ${format(currentDate, 'yyyy-MM-dd')}.`,
        variant: 'destructive',
      });
    }
  }, [currentDate, toast]);

  useEffect(() => {
    if (firebaseInitialized && db) {
      fetchDailyCompletions();
    }
  }, [fetchDailyCompletions, firebaseInitialized, db]);

  const handleAddHabit = async () => {
    if (!firebaseInitialized || !db) {
      toast({ title: 'Error', description: 'Cannot add habit: Firebase not configured.', variant: 'destructive' });
      return;
    }
    const trimmedName = newHabitName.trim();
    if (trimmedName === '') {
      toast({ title: 'Empty Habit Name', description: 'Please enter a name for your habit.', variant: 'destructive' });
      return;
    }
    if (definedHabits.some(h => h.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: 'Duplicate Habit', description: 'This habit name already exists.', variant: 'destructive' });
        return;
    }

    try {
      await addDoc(collection(db, userHabitsCollectionPath), {
        name: trimmedName,
        createdAt: serverTimestamp(),
        userId: USER_ID,
      });
      setNewHabitName('');
      toast({ title: 'Habit Added', description: `"${trimmedName}" was successfully added.` });
    } catch (error) {
      console.error('Error adding habit:', error);
      toast({ title: 'Error Adding Habit', description: 'Could not add the new habit.', variant: 'destructive' });
    }
  };

  const handleDeleteHabit = async (habitId: string, habitName: string) => {
    if (!firebaseInitialized || !db) {
      toast({ title: 'Error', description: 'Cannot delete habit: Firebase not configured.', variant: 'destructive' });
      return;
    }
    try {
      await deleteDoc(doc(db, userHabitsCollectionPath, habitId));
      
      const updatedDailyCompletions = { ...dailyCompletions };
      delete updatedDailyCompletions[habitName]; 
      setDailyCompletions(updatedDailyCompletions);
      
      const dailyDocRef = doc(db, getDailyHabitsDocPath(currentDate));
      await setDoc(dailyDocRef, { date: format(currentDate, 'yyyy-MM-dd'), habits: updatedDailyCompletions }, { merge: true });

      toast({ title: 'Habit Deleted', description: `"${habitName}" was deleted.` });
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({ title: 'Error Deleting Habit', description: 'Could not delete the habit.', variant: 'destructive' });
    }
  };

  const handleToggleHabit = async (habitName: string, newCompletedStatus: boolean) => {
    if (!firebaseInitialized || !db) {
      toast({ title: 'Error', description: 'Cannot update habit: Firebase not configured.', variant: 'destructive' });
      return;
    }
    const originalCompletions = { ...dailyCompletions };
    
    const updatedCompletions = {
      ...dailyCompletions,
      [habitName]: newCompletedStatus,
    };
    setDailyCompletions(updatedCompletions); 

    try {
      const dailyDocRef = doc(db, getDailyHabitsDocPath(currentDate));
      const habitsToSave: Record<string, boolean> = {};
      definedHabits.forEach(h => {
        habitsToSave[h.name] = updatedCompletions[h.name] || false;
      });
      habitsToSave[habitName] = newCompletedStatus;

      await setDoc(dailyDocRef, { date: format(currentDate, 'yyyy-MM-dd'), habits: habitsToSave }, { merge: true });
    } catch (error) {
      console.error('Error updating habit status:', error);
      toast({
        title: 'Update Error',
        description: 'Could not update habit status. Your change was not saved.',
        variant: 'destructive',
      });
      setDailyCompletions(originalCompletions); 
    }
  };
  
  if (initError) {
    return (
      <div className="w-full p-4 text-center text-destructive-foreground bg-destructive/80 rounded-md">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
        <p className="font-semibold">Configuration Error</p>
        <p className="text-sm">{initError}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-card rounded-lg shadow">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
        <div className="flex gap-2 mt-6 pt-4 border-t">
            <Skeleton className="h-10 flex-grow" />
            <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  const displayHabits = definedHabits.map(habit => ({
    ...habit,
    completed: dailyCompletions[habit.name] || false,
  }));

  return (
    <div className="space-y-4">
      {displayHabits.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground py-8">No habits defined yet. Add your first habit below!</p>
      )}
      {displayHabits.map((habit) => (
        <div
          key={habit.id}
          className={`flex items-center justify-between p-3 sm:p-4 rounded-lg shadow-sm transition-all duration-300
                      ${habit.completed ? 'bg-primary/20 dark:bg-primary/10 border-l-4 border-primary' : 'bg-card'}`}
        >
          <Label htmlFor={habit.id} className={`text-sm sm:text-base font-medium flex-grow mr-2 ${habit.completed ? 'text-primary line-through' : 'text-foreground'}`}>
            {habit.name}
          </Label>
          <div className="flex items-center space-x-2">
            <Switch
              id={habit.id}
              checked={habit.completed}
              onCheckedChange={(checked) => handleToggleHabit(habit.name, checked)}
              aria-label={`Mark ${habit.name} as ${habit.completed ? 'incomplete' : 'complete'}`}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
            />
            <Button variant="ghost" size="icon" onClick={() => handleDeleteHabit(habit.id, habit.name)} className="text-destructive hover:text-destructive/80 w-8 h-8 sm:w-9 sm:h-9">
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Delete {habit.name}</span>
            </Button>
          </div>
        </div>
      ))}
      
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-lg font-semibold mb-3 text-foreground">Add New Habit</h3>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Input
            placeholder="E.g., Drink 8 glasses of water"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            className="flex-grow bg-input"
          />
          <Button onClick={handleAddHabit} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Habit
          </Button>
        </div>
      </div>
    </div>
  );
}
