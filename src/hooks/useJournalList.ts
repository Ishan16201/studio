
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, USER_ID, firebaseInitialized, firebaseInitError as fbConfigError } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
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
      return () => {}; 
    }
    if (!db) {
      setError("Firestore database instance is not available. Cannot fetch journal entries.");
      setIsLoading(false);
      setEntries([]);
      return () => {}; 
    }

    const entriesColRef = collection(db, userJournalEntriesCollectionPath);
    const q = query(entriesColRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        
        let createdAtDate: Date;
        if (data.createdAt instanceof Timestamp) {
            createdAtDate = data.createdAt.toDate();
        } else if (data.createdAt && typeof data.createdAt.seconds === 'number') { // Handle plain JS object with seconds/nanos
            createdAtDate = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate();
        } else {
            createdAtDate = new Date(data.createdAt || 0); // Fallback
        }

        let lastUpdatedDate: Date | undefined = undefined;
        if (data.lastUpdated instanceof Timestamp) {
            lastUpdatedDate = data.lastUpdated.toDate();
        } else if (data.lastUpdated && typeof data.lastUpdated.seconds === 'number') {
            lastUpdatedDate = new Timestamp(data.lastUpdated.seconds, data.lastUpdated.nanoseconds).toDate();
        } else if (data.lastUpdated) {
            lastUpdatedDate = new Date(data.lastUpdated);
        }

        return {
          id: docSnap.id,
          content: data.content || '',
          createdAt: createdAtDate,
          lastUpdated: lastUpdatedDate,
          userId: data.userId || USER_ID,
        } as JournalEntry;
      });
      setEntries(fetchedEntries);
      setIsLoading(false);
    }, (err: any) => {
      console.error('Error fetching journal entries:', err);
      setError(`Could not load journal entries: ${err.message}`);
      toast({
        title: 'Error Loading Journal',
        description: 'Could not load your journal entries.',
        variant: 'destructive',
      });
      setEntries([]);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [toast, fbConfigError]);

  useEffect(() => {
    const unsubscribe = fetchJournalEntries();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchJournalEntries]);

  const finalError = !firebaseInitialized ? (fbConfigError || "Firebase configuration error.") : error;

  return { entries, isLoading, error: finalError, refetch: fetchJournalEntries };
}
