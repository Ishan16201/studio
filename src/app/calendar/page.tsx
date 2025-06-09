
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CalendarDays, Info, PlusCircle, AlertTriangle, List } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, parseISO, isSameDay } from 'date-fns';
import type { CalendarEvent } from '@/types';
import { firebaseInitialized, firebaseInitError as fbConfigError, db, USER_ID } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import EventFormDialog from '@/components/calendar/EventFormDialog';
import EventItem from '@/components/calendar/EventItem';
import { Skeleton } from '@/components/ui/skeleton';

const userEventsCollectionPath = `userEvents/${USER_ID}/events`;

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const { toast } = useToast();

  const fetchEventsForMonth = useCallback((date: Date) => {
    if (!firebaseInitialized || !db) {
      setIsLoadingEvents(false);
      return () => {}; // Return an empty function for unsubscribe
    }
    setIsLoadingEvents(true);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const eventsColRef = collection(db, userEventsCollectionPath);
    // Query for events within the start and end of the month
    const q = query(eventsColRef, 
                    where('date', '>=', format(monthStart, 'yyyy-MM-dd')), 
                    where('date', '<=', format(monthEnd, 'yyyy-MM-dd')),
                    orderBy('date', 'asc') // Order by date
                  );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure createdAt is a Timestamp if it comes from serverTimestamp, otherwise handle its type
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt : Timestamp.now(), 
      })) as CalendarEvent[];
      setEvents(fetchedEvents);
      setIsLoadingEvents(false);
    }, (error) => {
      console.error("Error fetching month events:", error);
      toast({ title: "Error", description: "Could not load events for the month.", variant: "destructive" });
      setIsLoadingEvents(false);
    });
    return unsubscribe;
  }, [toast]); // Dependencies: firebaseInitialized, db, USER_ID, toast are stable or from context/constants

  useEffect(() => {
    if (selectedDate && firebaseInitialized && db) { // Ensure firebase is ready
      const unsubscribe = fetchEventsForMonth(selectedDate);
      return () => unsubscribe?.();
    }
  }, [selectedDate, fetchEventsForMonth, firebaseInitialized, db]); // Add firebaseInitialized and db

  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      // Filter events based on the exact date string.
      // Events dates are stored as 'yyyy-MM-dd'.
      setSelectedDayEvents(events.filter(event => event.date === dateString));
    } else {
      setSelectedDayEvents([]);
    }
  }, [selectedDate, events]);


  const handleAddEvent = async (eventData: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'>) => {
    if (!firebaseInitialized || !db) {
      toast({ title: "Error", description: "Firebase not configured. Cannot save event.", variant: "destructive" });
      return;
    }
    try {
      await addDoc(collection(db, userEventsCollectionPath), {
        ...eventData, // title, description, date (yyyy-MM-dd format)
        userId: USER_ID,
        createdAt: serverTimestamp(), // Use Firestore server timestamp
      });
      toast({ title: "Event Added", description: `"${eventData.title}" has been added to your calendar.` });
      // fetchEventsForMonth is not explicitly called here because onSnapshot will automatically update.
    } catch (error) {
      console.error("Error adding event:", error);
      toast({ title: "Error", description: "Could not save the event.", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!firebaseInitialized || !db) {
      toast({ title: "Error", description: "Firebase not configured. Cannot delete event.", variant: "destructive" });
      return;
    }
    try {
      await deleteDoc(doc(db, userEventsCollectionPath, eventId));
      toast({ title: "Event Deleted", description: "The event has been removed." });
      // onSnapshot will update the list
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ title: "Error", description: "Could not delete the event.", variant: "destructive" });
    }
  };
  
  // Parse event.date which is 'yyyy-MM-dd' string.
  // Using replace(/-/g, '/') is a common trick to help Date constructor parse correctly across browsers.
  const daysWithEventsModifier = events.map(event => parseISO(event.date));

  if (!firebaseInitialized) {
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
            <p className="text-lg text-destructive-foreground">{fbConfigError || "Firebase is not configured correctly. Some app features might be unavailable."}</p>
            <p className="text-sm text-muted-foreground mt-2">Please check the console for more details or contact support if the issue persists after verifying your setup.</p>
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
          <div className="flex flex-col items-center">
            <Button onClick={() => setShowEventForm(true)} className="mb-6 w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> New Event
            </Button>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border bg-popover text-popover-foreground w-full sm:max-w-md"
              initialFocus
              modifiers={{ daysWithEvents: daysWithEventsModifier }}
              modifiersClassNames={{ daysWithEvents: 'bg-accent text-accent-foreground rounded-full' }} // Enhanced visibility
              onMonthChange={(month) => fetchEventsForMonth(month)} // Fetch events when month changes
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
            {isLoadingEvents && !selectedDayEvents.length ? (
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full rounded-md" />
                    <Skeleton className="h-12 w-full rounded-md" />
                </div>
            ) : selectedDayEvents.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {selectedDayEvents.map(event => (
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
