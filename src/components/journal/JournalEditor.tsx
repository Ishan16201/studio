
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { db, USER_ID, firebaseInitialized, firebaseInitError as fbConfigError } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAutosave } from '@/hooks/useAutosave';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useJournalEntry } from '@/hooks/useJournalEntry'; 
import { AlertTriangle } from 'lucide-react';

const JOURNAL_DOC_PATH = `journal/${USER_ID}/entry/main`;

export default function JournalEditor() {
  // useJournalEntry's error will include fbConfigError if Firebase isn't initialized
  const { entry: initialEntry, isLoading: isLoadingEntry, error: entryLoadingError, refetch } = useJournalEntry();
  const [content, setContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialEntry) {
      setContent(initialEntry.content);
    }
  }, [initialEntry]);

  const handleSave = useCallback(async (currentContent: string) => {
    if (!firebaseInitialized || !db) {
      toast({ title: 'Error', description: 'Cannot save journal: Firebase not configured.', variant: 'destructive' });
      return;
    }
    try {
      const docRef = doc(db, JOURNAL_DOC_PATH);
      await setDoc(docRef, {
        content: currentContent,
        lastUpdated: serverTimestamp(),
        userId: USER_ID,
      }, { merge: true });
      setIsDirty(false);
      refetch(); 
    } catch (error) {
      console.error('Error saving journal:', error);
      toast({
        title: 'Save Error',
        description: 'Could not save your journal. Please check your connection.',
        variant: 'destructive',
      });
    }
  }, [toast, refetch, firebaseInitialized, db]); // Added firebaseInitialized, db

  useAutosave<string>({
    data: content,
    onSave: handleSave,
    interval: 2500,
    isDirty: isDirty,
  });

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
    setIsDirty(true);
  };

  // Prioritize showing Firebase config error if it exists (from useJournalEntry or direct check)
  const configError = !firebaseInitialized ? (fbConfigError || "Firebase configuration error.") : null;
  const displayError = configError || entryLoadingError;

  if (displayError) {
    return (
      <div className="p-4 sm:p-6 text-center text-destructive-foreground bg-destructive/80 rounded-b-xl h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)] md:h-[500px] flex flex-col justify-center items-center">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
        <p className="font-semibold">Error</p>
        <p className="text-sm">{displayError}</p>
      </div>
    );
  }
  
  if (isLoadingEntry && !initialEntry) { // Show skeleton only if loading and no initial entry yet
    return (
      <div className="p-4 sm:p-6 h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)] md:h-[500px]">
        <Skeleton className="h-full w-full rounded-md" />
      </div>
    );
  }

  return (
    <Textarea
      value={content}
      onChange={handleChange}
      placeholder="What's on your mind? Your progress, your struggles, your wins... Type it all out."
      className="w-full h-[calc(100vh-250px)] sm:h-[calc(100vh-300px)] md:h-[calc(100vh-220px)] p-4 sm:p-6 text-sm sm:text-base md:text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none rounded-b-xl bg-card text-card-foreground"
      aria-label="Journal Entry"
      disabled={!firebaseInitialized || isLoadingEntry} // Disable if not initialized or still loading
    />
  );
}
