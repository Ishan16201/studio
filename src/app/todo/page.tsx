import TodoListComponent from '@/components/todo/TodoListComponent';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';

export const metadata = {
  title: 'To-Do List - Grindset',
  description: 'Manage your daily tasks and stay organized.',
};

export default function TodoPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-8">
      <Card className="shadow-xl rounded-xl bg-card">
        <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-xl">
           <div className="mx-auto bg-primary-foreground/20 p-3 rounded-full w-fit mb-2">
             <CheckSquare className="w-10 h-10 text-primary-foreground" />
           </div>
          <CardTitle className="text-3xl font-bold">To-Do List</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Stay on top of your tasks and boost productivity.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <TodoListComponent showTitle={false} maxHeight="max-h-[calc(100vh-300px)]" />
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground mt-8">
        Organize your day, one task at a time.
      </p>
    </div>
  );
}
