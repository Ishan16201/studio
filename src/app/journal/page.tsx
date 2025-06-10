
'use client';

import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookOpen, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useJournalList } from '@/hooks/useJournalList';
import { useJournalEntry } from '@/hooks/useJournalEntry';
import JournalEntryCard from '@/components/journal/JournalEntryCard';
import JournalEditor from '@/components/journal/JournalEditor';
import type { JournalEntry } from '@/types';
import { format, isValid } from 'date-fns';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function JournalPageContent() {
  const { entries, isLoading: isLoadingList, error: listError, refetch: refetchList } = useJournalList();
  const { saveJournalEntry, deleteJournalEntry, isSaving: isSavingEntryHook, error: entryErrorHook } = useJournalEntry();

  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<JournalEntry> | null>(null);

  const handleNewEntry = () => {
    setEditingEntry({}); 
    setShowEditor(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowEditor(true);
  };

  const handleCloseEditor = useCallback(() => {
    setShowEditor(false);
    setEditingEntry(null);
    refetchList(); 
  }, [refetchList]);

  const handleSaveEntryInPage = useCallback(async (content: string, entryId?: string) => {
    const currentFullEntryForSave = entryId ? entries.find(e => e.id === entryId) : null;
    
    const entryDataForSave: Partial<JournalEntry> = {
        id: entryId,
        content: content,
        ...(currentFullEntryForSave && { createdAt: currentFullEntryForSave.createdAt })
    };
    
    const savedId = await saveJournalEntry(content, entryDataForSave);
    if (savedId) {
       // Optionally update editingEntry if it was a new entry and editor remains open
       if (!entryId && editingEntry && Object.keys(editingEntry).length === 0) {
           setEditingEntry(prev => ({...prev, id: savedId, content, createdAt: new Date(), lastUpdated: new Date() }));
       }
       // If autosaving an existing entry, and editor remains open, its internal 'initialEntryData' might need an update
       // For simplicity, closing often handles this by forcing a fresh load if re-opened.
       // However, if editor remains open, and an autosave happens, the `lastUpdated` time in header won't update
       // until `initialEntryData` prop itself changes. This might need a more sophisticated state sync.
    }
    return savedId;
  }, [saveJournalEntry, entries, editingEntry]);

  const handleDeleteEntryInPage = async (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      const success = await deleteJournalEntry(entryId);
      if (success) {
        refetchList();
        if (editingEntry?.id === entryId) { 
          handleCloseEditor();
        }
      }
    }
  };
  
  let latestEntryDate: Date | null = null;
  if (entries.length > 0 && entries[0].createdAt) {
      if (entries[0].createdAt instanceof Date && isValid(entries[0].createdAt)) {
          latestEntryDate = entries[0].createdAt;
      } else if (typeof (entries[0].createdAt as any)?.toDate === 'function') {
          const convertedDate = (entries[0].createdAt as any).toDate();
          if (isValid(convertedDate)) {
              latestEntryDate = convertedDate;
          }
      }
  }


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
                  onEdit={() => handleEditEntry(entry)} 
                  onDelete={() => handleDeleteEntryInPage(entry.id)} 
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showEditor && (
        <JournalEditor
          isOpen={showEditor}
          initialEntryData={editingEntry || {}}
          onSave={handleSaveEntryInPage}
          onClose={handleCloseEditor}
          isSavingJournal={isSavingEntryHook}
          journalError={entryErrorHook}
        />
      )}
       <p className="text-center text-sm text-muted-foreground mt-8">
        Reflect and grow. Entries are autosaved.
      </p>
    </div>
  );
}

export default function JournalPage() {
  return (
    <ProtectedRoute>
      <JournalPageContent />
    </ProtectedRoute>
  );
}
