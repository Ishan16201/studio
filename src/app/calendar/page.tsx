
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CalendarDays, Info, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';


export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleAddEvent = () => {
    toast({
      title: "Add Event Clicked",
      description: "Event creation functionality is not yet implemented.",
    });
  };

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-8">
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
        <CardContent className="p-4 md:p-6 flex flex-col items-center">
          <Button onClick={handleAddEvent} className="mb-6 w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> New Event
          </Button>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border bg-popover text-popover-foreground w-full sm:max-w-md"
            initialFocus
          />
          {selectedDate && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Selected: {format(selectedDate, 'PPP')}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-4 md:p-6 border-t">
            <div className="flex items-start space-x-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>This is a basic calendar view. Click 'New Event' to (eventually) add events. Full event management features are planned for future updates.</p>
            </div>
        </CardFooter>
      </Card>
       <p className="text-center text-sm text-muted-foreground mt-6 sm:mt-8">
        Your events, all in one place. Stay organized.
      </p>
    </div>
  );
}
