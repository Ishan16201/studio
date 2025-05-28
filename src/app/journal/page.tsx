
'use client';

import JournalEditor from '@/components/journal/JournalEditor';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, CalendarClock } from 'lucide-react';
import { useJournalEntry } from '@/hooks/useJournalEntry';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function JournalPage() {
  const { entry, isLoading, error } = useJournalEntry();

  const getLastUpdatedText = () => {
    if (isLoading) return 'Loading date...';
    if (error) return 'Error loading date';
    if (entry && entry.lastUpdated) { // Ensure entry and entry.lastUpdated are truthy
      const date = entry.lastUpdated instanceof Date ? entry.lastUpdated : entry.lastUpdated.toDate();
      return `Last entry: ${format(date, 'MMMM do, yyyy HH:mm')}`;
    }
    return 'No entries yet. Start writing!';
  };

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-8">
      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <PlusCircle className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" />
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold">Journal</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-xs sm:text-sm">
                Your private space for thoughts, reflections, and progress. Autosaved securely.
              </CardDescription>
            </div>
          </div>
          <div className="mt-3 text-xs text-primary-foreground/70 flex items-center">
            <CalendarClock className="w-3.5 h-3.5 mr-1.5" />
            {isLoading && !entry ? <Skeleton className="h-4 w-32" /> : <span>{getLastUpdatedText()}</span>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && !entry ? (
             <div className="p-4 sm:p-6 h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)] md:h-[500px]">
               <Skeleton className="h-full w-full rounded-md" />
             </div>
          ) : (
            <JournalEditor />
          )}
        </CardContent>
      </Card>
       <p className="text-center text-sm text-muted-foreground mt-6">
        All entries are automatically saved. Write freely.
      </p>
    </div>
  );
}
