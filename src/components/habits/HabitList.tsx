'use client';

import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button'; // For potential "Add Habit" later
import { Input } from '@/components/ui/input'; // For potential "Add Habit" later
import { db, USER_ID } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import type { Habit, DailyHabits } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Edit3, PlusCircle, Trash2 } from 'lucide-react';

const PREDEFINED_HABITS: Omit<Habit, 'id' | 'completed'>[] = [
  { name: 'Wake up by 6 AM' },
  { name: '30 mins Exercise' },
  { name: 'Read for 20 mins' },
  { name: 'Plan your day' },
  { name: 'No screen 1hr before bed' },
];

const getHabitsDocPath = (date: Date) => {
  const dateString = format(date, 'yyyy-MM-dd');
  return `habits/${USER_ID}/${dateString}`;
};

export default function HabitListComponent() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState(new Date()); // Can be changed later for history view
  const { toast } = useToast();

  const fetchHabits = useCallback(async () => {
    setIsLoading(true);
    try {
      const docRef = doc(db, getHabitsDocPath(currentDate));
      const docSnap = await getDoc(docRef);

      let dailyHabitStatus: Record<string, boolean> = {};
      if (docSnap.exists()) {
        dailyHabitStatus = (docSnap.data() as DailyHabits).habits || {};
      }

      const mergedHabits = PREDEFINED_HABITS.map((predefinedHabit, index) => ({
        id: predefinedHabit.name.toLowerCase().replace(/\s+/g, '-'), // Generate an ID
        name: predefinedHabit.name,
        completed: dailyHabitStatus[predefinedHabit.name] || false,
      }));
      
      setHabits(mergedHabits);

    } catch (error) {
      console.error('Error fetching habits:', error);
      toast({
        title: 'Error',
        description: 'Could not load habits. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, toast]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleToggleHabit = async (habitId: string, completed: boolean) => {
    const updatedHabits = habits.map((h) =>
      h.id === habitId ? { ...h, completed } : h
    );
    setHabits(updatedHabits);

    try {
      const docRef = doc(db, getHabitsDocPath(currentDate));
      const habitToUpdate = updatedHabits.find(h => h.id === habitId);
      if (!habitToUpdate) return;

      const habitsToSave: Record<string, boolean> = {};
      updatedHabits.forEach(h => {
        habitsToSave[h.name] = h.completed;
      });
      
      await setDoc(docRef, { date: format(currentDate, 'yyyy-MM-dd'), habits: habitsToSave }, { merge: true });
      // toast({ title: "Habit Updated", description: `${habitToUpdate.name} marked as ${completed ? 'complete' : 'incomplete'}.`});
    } catch (error) {
      console.error('Error updating habit:', error);
      toast({
        title: 'Update Error',
        description: 'Could not update habit status. Please try again.',
        variant: 'destructive',
      });
      // Revert UI change on error
      setHabits(habits.map((h) =>
        h.id === habitId ? { ...h, completed: !completed } : h
      ));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-card rounded-lg shadow">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    );
  }
  
  if (habits.length === 0 && !isLoading) {
    return <p className="text-center text-muted-foreground py-8">No habits defined yet. Start by adding some!</p>;
  }

  return (
    <div className="space-y-4">
      {habits.map((habit) => (
        <div
          key={habit.id}
          className={`flex items-center justify-between p-4 rounded-lg shadow-sm transition-all duration-300
                      ${habit.completed ? 'bg-green-100 dark:bg-green-900 border-l-4 border-green-500' : 'bg-card'}`}
        >
          <Label htmlFor={habit.id} className={`text-base font-medium ${habit.completed ? 'text-green-700 dark:text-green-300 line-through' : 'text-foreground'}`}>
            {habit.name}
          </Label>
          <Switch
            id={habit.id}
            checked={habit.completed}
            onCheckedChange={(checked) => handleToggleHabit(habit.id, checked)}
            aria-label={`Mark ${habit.name} as ${habit.completed ? 'incomplete' : 'complete'}`}
            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-muted"
          />
        </div>
      ))}
      {/* Placeholder for adding new habits - Future enhancement
      <div className="mt-6 pt-4 border-t">
        <h3 className="text-lg font-semibold mb-2">Add New Habit</h3>
        <div className="flex space-x-2">
          <Input placeholder="E.g., Drink 8 glasses of water" className="flex-grow" />
          <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
        </div>
      </div>
      */}
    </div>
  );
}
