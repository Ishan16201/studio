
'use client';

import type { JournalEntry } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Edit3, Trash2, AlertCircle } from 'lucide-react'; // Added AlertCircle for invalid date

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
}

export default function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  // Ensure entry.createdAt is a valid Date object
  let displayDate: Date | null = null;
  if (entry.createdAt instanceof Date && !isNaN(entry.createdAt.getTime())) {
    displayDate = entry.createdAt;
  } else if (entry.createdAt && typeof (entry.createdAt as any).toDate === 'function') { // Firestore Timestamp
    displayDate = (entry.createdAt as any).toDate();
  }
  
  const contentSnippet = entry.content.substring(0, 150) + (entry.content.length > 150 ? '...' : '');

  return (
    <Card className="shadow-lg rounded-xl overflow-hidden bg-card flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            {displayDate && !isNaN(displayDate.getTime()) ? (
              <>
                <CardTitle className="text-lg font-semibold">
                  {format(displayDate, 'MMMM do, yyyy')}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {format(displayDate, 'p')}
                </CardDescription>
              </>
            ) : (
              <CardTitle className="text-lg font-semibold text-destructive flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" /> Invalid Date
              </CardTitle>
            )}
          </div>
           <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(entry)} className="w-8 h-8 text-primary hover:text-primary/80">
              <Edit3 className="w-4 h-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => entry.id && onDelete(entry.id)} className="w-8 h-8 text-destructive hover:text-destructive/80" disabled={!entry.id}>
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-4">
        <p className="text-sm text-card-foreground whitespace-pre-line leading-relaxed">
          {contentSnippet}
        </p>
      </CardContent>
      {entry.content.length > 150 && (
         <CardFooter className="pt-0">
            <Button variant="link" className="p-0 h-auto text-sm" onClick={() => onEdit(entry)}>Read more</Button>
         </CardFooter>
      )}
    </Card>
  );
}
