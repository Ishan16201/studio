
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, USER_ID, firebaseInitialized, firebaseInitError as fbConfigError } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import type { JournalEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';

const userJournalEntriesCollectionPath = `userJournalEntries/${USER_ID}/entries`;

export function useJournalList() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchJournalEntries = useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (!firebaseInitialized) {
      setError(fbConfigError || "Firebase is not initialized. Cannot fetch journal entries.");
      setIsLoading(false);
      setEntries([]);
      return () => {}; // Return empty unsubscribe function
    }
    if (!db) {
      setError("Firestore database instance is not available. Cannot fetch journal entries.");
      setIsLoading(false);
      setEntries([]);
      return () => {}; // Return empty unsubscribe function
    }

    const entriesColRef = collection(db, userJournalEntriesCollectionPath);
    const q = query(entriesColRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure createdAt and lastUpdated are Date objects if they come from Firestore Timestamps
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
        lastUpdated: doc.data().lastUpdated instanceof Timestamp ? doc.data().lastUpdated.toDate() : new Date(doc.data().lastUpdated),
      })) as JournalEntry[];
      setEntries(fetchedEntries);
      setIsLoading(false);
    }, (err: any) => {
      console.error('Error fetching journal entries:', err);
      setError(`Could not load journal entries: ${err.message}`);
      toast({
        title: 'Error',
        description: 'Could not load your journal entries.',
        variant: 'destructive',
      });
      setEntries([]);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [toast, firebaseInitialized, db, fbConfigError]); // fbConfigError added

  useEffect(() => {
    const unsubscribe = fetchJournalEntries();
    return () => unsubscribe?.();
  }, [fetchJournalEntries]);

  const finalError = !firebaseInitialized ? (fbConfigError || "Firebase configuration error.") : error;

  return { entries, isLoading, error: finalError, refetch: fetchJournalEntries };
}
