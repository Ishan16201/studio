
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, USER_ID, firebaseInitialized, firebaseInitError as fbConfigError } from '@/lib/firebase';
import { doc, getDoc, DocumentSnapshot, Timestamp, setDoc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import type { JournalEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';

const getJournalEntryDocPath = (entryId: string) => `userJournalEntries/${USER_ID}/entries/${entryId}`;
const userJournalEntriesCollectionPath = `userJournalEntries/${USER_ID}/entries`;

export function useJournalEntry(entryId?: string | null) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!entryId); // Only load if entryId is provided
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchJournal = useCallback(async (idToFetch: string) => {
    setIsLoading(true);
    setError(null);

    if (!firebaseInitialized || !db) {
      setError(fbConfigError || "Firebase is not initialized. Cannot fetch journal entry.");
      setIsLoading(false);
      setEntry(null);
      return;
    }

    try {
      const docRef = doc(db, getJournalEntryDocPath(idToFetch));
      const docSnap: DocumentSnapshot = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setEntry({
          id: docSnap.id,
          content: data.content || '',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : new Date(data.lastUpdated),
          userId: USER_ID
        });
      } else {
        setError("Journal entry not found.");
        setEntry(null);
      }
    } catch (err: any) {
      console.error('Error fetching journal entry:', err);
      setError(`Could not load journal entry: ${err.message}`);
      toast({
        title: 'Error',
        description: 'Could not load the journal entry.',
        variant: 'destructive',
      });
      setEntry(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast, firebaseInitialized, db, fbConfigError]);

  useEffect(() => {
    if (entryId) {
      fetchJournal(entryId);
    } else {
      // If no entryId, it's for a new entry, so initialize with defaults or empty
      setEntry({ content: '', createdAt: new Date(), lastUpdated: new Date(), userId: USER_ID });
      setIsLoading(false);
    }
  }, [entryId, fetchJournal]);

  const saveJournalEntry = useCallback(async (contentToSave: string, currentEntry: JournalEntry | null): Promise<string | undefined> => {
    if (!firebaseInitialized || !db) {
      toast({ title: 'Error', description: 'Cannot save: Firebase not configured.', variant: 'destructive' });
      setError(fbConfigError || "Firebase not configured.");
      return undefined;
    }
    setIsSaving(true);
    setError(null);

    const now = serverTimestamp();
    const entryData = {
      content: contentToSave,
      userId: USER_ID,
      lastUpdated: now,
    };

    try {
      if (currentEntry?.id) { // Existing entry
        const docRef = doc(db, getJournalEntryDocPath(currentEntry.id));
        await setDoc(docRef, { ...entryData, createdAt: currentEntry.createdAt instanceof Date ? Timestamp.fromDate(currentEntry.createdAt) : currentEntry.createdAt }, { merge: true });
        toast({ title: 'Journal Updated', description: 'Your entry has been saved.' });
        return currentEntry.id;
      } else { // New entry
        const docRef = await addDoc(collection(db, userJournalEntriesCollectionPath), { ...entryData, createdAt: now });
        toast({ title: 'Journal Entry Saved', description: 'Your new entry has been created.' });
        return docRef.id; // Return the new document ID
      }
    } catch (err: any) {
      console.error('Error saving journal entry:', err);
      setError(`Could not save journal entry: ${err.message}`);
      toast({ title: 'Save Error', description: 'Could not save your journal entry.', variant: 'destructive' });
      return undefined;
    } finally {
      setIsSaving(false);
    }
  }, [toast, firebaseInitialized, db, fbConfigError]);
  
  const deleteJournalEntry = useCallback(async (idToDelete: string): Promise<boolean> => {
    if (!firebaseInitialized || !db) {
      toast({ title: 'Error', description: 'Cannot delete: Firebase not configured.', variant: 'destructive' });
      return false;
    }
    setIsSaving(true); // Use isSaving to indicate an operation is in progress
    try {
      const docRef = doc(db, getJournalEntryDocPath(idToDelete));
      await deleteDoc(docRef);
      toast({ title: 'Entry Deleted', description: 'Journal entry has been deleted.' });
      return true;
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      toast({ title: 'Error', description: 'Could not delete journal entry.', variant: 'destructive' });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [toast, firebaseInitialized, db]);


  const finalError = !firebaseInitialized ? (fbConfigError || "Firebase configuration error.") : error;

  return { entry, isLoading, isSaving, error: finalError, fetchJournal, saveJournalEntry, deleteJournalEntry };
}

