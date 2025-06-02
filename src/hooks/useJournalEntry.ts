
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, USER_ID, firebaseInitialized, firebaseInitError as fbConfigError } from '@/lib/firebase';
import { doc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import type { JournalEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';

const JOURNAL_DOC_PATH = `journal/${USER_ID}/entry/main`;

export function useJournalEntry() {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // For operational errors
  const { toast } = useToast();

  const fetchJournal = useCallback(async () => {
    if (!firebaseInitialized) {
      setError(fbConfigError || "Firebase is not initialized. Cannot fetch journal.");
      setIsLoading(false);
      setEntry({ content: '', lastUpdated: new Date(), userId: USER_ID }); 
      return;
    }
     if (!db) {
        setError("Firestore database instance is not available. Cannot fetch journal.");
        setIsLoading(false);
        setEntry({ content: '', lastUpdated: new Date(), userId: USER_ID });
        return;
    }

    setIsLoading(true);
    setError(null); // Clear previous operational errors
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
      setEntry({ content: '', lastUpdated: new Date(), userId: USER_ID });
    } finally {
      setIsLoading(false);
    }
  }, [toast, firebaseInitialized, db, fbConfigError]); // Added firebaseInitialized, db, fbConfigError

  useEffect(() => {
    fetchJournal();
  }, [fetchJournal]);

  // The error returned by this hook can now be fbConfigError if init failed,
  // or an operational error string if init succeeded but fetch failed.
  // If !firebaseInitialized, error will be fbConfigError.
  const finalError = !firebaseInitialized ? (fbConfigError || "Firebase configuration error.") : error;

  return { entry, isLoading, error: finalError, refetch: fetchJournal };
}
