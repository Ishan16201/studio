
'use client';

import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookOpen, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useJournalList } from '@/hooks/useJournalList';
import { useJournalEntry } from '@/hooks/useJournalEntry'; // For save/delete logic
import JournalEntryCard from '@/components/journal/JournalEntryCard';
import JournalEditor from '@/components/journal/JournalEditor';
import type { JournalEntry } from '@/types';
import { format } from 'date-fns';

export default function JournalPage() {
  const { entries, isLoading: isLoadingList, error: listError, refetch: refetchList } = useJournalList();
  const { saveJournalEntry, deleteJournalEntry, isSaving: isSavingEntry, error: entryError } = useJournalEntry(null); // For save/delete actions

  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<JournalEntry> | null>(null);

  const handleNewEntry = () => {
    setEditingEntry({}); // Empty object indicates a new entry
    setShowEditor(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingEntry(null);
    refetchList(); // Refetch list in case of changes
  };

  const handleSaveEntryInPage = async (content: string, entryId?: string) => {
    const entryToSave: Partial<JournalEntry> = {
        id: entryId,
        content: content,
        // createdAt and lastUpdated will be handled by saveJournalEntry hook
    };
    // The saveJournalEntry hook needs the *full* entry if it's an update, to preserve createdAt.
    // Or, it needs to be smart enough. Let's adapt its usage.
    // The hook 'useJournalEntry(null)' is only for accessing save/delete, not for loading specific entry data for editor.
    
    // If editingEntry has an ID, it's an update. If not, it's new.
    const currentFullEntry = entryId ? entries.find(e => e.id === entryId) : null;
    const effectiveEntryForSave: JournalEntry | null = currentFullEntry ? 
        {...currentFullEntry, content } : 
        { content, createdAt: new Date(), lastUpdated: new Date(), userId: 'defaultUser' };


    const savedId = await saveJournalEntry(content, effectiveEntryForSave);
    if (savedId) {
      // Optionally, if editor stays open for a new entry, update `editingEntry` with the new ID
      if (!entryId && typeof savedId === 'string') {
        setEditingEntry(prev => prev ? {...prev, id: savedId} : {id: savedId, content});
      }
      // Editor will typically close via onClose, triggering refetch.
    }
    // Error handling is within useJournalEntry and displayed in editor.
  };

  const handleDeleteEntryInPage = async (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      const success = await deleteJournalEntry(entryId);
      if (success) {
        refetchList();
      }
    }
  };
  
  const latestEntryDate = entries.length > 0 ? entries[0].createdAt : null;

  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-8">
      <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center space-x-3 mb-3 sm:mb-0">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" />
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold">My Journal</CardTitle>
                <CardDescription className="text-primary-foreground/80 text-xs sm:text-sm">
                  {isLoadingList ? 'Loading entries...' : `${entries.length} entries. `}
                  {latestEntryDate ? `Latest on ${format(latestEntryDate, 'MMMM do, yyyy')}` : 'Your space for thoughts.'}
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleNewEntry} variant="secondary" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> New Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {isLoadingList && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
            </div>
          )}
          {!isLoadingList && listError && (
            <div className="text-center py-10 text-destructive">
              <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
              <p className="font-semibold">Error loading journal entries</p>
              <p className="text-sm">{listError}</p>
            </div>
          )}
          {!isLoadingList && !listError && entries.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-lg">No journal entries yet.</p>
              <p>Click "New Entry" to start writing.</p>
            </div>
          )}
          {!isLoadingList && !listError && entries.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {entries.map(entry => (
                <JournalEntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onEdit={handleEditEntry} 
                  onDelete={() => entry.id && handleDeleteEntryInPage(entry.id)} 
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showEditor && (
        <JournalEditor
          isOpen={showEditor}
          initialEntryData={editingEntry || {}} // Pass empty object for new, or existing entry
          onSave={handleSaveEntryInPage}
          onClose={handleCloseEditor}
          isSavingJournal={isSavingEntry}
          journalError={entryError}
        />
      )}
       <p className="text-center text-sm text-muted-foreground mt-8">
        All entries are autosaved. Reflect and grow.
      </p>
    </div>
  );
}
