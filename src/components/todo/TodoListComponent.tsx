'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { TodoItem } from '@/types';
import { Timestamp } from 'firebase/firestore'; // For client-side date

interface TodoListComponentProps {
  showTitle?: boolean;
  maxHeight?: string;
  enableAdding?: boolean;
  initialTasks?: TodoItem[];
}

export default function TodoListComponent({ 
  showTitle = true, 
  maxHeight = "max-h-[300px]",
  enableAdding = true,
  initialTasks = []
}: TodoListComponentProps) {
  const [tasks, setTasks] = useState<TodoItem[]>(initialTasks.length > 0 ? initialTasks : [
    { id: '1', text: 'Finish report', completed: false, createdAt: Timestamp.now() },
    { id: '2', text: 'Exercise', completed: true, createdAt: Timestamp.now() },
    { id: '3', text: 'Read for 30 minutes', completed: false, createdAt: Timestamp.now() },
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  const addTask = () => {
    if (newTaskText.trim() === '') return;
    const newTask: TodoItem = {
      id: Date.now().toString(), // Simple unique ID for client-side
      text: newTaskText,
      completed: false,
      createdAt: Timestamp.now(),
    };
    setTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // For standalone page, fetch from Firebase, etc.
  // For now, this component is self-contained with local state.

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
            className="bg-input text-foreground placeholder:text-muted-foreground flex-grow"
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <Button onClick={addTask} variant="default" size="icon" aria-label="Add task">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
      )}

      <ScrollArea className={`${maxHeight} pr-3`}>
        {tasks.length === 0 && <p className="text-muted-foreground text-center py-4">No tasks yet. Add some!</p>}
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-center justify-between p-3 rounded-md transition-colors
                          ${task.completed ? 'bg-green-700/20 hover:bg-green-700/30' : 'bg-card hover:bg-muted/50'}`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  aria-labelledby={`task-label-${task.id}`}
                />
                <label
                  id={`task-label-${task.id}`}
                  htmlFor={`task-${task.id}`}
                  className={`cursor-pointer text-sm ${
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
                  className="text-muted-foreground hover:text-destructive"
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
