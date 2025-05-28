
'use client'; // Required for ProtectedRoute

import HabitListComponent from '@/components/habits/HabitList';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import ProtectedRoute from '@/components/auth/ProtectedRoute'; // Import ProtectedRoute

// export const metadata = { // Metadata should be static for server components
// title: 'Habit Tracker - Grindset',
// description: 'Build good habits and track your daily progress.',
// };

function HabitsPageContent() {
  const today = format(new Date(), "eeee, MMMM do"); 

  return (
    <div className="container mx-auto max-w-xl p-4 md:p-8">
      <Card className="shadow-xl rounded-xl">
        <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-xl p-4 sm:p-6">
           <div className="mx-auto bg-primary-foreground/20 p-3 rounded-full w-fit mb-2">
             <ListChecks className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
           </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Habit Tracker</CardTitle>
          <CardDescription className="text-primary-foreground/80 text-sm sm:text-base">
            Today is <span className="font-semibold">{today}</span>. Let's build some habits.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <HabitListComponent />
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground mt-6 sm:mt-8">
        Consistency is key. Track your progress daily.
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
