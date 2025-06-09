
'use client';

import type { CalendarEvent } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface EventItemProps {
  event: CalendarEvent;
  onDelete: (eventId: string) => Promise<void>;
}

export default function EventItem({ event, onDelete }: EventItemProps) {
  return (
    <Card className="mb-2 bg-card/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between p-3 space-y-0">
        <div>
          <CardTitle className="text-base font-medium">{event.title}</CardTitle>
          {event.description && (
            <CardDescription className="text-xs mt-1">{event.description}</CardDescription>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive/80 w-7 h-7"
          onClick={() => onDelete(event.id)}
          aria-label={`Delete event: ${event.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
    </Card>
  );
}
