
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, AlertTriangle } from 'lucide-react';
import type { TodoItem } from '@/types';
import { db, USER_ID, firebaseInitialized, firebaseInitError as fbConfigError } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface TodoListComponentProps {
  showTitle?: boolean;
  maxHeight?: string;
  enableAdding?: boolean; 
}

export default function TodoListComponent({
  showTitle = true,
  maxHeight = "max-h-[300px]",
  enableAdding = true,
}: TodoListComponentProps) {
  const [tasks, setTasks] = useState<TodoItem[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [operationalError, setOperationalError] = useState<string | null>(null); // For errors after init
  const { toast } = useToast();

  useEffect(() => {
    if (!firebaseInitialized || !db) {
      // Error is handled by the main return block, no need to set operationalError here for config issues
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setOperationalError(null); // Clear previous operational errors
    const tasksCol = collection(db, 'todos');
    const q = query(
      tasksCol,
      where('userId', '==', USER_ID),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<TodoItem, 'id'>),
        }));
        setTasks(fetchedTasks);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching tasks:', err);
        setOperationalError('Failed to load tasks. Please try again.');
        toast({
          title: 'Error',
          description: 'Could not load tasks.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast, firebaseInitialized, db]); // Added firebaseInitialized and db

  const addTask = async () => {
    if (!firebaseInitialized || !db) {
      toast({ title: 'Error', description: 'Cannot add task: Firebase not configured.', variant: 'destructive' });
      return;
    }
    if (newTaskText.trim() === '') return;
    try {
      await addDoc(collection(db, 'todos'), {
        text: newTaskText,
        completed: false,
        createdAt: serverTimestamp(),
        userId: USER_ID,
      });
      setNewTaskText('');
    } catch (err) {
      console.error('Error adding task:', err);
      toast({
        title: 'Error',
        description: 'Could not add task.',
        variant: 'destructive',
      });
    }
  };

  const toggleTask = async (id: string, currentCompleted: boolean) => {
    if (!firebaseInitialized || !db) {
      toast({ title: 'Error', description: 'Cannot update task: Firebase not configured.', variant: 'destructive' });
      return;
    }
    const taskRef = doc(db, 'todos', id);
    try {
      await updateDoc(taskRef, { completed: !currentCompleted });
    } catch (err) {
      console.error('Error toggling task:', err);
      toast({
        title: 'Error',
        description: 'Could not update task status.',
        variant: 'destructive',
      });
    }
  };

  const deleteTask = async (id: string) => {
    if (!firebaseInitialized || !db) {
      toast({ title: 'Error', description: 'Cannot delete task: Firebase not configured.', variant: 'destructive' });
      return;
    }
    const taskRef = doc(db, 'todos', id);
    try {
      await deleteDoc(taskRef);
    } catch (err) {
      console.error('Error deleting task:', err);
      toast({
        title: 'Error',
        description: 'Could not delete task.',
        variant: 'destructive',
      });
    }
  };
  
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    }
    return a.completed ? 1 : -1; 
  });

  if (!firebaseInitialized) {
    return (
      <div className="w-full p-4 text-center text-destructive-foreground bg-destructive/80 rounded-md">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
        <p className="font-semibold">Configuration Error</p>
        <p className="text-sm">{fbConfigError || "Firebase is not configured. Please check console and setup."}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-3 p-1">
        {showTitle && <Skeleton className="h-7 w-1/3 mb-4" />}
        {enableAdding && (
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-10 flex-grow" />
            <Skeleton className="h-10 w-10" />
          </div>
        )}
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (operationalError) { 
    return (
      <div className="w-full p-4 text-center text-destructive-foreground bg-destructive/80 rounded-md">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
        <p className="font-semibold">Error Loading Tasks</p>
        <p className="text-sm">{operationalError}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showTitle && <h2 className="text-xl font-semibold mb-4 text-foreground">Daily Tasks</h2>}
      
      {enableAdding && (
        <div className="flex gap-2 mb-4">
          <Input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a new task..."
            className="bg-input text-foreground placeholder:text-muted-foreground flex-grow text-sm"
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <Button onClick={addTask} variant="default" size="icon" aria-label="Add task">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
      )}

      <ScrollArea className={`${maxHeight} pr-1`}>
        {sortedTasks.length === 0 && !isLoading && <p className="text-muted-foreground text-center py-4">No tasks yet. Add some!</p>}
        <ul className="space-y-2">
          {sortedTasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-center justify-between p-3 rounded-md transition-colors
                          ${task.completed ? 'bg-green-700/10 hover:bg-green-700/20 opacity-70' : 'bg-card hover:bg-card/80'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id, task.completed)}
                  aria-labelledby={`task-label-${task.id}`}
                />
                <label
                  id={`task-label-${task.id}`}
                  htmlFor={`task-${task.id}`}
                  className={`cursor-pointer text-sm truncate ${
                    task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {task.text}
                </label>
              </div>
              {enableAdding && ( 
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTask(task.id)}
                  className="text-muted-foreground hover:text-destructive flex-shrink-0 ml-2"
                  aria-label={`Delete task: ${task.text}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
