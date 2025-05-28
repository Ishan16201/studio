
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db, USER_ID } from '@/lib/firebase';
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
import { PlusCircle, Trash2 } from 'lucide-react';

const getDailyHabitsDocPath = (date: Date) => {
  const dateString = format(date, 'yyyy-MM-dd');
  return `dailyHabits/${USER_ID}/${dateString}`; // Changed collection name for clarity
};

const userHabitsCollectionPath = `userHabits/${USER_ID}/habits`;

export default function HabitListComponent() {
  const [definedHabits, setDefinedHabits] = useState<Habit[]>([]); // Stores habit definitions
  const [dailyCompletions, setDailyCompletions] = useState<Record<string, boolean>>({}); // Tracks completion for the current day
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newHabitName, setNewHabitName] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();

  // Fetch habit definitions
  useEffect(() => {
    setIsLoading(true);
    const habitsColRef = collection(db, userHabitsCollectionPath);
    const q = query(habitsColRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedHabits = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          completed: false, // This will be overridden by dailyCompletions
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
          description: 'Could not load your habit list. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [toast]);

  // Fetch daily completions for the current date
  const fetchDailyCompletions = useCallback(async () => {
    // No need to set isLoading here as definedHabits loading handles the main skeleton
    try {
      const dailyDocRef = doc(db, getDailyHabitsDocPath(currentDate));
      const docSnap = await getDoc(dailyDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as DailyHabits;
        setDailyCompletions(data.habits || {});
      } else {
        setDailyCompletions({}); // No completions for this date yet
      }
    } catch (error) {
      console.error('Error fetching daily habit completions:', error);
      toast({
        title: 'Error Loading Daily Progress',
        description: 'Could not load today\'s habit progress.',
        variant: 'destructive',
      });
    }
  }, [currentDate, toast]);

  useEffect(() => {
    fetchDailyCompletions();
  }, [fetchDailyCompletions, definedHabits]); // Refetch daily completions if defined habits change

  const handleAddHabit = async () => {
    if (newHabitName.trim() === '') {
      toast({ title: 'Empty Habit Name', description: 'Please enter a name for your habit.', variant: 'destructive' });
      return;
    }
    if (definedHabits.some(h => h.name.toLowerCase() === newHabitName.trim().toLowerCase())) {
        toast({ title: 'Duplicate Habit', description: 'This habit name already exists.', variant: 'destructive' });
        return;
    }

    try {
      await addDoc(collection(db, userHabitsCollectionPath), {
        name: newHabitName.trim(),
        createdAt: serverTimestamp(),
        userId: USER_ID,
      });
      setNewHabitName('');
      toast({ title: 'Habit Added', description: `"${newHabitName.trim()}" was successfully added.` });
    } catch (error) {
      console.error('Error adding habit:', error);
      toast({ title: 'Error Adding Habit', description: 'Could not add the new habit.', variant: 'destructive' });
    }
  };

  const handleDeleteHabit = async (habitId: string, habitName: string) => {
    try {
      await deleteDoc(doc(db, userHabitsCollectionPath, habitId));
      // Also need to remove it from today's dailyCompletions if present, and save
      const updatedDailyCompletions = { ...dailyCompletions };
      delete updatedDailyCompletions[habitName]; // Use habitName as key for dailyCompletions
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
    const originalCompletions = { ...dailyCompletions };
    
    const updatedCompletions = {
      ...dailyCompletions,
      [habitName]: newCompletedStatus,
    };
    setDailyCompletions(updatedCompletions); // Optimistic update

    try {
      const dailyDocRef = doc(db, getDailyHabitsDocPath(currentDate));
      await setDoc(dailyDocRef, { date: format(currentDate, 'yyyy-MM-dd'), habits: updatedCompletions }, { merge: true });
    } catch (error) {
      console.error('Error updating habit status:', error);
      toast({
        title: 'Update Error',
        description: 'Could not update habit status. Your change was not saved.',
        variant: 'destructive',
      });
      setDailyCompletions(originalCompletions); // Revert UI
    }
  };
  

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
      {displayHabits.length === 0 && (
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
