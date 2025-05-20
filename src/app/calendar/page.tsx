import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar'; // ShadCN Calendar

export const metadata = {
  title: 'Calendar - Grindset',
  description: 'View your schedule and plan your events.',
};

export default function CalendarPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-8">
      <Card className="shadow-xl rounded-xl bg-card">
        <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-xl">
           <div className="mx-auto bg-primary-foreground/20 p-3 rounded-full w-fit mb-2">
             <CalendarDays className="w-10 h-10 text-primary-foreground" />
           </div>
          <CardTitle className="text-3xl font-bold">Calendar</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Manage your schedule and upcoming events.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 flex justify-center">
          <Calendar
            mode="single"
            // selected={date} // Manage date state if needed
            // onSelect={setDate}
            className="rounded-md border bg-popover text-popover-foreground"
          />
        </CardContent>
      </Card>
       <p className="text-center text-sm text-muted-foreground mt-8">
        Your events, all in one place. Stay organized.
      </p>
    </div>
  );
}
