
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, USER_ID, firebaseInitialized, firebaseInitError as fbInitError } from '@/lib/firebase';
import { doc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import type { JournalEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';

const JOURNAL_DOC_PATH = `journal/${USER_ID}/entry/main`;

export function useJournalEntry() {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchJournal = useCallback(async () => {
    if (!firebaseInitialized) {
      setError(fbInitError || "Firebase is not initialized. Cannot fetch journal.");
      setIsLoading(false);
      setEntry({ content: '', lastUpdated: new Date(), userId: USER_ID }); // Provide a default empty state
      return;
    }
     if (!db) {
        setError("Firestore database instance is not available. Cannot fetch journal.");
        setIsLoading(false);
        setEntry({ content: '', lastUpdated: new Date(), userId: USER_ID });
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const docRef = doc(db, JOURNAL_DOC_PATH);
      const docSnap: DocumentSnapshot<Partial<Omit<JournalEntry, 'userId'>>> = await getDoc(docRef) as DocumentSnapshot<Partial<Omit<JournalEntry, 'userId'>>>;
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEntry({ 
          content: data.content || '', 
          lastUpdated: data.lastUpdated || new Date(), 
          userId: USER_ID 
        });
      } else {
        setEntry({ content: '', lastUpdated: new Date(), userId: USER_ID });
      }
    } catch (err: any) {
      console.error('Error fetching journal:', err);
      setError(`Could not load your journal: ${err.message}`);
      toast({
        title: 'Error',
        description: `Could not load your journal. Please try again later.`,
        variant: 'destructive',
      });
      // Set a default entry to prevent crash on consumption
      setEntry({ content: '', lastUpdated: new Date(), userId: USER_ID });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJournal();
  }, [fetchJournal]);

  return { entry, isLoading, error, refetch: fetchJournal };
}
