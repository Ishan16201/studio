
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFirebaseDb, USER_ID, whenFirebaseInitialized, getFirebaseError } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import type { JournalEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';

const userJournalEntriesCollectionPath = `userJournalEntries/${USER_ID}/entries`;

export function useJournalList() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchJournalEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      await whenFirebaseInitialized();
      const db = getFirebaseDb();
      const firebaseConfigError = getFirebaseError();

      if (firebaseConfigError) {
        setError(firebaseConfigError);
        setIsLoading(false);
        setEntries([]);
        return () => {};
      }
      if (!db) {
        setError("Firestore database instance is not available.");
        setIsLoading(false);
        setEntries([]);
        return () => {};
      }
      setError(null);

      const entriesColRef = collection(db, userJournalEntriesCollectionPath);
      const q = query(entriesColRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedEntries = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          
          let createdAtDate: Date;
          if (data.createdAt instanceof Timestamp) {
              createdAtDate = data.createdAt.toDate();
          } else if (data.createdAt && typeof data.createdAt.seconds === 'number') {
              createdAtDate = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate();
          } else {
              createdAtDate = new Date(data.createdAt || 0);
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

    } catch (initError: any) {
      setError(initError.message || "Firebase initialization failed for journal list.");
      setIsLoading(false);
      setEntries([]);
      return () => {};
    }
  }, [toast]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined | Promise<(() => void) | undefined>;
    unsubscribe = fetchJournalEntries();
    
    return () => {
      if (typeof unsubscribe === 'function') {
          unsubscribe();
      } else if (unsubscribe instanceof Promise) {
          unsubscribe.then(actualUnsubscribe => actualUnsubscribe?.());
      }
    };
  }, [fetchJournalEntries]);
  
  const firebaseConfigError = getFirebaseError(); // Get initial config error if any
  const displayError = error || firebaseConfigError;

  return { entries, isLoading, error: displayError, refetch: fetchJournalEntries };
}
