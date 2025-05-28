
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, USER_ID } from '@/lib/firebase';
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
    setIsLoading(true);
    setError(null);
    try {
      const docRef = doc(db, JOURNAL_DOC_PATH);
      const docSnap: DocumentSnapshot<Partial<Omit<JournalEntry, 'userId'>>> = await getDoc(docRef) as DocumentSnapshot<Partial<Omit<JournalEntry, 'userId'>>>;
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure content defaults to empty string if undefined from Firestore
        setEntry({ 
          content: data.content || '', 
          lastUpdated: data.lastUpdated || new Date(), // Default lastUpdated if missing
          userId: USER_ID 
        });
      } else {
        // Initialize with empty content if no entry exists
        setEntry({ content: '', lastUpdated: new Date(), userId: USER_ID });
      }
    } catch (err) {
      console.error('Error fetching journal:', err);
      setError('Could not load your journal. Please try again later.');
      toast({
        title: 'Error',
        description: 'Could not load your journal. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJournal();
  }, [fetchJournal]);

  return { entry, isLoading, error, refetch: fetchJournal };
}

