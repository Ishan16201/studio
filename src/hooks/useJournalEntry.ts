
'use client';

import { useState, useCallback } from 'react';
import { getFirebaseDb, USER_ID, whenFirebaseInitialized, getFirebaseError } from '@/lib/firebase';
import { doc, Timestamp, setDoc, addDoc, collection, serverTimestamp, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import type { JournalEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';

const getJournalEntryDocPath = (entryId: string) => `userJournalEntries/${USER_ID}/entries/${entryId}`;
const userJournalEntriesCollectionPath = `userJournalEntries/${USER_ID}/entries`;

export function useJournalEntry() { 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchSpecificEntry = useCallback(async (idToFetch: string): Promise<JournalEntry | null> => {
    setIsLoading(true);
    try {
      await whenFirebaseInitialized();
      const db = getFirebaseDb();
      const firebaseConfigError = getFirebaseError();

      if (firebaseConfigError) {
        setError(firebaseConfigError);
        setIsLoading(false);
        return null;
      }
      if (!db) {
        setError("Firestore not available.");
        setIsLoading(false);
        return null;
      }
      setError(null);

      const docRef = doc(db, getJournalEntryDocPath(idToFetch));
      const docSnap: DocumentSnapshot = await getDoc(docRef);
      if (docSnap.exists()) {
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

        const fetchedEntryData: JournalEntry = {
          id: docSnap.id,
          content: data.content || '',
          createdAt: createdAtDate,
          lastUpdated: lastUpdatedDate,
          userId: data.userId || USER_ID,
        };
        setIsLoading(false);
        return fetchedEntryData;
      } else {
        setError("Journal entry not found.");
        setIsLoading(false);
        return null;
      }
    } catch (err: any) {
      console.error('Error fetching specific journal entry:', err);
      setError(`Error: ${err.message}`);
      toast({ title: 'Error', description: 'Could not load entry.', variant: 'destructive' });
      setIsLoading(false);
      return null;
    }
  }, [toast]);


  const saveJournalEntry = useCallback(async (contentToSave: string, currentEntryData?: Partial<JournalEntry>): Promise<string | undefined> => {
    setIsSaving(true);
    try {
      await whenFirebaseInitialized();
      const db = getFirebaseDb();
      const firebaseConfigError = getFirebaseError();

      if (firebaseConfigError) {
        toast({ title: 'Error', description: firebaseConfigError, variant: 'destructive' });
        setError(firebaseConfigError);
        setIsSaving(false);
        return undefined;
      }
      if (!db) {
        toast({ title: 'Error', description: 'Cannot save: Firebase not configured.', variant: 'destructive' });
        setError("Firestore not available.");
        setIsSaving(false);
        return undefined;
      }
      setError(null);

      if (currentEntryData?.id) { 
        let originalCreatedAt = currentEntryData.createdAt;
        if (originalCreatedAt instanceof Date) {
            originalCreatedAt = Timestamp.fromDate(originalCreatedAt);
        } else if (!originalCreatedAt || !(originalCreatedAt instanceof Timestamp)) {
            originalCreatedAt = serverTimestamp() as Timestamp; 
        }

        await setDoc(doc(db, getJournalEntryDocPath(currentEntryData.id)), { 
            content: contentToSave, 
            userId: USER_ID, 
            createdAt: originalCreatedAt, 
            lastUpdated: serverTimestamp() 
        }, { merge: true });
        toast({ title: 'Journal Updated', description: 'Your entry has been saved.' });
        setIsSaving(false);
        return currentEntryData.id;
      } else { 
        const docRef = await addDoc(collection(db, userJournalEntriesCollectionPath), {
            content: contentToSave,
            userId: USER_ID,
            createdAt: serverTimestamp(), 
            lastUpdated: serverTimestamp(),
        });
        toast({ title: 'Journal Entry Saved', description: 'Your new entry has been created.' });
        setIsSaving(false);
        return docRef.id; 
      }
    } catch (err: any) {
      console.error('Error saving journal entry:', err);
      setError(`Could not save journal entry: ${err.message}`);
      toast({ title: 'Save Error', description: 'Could not save your journal entry.', variant: 'destructive' });
      setIsSaving(false);
      return undefined;
    }
  }, [toast]);
  
  const deleteJournalEntry = useCallback(async (idToDelete: string): Promise<boolean> => {
    setIsSaving(true); // Indicate an operation is in progress
    try {
      await whenFirebaseInitialized();
      const db = getFirebaseDb();
      const firebaseConfigError = getFirebaseError();

      if (firebaseConfigError) {
        toast({ title: 'Error', description: firebaseConfigError, variant: 'destructive' });
        setError(firebaseConfigError);
        setIsSaving(false);
        return false;
      }
      if (!db) {
        toast({ title: 'Error', description: 'Cannot delete: Firebase not configured.', variant: 'destructive' });
        setError("Firestore not available.");
        setIsSaving(false);
        return false;
      }
      setError(null);

      const docRef = doc(db, getJournalEntryDocPath(idToDelete));
      await deleteDoc(docRef);
      toast({ title: 'Entry Deleted', description: 'Journal entry has been deleted.' });
      setIsSaving(false);
      return true;
    } catch (err: any) {
      console.error("Error deleting journal entry:", err);
      setError(`Could not delete journal entry: ${err.message}`);
      toast({ title: 'Error', description: 'Could not delete journal entry.', variant: 'destructive' });
      setIsSaving(false);
      return false;
    }
  }, [toast]);
  
  const firebaseConfigError = getFirebaseError();
  const displayError = error || firebaseConfigError;

  return { isLoading, isSaving, error: displayError, fetchSpecificEntry, saveJournalEntry, deleteJournalEntry };
}
