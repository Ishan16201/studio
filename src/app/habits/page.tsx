
'use client'; // Required for ProtectedRoute

import HabitListComponent from '@/components/habits/HabitList';
import HabitActivityCalendar from '@/components/habits/HabitActivityCalendar'; // Import the new component
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ListChecks, CalendarSearch } from 'lucide-react';
import { format } from 'date-fns';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function HabitsPageContent() {
  const today = format(new Date(), "eeee, MMMM do"); 

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-8"> {/* Increased max-width for more space */}
      
      {/* Daily Habit List and Management */}
      <Card className="shadow-xl rounded-xl mb-8">
        <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-xl p-4 sm:p-6">
           <div className="mx-auto bg-primary-foreground/20 p-3 rounded-full w-fit mb-2">
             <ListChecks className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
           </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Daily Habit Tracker</CardTitle>
          <CardDescription className="text-primary-foreground/80 text-sm sm:text-base">
            Today is <span className="font-semibold">{today}</span>. Let's build some habits.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <HabitListComponent />
        </CardContent>
      </Card>

      {/* Habit Activity Calendar/Heatmap */}
      <HabitActivityCalendar />
      
      <p className="text-center text-sm text-muted-foreground mt-10 sm:mt-12">
        Consistency is key. Track your progress daily and view your activity over time.
      </p>
    </div>
  );
}

export default function HabitsPage() {
  return (
    <ProtectedRoute>
      <HabitsPageContent />
    </ProtectedRoute>
  );
}
