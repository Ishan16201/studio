
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CalendarDays, Dot } from 'lucide-react';
import type { CalendarEvent } from '@/types';
import { db, USER_ID, firebaseInitialized, firebaseInitError } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { format, isSameDay, parseISO } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UpcomingEventsWidgetProps {
  maxEvents?: number;
}

const userEventsCollectionPath = `userEvents/${USER_ID}/events`;

export default function UpcomingEventsWidget({ maxEvents = 3 }: UpcomingEventsWidgetProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
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

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const eventsColRef = collection(db, userEventsCollectionPath);
    const q = query(
      eventsColRef,
      where('date', '>=', todayStr),
      orderBy('date', 'asc'),
      limit(maxEvents)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(),
      })) as CalendarEvent[];
      setUpcomingEvents(fetchedEvents);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching upcoming events:", err);
      setError("Could not load upcoming events.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [maxEvents]);

  if (!firebaseInitialized || error && !upcomingEvents.length) { // Show error prominently if initial load fails
     return (
      <div className="p-4 text-center text-xs">
        <AlertTriangle className="mx-auto h-6 w-6 text-destructive mb-1" />
        <p className="text-destructive">{error || firebaseInitError || "Error loading events."}</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array(maxEvents).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center p-4">
        No upcoming events in the near future.
      </p>
    );
  }

  return (
    <div className="space-y-2 p-1">
      {upcomingEvents.map(event => {
        const eventDate = parseISO(event.date); // event.date is 'yyyy-MM-dd'
        const isToday = isSameDay(eventDate, new Date());
        return (
          <Link href={`/calendar?date=${event.date}`} key={event.id} className="block hover:bg-secondary/50 rounded-md p-2 transition-colors">
            <div className="flex items-center justify-between text-xs">
                <span className={cn("font-medium truncate", isToday ? "text-primary" : "text-foreground")}>{event.title}</span>
                <span className={cn("text-muted-foreground whitespace-nowrap", isToday ? "font-semibold text-primary" : "")}>
                    {isToday ? 'Today' : format(eventDate, 'MMM d')}
                </span>
            </div>
            {event.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{event.description}</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
