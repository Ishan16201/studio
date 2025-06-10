
'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import type { CalendarEvent } from '@/types';
import { db, USER_ID, firebaseInitialized, firebaseInitError } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { format, isSameDay, parseISO, isValid } from 'date-fns';
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
      const fetchedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAtDate: Date;
        if (data.createdAt instanceof Timestamp) {
            createdAtDate = data.createdAt.toDate();
        } else if (data.createdAt && typeof data.createdAt.seconds === 'number') {
            createdAtDate = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate();
        } else {
            createdAtDate = new Date(data.createdAt || 0);
        }
        
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          date: data.date,
          userId: data.userId,
          createdAt: createdAtDate,
        } as CalendarEvent;
      });
      setUpcomingEvents(fetchedEvents);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching upcoming events:", err);
      setError("Could not load upcoming events.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [maxEvents]); // firebaseInitialized, firebaseInitError, db removed as they are checked inside effect

  if (!firebaseInitialized && (error || firebaseInitError)) { 
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
  
  if (error) { // Show non-config related errors
     return (
      <div className="p-4 text-center text-xs">
        <AlertTriangle className="mx-auto h-6 w-6 text-destructive mb-1" />
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center p-4">
        No upcoming events.
      </p>
    );
  }

  return (
    <div className="space-y-2 p-1">
      {upcomingEvents.map(event => {
        let eventDate: Date | null = null;
        try {
            const parsed = parseISO(event.date);
            if(isValid(parsed)) eventDate = parsed;
        } catch { /* ignore parse error */ }

        const isToday = eventDate ? isSameDay(eventDate, new Date()) : false;
        return (
          <Link href={`/calendar?date=${event.date}`} key={event.id} className="block hover:bg-secondary/50 rounded-md p-2 transition-colors">
            <div className="flex items-center justify-between text-xs">
                <span className={cn("font-medium truncate", isToday ? "text-primary" : "text-foreground")}>{event.title}</span>
                <span className={cn("text-muted-foreground whitespace-nowrap", isToday ? "font-semibold text-primary" : "")}>
                    {isToday ? 'Today' : (eventDate ? format(eventDate, 'MMM d') : 'Invalid Date')}
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
