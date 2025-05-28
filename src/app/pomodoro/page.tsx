
'use client'; // Required for ProtectedRoute

import PomodoroTimerComponent from '@/components/pomodoro/PomodoroTimer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Timer } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute'; // Import ProtectedRoute

// export const metadata = { // Metadata should be static for server components
// title: 'Pomodoro Timer - Grindset',
// description: 'Boost your focus with the Pomodoro technique.',
// };

function PomodoroPageContent() {
  return (
    <div className="container mx-auto max-w-md p-4 md:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] sm:min-h-[calc(100vh-120px)]">
      <Card className="w-full shadow-xl rounded-xl">
        <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-xl p-4 sm:p-6">
          <div className="mx-auto bg-primary-foreground/20 p-3 rounded-full w-fit mb-2">
            <Timer className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Pomodoro Timer</CardTitle>
          <CardDescription className="text-primary-foreground/80 text-sm sm:text-base">
            Focus in intervals. Achieve more.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <PomodoroTimerComponent />
        </CardContent>
      </Card>
       <p className="text-center text-sm text-muted-foreground mt-6 sm:mt-8 px-2">
        Work for 25 minutes, then take a 5-minute break. Repeat.
      </p>
    </div>
  );
}

export default function PomodoroPage() {
  return (
    <ProtectedRoute>
      <PomodoroPageContent />
    </ProtectedRoute>
  );
}
