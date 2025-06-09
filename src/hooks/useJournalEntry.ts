
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, USER_ID, firebaseInitialized, firebaseInitError as fbConfigError } from '@/lib/firebase';
import { doc, getDoc, DocumentSnapshot, Timestamp } from 'firebase/firestore';
import type { JournalEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';

const JOURNAL_DOC_PATH = `journal/${USER_ID}/entry/main`;

export function useJournalEntry() {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchJournal = useCallback(async () => {
    setIsLoading(true); // Set loading true at the start of fetch
    setError(null); // Clear previous operational errors

    if (!firebaseInitialized) {
      setError(fbConfigError || "Firebase is not initialized. Cannot fetch journal.");
      setIsLoading(false);
      // Provide a default empty structure if Firebase isn't up, so UI doesn't break
      setEntry({ content: '', lastUpdated: new Date(), userId: USER_ID });
      return;
    }
     if (!db) {
        setError("Firestore database instance is not available. Cannot fetch journal.");
        setIsLoading(false);
        setEntry({ content: '', lastUpdated: new Date(), userId: USER_ID });
        return;
    }

    try {
      const docRef = doc(db, JOURNAL_DOC_PATH);
      const docSnap: DocumentSnapshot = await getDoc(docRef); // Use generic DocumentSnapshot

      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<Omit<JournalEntry, 'userId' | 'lastUpdated'> & { lastUpdated: Timestamp }>;
        setEntry({
          content: data.content || '',
          // Ensure lastUpdated is a Date object for client-side use
          lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : new Date(),
          userId: USER_ID
        });
      } else {
        // If no entry exists, provide a default new entry structure
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
      // Fallback to default structure on error too
      setEntry({ content: '', lastUpdated: new Date(), userId: USER_ID });
    } finally {
      setIsLoading(false);
    }
  }, [toast, firebaseInitialized, db, fbConfigError]);

  useEffect(() => {
    fetchJournal();
  }, [fetchJournal]);

  const finalError = !firebaseInitialized ? (fbConfigError || "Firebase configuration error.") : error;

  return { entry, isLoading, error: finalError, refetch: fetchJournal };
}
