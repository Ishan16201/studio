
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CalendarDays, List, PlusCircle, AlertTriangle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import type { CalendarEvent } from '@/types';
import { getFirebaseDb, USER_ID, whenFirebaseInitialized, getFirebaseError } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import EventFormDialog from '@/components/calendar/EventFormDialog';
import EventItem from '@/components/calendar/EventItem';
import { Skeleton } from '@/components/ui/skeleton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const userEventsCollectionPath = `userEvents/${USER_ID}/events`;

function CalendarPageContent() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pageError, setPageError] = useState<string | null>(null);

  const fetchEventsForMonth = useCallback((dateForMonth: Date, dbInstance: any) => {
    if (!dbInstance) {
      setIsLoadingEvents(false);
      return () => {}; 
    }
    setIsLoadingEvents(true);
    const monthStart = startOfMonth(dateForMonth);
    const monthEnd = endOfMonth(dateForMonth);

    const eventsColRef = collection(dbInstance, userEventsCollectionPath);
    const q = query(eventsColRef, 
                    where('date', '>=', format(monthStart, 'yyyy-MM-dd')), 
                    where('date', '<=', format(monthEnd, 'yyyy-MM-dd')),
                    orderBy('date', 'asc')
                  );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let createdAtDate: Date;
        if (data.createdAt instanceof Timestamp) {
            createdAtDate = data.createdAt.toDate();
        } else if (data.createdAt && typeof data.createdAt.seconds === 'number') {
             createdAtDate = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate();
        } else {
            createdAtDate = new Date(data.createdAt || 0); // Fallback
        }
        
        return {
          id: docSnap.id,
          title: data.title,
          description: data.description,
          date: data.date, 
          userId: data.userId,
          createdAt: createdAtDate,
        } as CalendarEvent;
      });
      setEvents(fetchedEvents);
      setIsLoadingEvents(false);
    }, (error) => {
      console.error("Error fetching month events:", error);
      toast({ title: "Error", description: "Could not load events for the month.", variant: "destructive" });
      setPageError("Could not load events for the month.");
      setIsLoadingEvents(false);
    });
    return unsubscribe;
  }, [toast]); 

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const initAndFetch = async () => {
      setIsLoadingEvents(true);
      try {
        await whenFirebaseInitialized();
        const db = getFirebaseDb();
        const firebaseConfigError = getFirebaseError();

        if (firebaseConfigError) {
          setPageError(firebaseConfigError);
          setIsLoadingEvents(false);
          return;
        }
        if (!db) {
          setPageError("Firestore not available.");
          setIsLoadingEvents(false);
          return;
        }
        unsubscribe = fetchEventsForMonth(currentMonth, db);
      } catch (initError: any) {
        setPageError(initError.message || "Firebase initialization failed.");
        setIsLoadingEvents(false);
      }
    };
    initAndFetch();
    return () => unsubscribe?.();
  }, [currentMonth, fetchEventsForMonth]);

  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      setSelectedDayEvents(events.filter(event => {
        try {
            const eventDate = parseISO(event.date); 
            return isValid(eventDate) && format(eventDate, 'yyyy-MM-dd') === dateString;
        } catch (e) {
            console.warn("Invalid event date format encountered:", event.date);
            return false;
        }
      }));
    } else {
      setSelectedDayEvents([]);
    }
  }, [selectedDate, events]);


  const handleAddEvent = async (eventData: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'>) => {
    const db = getFirebaseDb();
    if (!db) {
      toast({ title: "Error", description: "Firebase not configured. Cannot save event.", variant: "destructive" });
      setPageError("Firebase not configured. Cannot save event.");
      return;
    }
    try {
      await addDoc(collection(db, userEventsCollectionPath), {
        ...eventData, 
        userId: USER_ID,
        createdAt: serverTimestamp(), 
      });
      toast({ title: "Event Added", description: `"${eventData.title}" has been added.` });
    } catch (error) {
      console.error("Error adding event:", error);
      toast({ title: "Error", description: "Could not save the event.", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const db = getFirebaseDb();
    if (!db) {
      toast({ title: "Error", description: "Firebase not configured. Cannot delete event.", variant: "destructive" });
      setPageError("Firebase not configured. Cannot delete event.");
      return;
    }
    try {
      await deleteDoc(doc(db, userEventsCollectionPath, eventId));
      toast({ title: "Event Deleted", description: "The event has been removed." });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ title: "Error", description: "Could not delete the event.", variant: "destructive" });
    }
  };
  
  const daysWithEventsModifier = events
    .map(event => {
        try { return parseISO(event.date); } catch { return null; }
    })
    .filter(date => date && isValid(date)) as Date[];

  if (pageError && isLoadingEvents) { // Show config error only if it's present and still loading
    return (
      <div className="container mx-auto max-w-2xl p-4 md:p-8">
        <Card className="shadow-xl rounded-xl bg-card">
          <CardHeader className="text-center bg-destructive text-destructive-foreground rounded-t-xl p-4 sm:p-6">
            <div className="mx-auto bg-destructive-foreground/20 p-3 rounded-full w-fit mb-2">
              <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-destructive-foreground" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold">Configuration Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-lg text-foreground">{pageError}</p>
            <p className="text-sm text-muted-foreground mt-2">Please check your environment variables and ensure Firebase is set up correctly.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <Card className="shadow-xl rounded-xl bg-card">
        <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-xl p-4 sm:p-6">
           <div className="mx-auto bg-primary-foreground/20 p-3 rounded-full w-fit mb-2">
             <CalendarDays className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
           </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Calendar</CardTitle>
          <CardDescription className="text-primary-foreground/80 text-sm sm:text-base">
            Manage your schedule and upcoming events.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center p-2 rounded-lg bg-card/50">
            <Button onClick={() => setShowEventForm(true)} className="mb-6 w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> New Event
            </Button>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border bg-popover text-popover-foreground w-full sm:max-w-md"
              initialFocus
              modifiers={{ daysWithEvents: daysWithEventsModifier }}
              modifiersClassNames={{ daysWithEvents: 'bg-accent text-accent-foreground rounded-full font-bold' }}
            />
            {selectedDate && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Selected: {format(selectedDate, 'PPP')}
              </p>
            )}
          </div>
          <div className="mt-6 md:mt-0">
            <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center">
                <List className="mr-2 h-5 w-5 text-primary"/>
                Events for {selectedDate ? format(selectedDate, 'MMMM do') : 'Selected Date'}
            </h3>
            {isLoadingEvents && selectedDayEvents.length === 0 ? ( 
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full rounded-md" />
                    <Skeleton className="h-12 w-full rounded-md" />
                </div>
            ) : selectedDayEvents.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {selectedDayEvents.sort((a,b) => a.title.localeCompare(b.title)).map(event => (
                  <EventItem key={event.id} event={event} onDelete={handleDeleteEvent} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No events for this day.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <EventFormDialog
        isOpen={showEventForm}
        onClose={() => setShowEventForm(false)}
        onSave={handleAddEvent}
        selectedDate={selectedDate}
      />
       <p className="text-center text-sm text-muted-foreground mt-6 sm:mt-8">
        Your events, all in one place. Stay organized.
      </p>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <CalendarPageContent />
    </ProtectedRoute>
  );
}
