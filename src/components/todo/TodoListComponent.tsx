
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, AlertTriangle, Circle, AlertCircle as AlertCircleIcon, ChevronsUp } from 'lucide-react'; // Renamed AlertCircle to avoid conflict
import type { TodoItem, TaskPriority } from '@/types';
import { getFirebaseDb, USER_ID, whenFirebaseInitialized, getFirebaseError } from '@/lib/firebase';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TodoListComponentProps {
  showTitle?: boolean;
  maxHeight?: string;
  enableAdding?: boolean; 
}

const priorityIcons: Record<TaskPriority, React.ElementType> = {
  urgent: ChevronsUp,
  medium: AlertCircleIcon, // Use the renamed import
  low: Circle,
};

const priorityColors: Record<TaskPriority, string> = {
  urgent: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-green-500',
};

const priorityBorderColors: Record<TaskPriority, string> = {
  urgent: 'border-red-500/50 hover:border-red-500',
  medium: 'border-yellow-500/50 hover:border-yellow-500',
  low: 'border-green-500/50 hover:border-green-500',
};


export default function TodoListComponent({
  showTitle = true,
  maxHeight = "max-h-[300px]",
  enableAdding = true,
}: TodoListComponentProps) {
  const [tasks, setTasks] = useState<TodoItem[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const initAndFetch = async () => {
      setIsLoading(true);
      try {
        await whenFirebaseInitialized();
        const db = getFirebaseDb();
        const firebaseConfigError = getFirebaseError();

        if (firebaseConfigError) {
          setPageError(firebaseConfigError);
          setIsLoading(false);
          return;
        }
        if (!db) {
          setPageError("Firestore not available.");
          setIsLoading(false);
          return;
        }
        setPageError(null);

        const tasksCol = collection(db, 'todos');
        const q = query(
          tasksCol,
          where('userId', '==', USER_ID)
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const fetchedTasks = snapshot.docs.map((doc) => ({
              id: doc.id,
              priority: 'medium', 
              ...(doc.data() as Omit<TodoItem, 'id' | 'priority'> & { priority?: TaskPriority }),
              createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || 0)
            })) as TodoItem[];
            setTasks(fetchedTasks);
            setIsLoading(false);
          },
          (err) => {
            console.error('Error fetching tasks:', err);
            setPageError('Failed to load tasks. Please try again.');
            toast({
              title: 'Error',
              description: 'Could not load tasks.',
              variant: 'destructive',
            });
            setIsLoading(false);
          }
        );
      } catch (initError: any) {
        setPageError(initError.message || "Firebase initialization failed.");
        setIsLoading(false);
      }
    };
    initAndFetch();
    return () => unsubscribe?.();
  }, [toast]);

  const addTask = async () => {
    const db = getFirebaseDb();
    if (!db) {
      toast({ title: 'Error', description: 'Cannot add task: Firebase not configured.', variant: 'destructive' });
      setPageError("Firebase not configured.");
      return;
    }
    if (newTaskText.trim() === '') return;
    try {
      await addDoc(collection(db, 'todos'), {
        text: newTaskText,
        completed: false,
        priority: newTaskPriority,
        createdAt: serverTimestamp(),
        userId: USER_ID,
      });
      setNewTaskText('');
      setNewTaskPriority('medium');
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
    const db = getFirebaseDb();
    if (!db) {
      toast({ title: 'Error', description: 'Cannot update task: Firebase not configured.', variant: 'destructive' });
      setPageError("Firebase not configured.");
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
    const db = getFirebaseDb();
    if (!db) {
      toast({ title: 'Error', description: 'Cannot delete task: Firebase not configured.', variant: 'destructive' });
      setPageError("Firebase not configured.");
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
  
  const priorityOrder: Record<TaskPriority, number> = {
    urgent: 1,
    medium: 2,
    low: 3,
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1; 
    }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]; 
    }
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
    return bTime - aTime; 
  });

  if (pageError && isLoading) { // Prioritize showing page error if still loading
    return (
      <div className="w-full p-4 text-center text-destructive-foreground bg-destructive/80 rounded-md">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
        <p className="font-semibold">Configuration Error</p>
        <p className="text-sm">{pageError}</p>
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
            <Skeleton className="h-10 w-24" /> 
            <Skeleton className="h-10 w-10" /> 
          </div>
        )}
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    );
  }
  
  if (pageError && !isLoading) { // Show operational error if loading is done but error persists
    return (
      <div className="w-full p-4 text-center text-destructive-foreground bg-destructive/80 rounded-md">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
        <p className="font-semibold">Error Loading Tasks</p>
        <p className="text-sm">{pageError}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showTitle && <h2 className="text-xl font-semibold mb-4 text-foreground">Daily Tasks</h2>}
      
      {enableAdding && (
        <div className="flex items-center gap-2 mb-4">
          <Input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a new task..."
            className="bg-input text-foreground placeholder:text-muted-foreground flex-grow text-sm"
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <Select value={newTaskPriority} onValueChange={(value) => setNewTaskPriority(value as TaskPriority)}>
            <SelectTrigger className="w-[120px] text-xs h-10">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addTask} variant="default" size="icon" aria-label="Add task" className="h-10 w-10">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
      )}

      <ScrollArea className={`${maxHeight} pr-1`}>
        {sortedTasks.length === 0 && !isLoading && <p className="text-muted-foreground text-center py-4">No tasks yet. Add some!</p>}
        <ul className="space-y-2">
          {sortedTasks.map((task) => {
            const PriorityIcon = priorityIcons[task.priority];
            return (
            <li
              key={task.id}
              className={cn(`flex items-center justify-between p-3 rounded-md transition-colors border-l-4`,
                          task.completed 
                            ? 'bg-green-700/10 hover:bg-green-700/20 opacity-60 border-green-500/30' 
                            : `bg-card hover:bg-card/90 ${priorityBorderColors[task.priority]}`
                        )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id, task.completed)}
                  aria-labelledby={`task-label-${task.id}`}
                />
                <PriorityIcon className={cn("h-4 w-4 flex-shrink-0", priorityColors[task.priority], task.completed ? 'opacity-50' : '')} />
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
                  className="text-muted-foreground hover:text-destructive flex-shrink-0 ml-2 h-8 w-8"
                  aria-label={`Delete task: ${task.text}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          )})}
        </ul>
      </ScrollArea>
    </div>
  );
}
