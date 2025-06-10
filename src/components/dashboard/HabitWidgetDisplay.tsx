
'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ListChecks } from 'lucide-react';
import type { Habit } from '@/types';
import { db, USER_ID, firebaseInitialized, firebaseInitError } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const userHabitsCollectionPath = `userHabits/${USER_ID}/habits`;

export default function HabitWidgetDisplay() {
  const [definedHabits, setDefinedHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseInitialized) {
      setError(firebaseInitError || "Firebase not configured.");
      setIsLoading(false);
      return () => {};
    }
    if (!db) {
        setError("Firestore not available.");
        setIsLoading(false);
        return () => {};
    }

    setIsLoading(true);
    setError(null);

    const habitsColRef = collection(db, userHabitsCollectionPath);
    const q = query(habitsColRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedHabits = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || 0),
          userId: data.userId,
        } as Habit;
      });
      setDefinedHabits(fetchedHabits);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching defined habits for widget:", err);
      setError("Could not load habit list.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (!firebaseInitialized && (error || firebaseInitError)) { 
     return (
      <div className="p-3 text-center text-xs">
        <AlertTriangle className="mx-auto h-5 w-5 text-destructive mb-1" />
        <p className="text-destructive font-medium">{error || firebaseInitError || "Error loading habits."}</p>
        <p className="text-muted-foreground text-xs mt-0.5">Check Firebase setup.</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        <Skeleton className="h-6 w-full rounded-md" />
        <Skeleton className="h-6 w-3/4 rounded-md" />
        <Skeleton className="h-6 w-full rounded-md" />
      </div>
    );
  }

  if (error) {
     return (
      <div className="p-3 text-center text-xs">
        <AlertTriangle className="mx-auto h-5 w-5 text-destructive mb-1" />
        <p className="text-destructive font-medium">{error}</p>
      </div>
    );
  }

  if (definedHabits.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center p-3">
        No habits defined yet. Go to the Habit Tracker page to add some!
      </p>
    );
  }

  return (
    <ScrollArea className="h-full max-h-[120px] p-1"> {/* Adjusted max height for widget */}
      <ul className="space-y-1.5 pr-2">
        {definedHabits.map(habit => (
          <li key={habit.id} className="text-xs text-foreground flex items-center">
            <ListChecks className="w-3 h-3 mr-1.5 text-primary flex-shrink-0" />
            <span className="truncate">{habit.name}</span>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
