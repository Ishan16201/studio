'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { PomodoroState, PomodoroMode } from '@/types';
import { Play, Pause, RotateCcw, Coffee, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds
const LOCAL_STORAGE_KEY = 'grindset_pomodoro_state';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function PomodoroTimerComponent() {
  const [timeLeft, setTimeLeft] = useState<number>(WORK_DURATION);
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [cycleCount, setCycleCount] = useState<number>(0); // Track completed work cycles
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const totalDuration = mode === 'work' ? WORK_DURATION : BREAK_DURATION;
  const progressPercentage = ((totalDuration - timeLeft) / totalDuration) * 100;

  // Load state from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const { timeLeft: savedTime, mode: savedMode, isRunning: savedRunning, cycleCount: savedCycleCount } = JSON.parse(savedState) as PomodoroState;
        setTimeLeft(savedTime);
        setMode(savedMode);
        setCycleCount(savedCycleCount || 0);
        // Do not automatically start if it was running, user should press play.
        // setIsRunning(savedRunning); 
      }
    } catch (error) {
      console.error("Error loading Pomodoro state from localStorage:", error);
    }
    // Setup audio element for notification
    if (typeof window !== "undefined") {
        audioRef.current = new Audio('/sounds/pomodoro_notification.mp3'); // Placeholder sound
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    try {
      const stateToSave: PomodoroState = { timeLeft, mode, isRunning, cycleCount };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Error saving Pomodoro state to localStorage:", error);
    }
  }, [timeLeft, mode, isRunning, cycleCount]);

  const playNotificationSound = () => {
    audioRef.current?.play().catch(err => console.error("Error playing sound:", err));
  };
  
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            playNotificationSound();
            if (mode === 'work') {
              toast({ title: "Work session complete!", description: "Time for a break.", duration: 5000});
              setMode('break');
              setTimeLeft(BREAK_DURATION);
              setCycleCount(prev => prev + 1);
            } else {
              toast({ title: "Break over!", description: "Back to work.", duration: 5000});
              setMode('work');
              setTimeLeft(WORK_DURATION);
            }
            setIsRunning(false); // Stop the timer automatically
            return 0; // Return 0 to prevent negative timeLeft
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, mode, toast]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setMode('work');
    setTimeLeft(WORK_DURATION);
    setCycleCount(0);
    toast({ title: "Timer Reset", description: "Ready for a new work session." });
  };

  const handleSwitchMode = (newMode: PomodoroMode) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? WORK_DURATION : BREAK_DURATION);
  };


  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="flex space-x-2 mb-4">
        <Button 
          variant={mode === 'work' ? 'default' : 'outline'}
          onClick={() => handleSwitchMode('work')}
          className="rounded-full px-6 py-2"
        >
          <Briefcase className="mr-2 h-5 w-5" /> Work
        </Button>
        <Button 
          variant={mode === 'break' ? 'default' : 'outline'}
          onClick={() => handleSwitchMode('break')}
          className="rounded-full px-6 py-2"
        >
          <Coffee className="mr-2 h-5 w-5" /> Break
        </Button>
      </div>

      <div className="relative w-48 h-48 md:w-60 md:h-60 flex items-center justify-center">
        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-secondary"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
          <circle
            className="text-primary"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={(2 * Math.PI * 45) * (1 - progressPercentage / 100)}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
          />
        </svg>
        <span className="text-5xl md:text-6xl font-mono text-foreground tabular-nums">
          {formatTime(timeLeft)}
        </span>
      </div>
      
      {/* <Progress value={progressPercentage} className="w-full h-3 rounded-full" /> */}

      <div className="flex space-x-4">
        <Button
          onClick={handleStartPause}
          variant="default"
          size="lg"
          className="w-32 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          size="lg"
          className="w-32 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          aria-label="Reset timer"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Reset
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Completed cycles: <span className="font-semibold text-primary">{cycleCount}</span>
      </p>
    </div>
  );
}

