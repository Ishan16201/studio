import PomodoroTimerComponent from '@/components/pomodoro/PomodoroTimer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Timer } from 'lucide-react';

export const metadata = {
  title: 'Pomodoro Timer - Grindset',
  description: 'Boost your focus with the Pomodoro technique.',
};

export default function PomodoroPage() {
  return (
    <div className="container mx-auto max-w-md p-4 md:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]"> {/* Adjust min-height considering nav */}
      <Card className="w-full shadow-xl rounded-xl">
        <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-xl">
          <div className="mx-auto bg-primary-foreground/20 p-3 rounded-full w-fit mb-2">
            <Timer className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">Pomodoro Timer</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Focus in intervals. Achieve more.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <PomodoroTimerComponent />
        </CardContent>
      </Card>
       <p className="text-center text-sm text-muted-foreground mt-8">
        Work for 25 minutes, then take a 5-minute break. Repeat.
      </p>
    </div>
  );
}
