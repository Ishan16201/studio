
'use client';

import { useState, useCallback } from 'react';
import { db, USER_ID, firebaseInitialized, firebaseInitError as fbConfigError } from '@/lib/firebase';
import { doc, Timestamp, setDoc, addDoc, collection, serverTimestamp, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import type { JournalEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';

const getJournalEntryDocPath = (entryId: string) => `userJournalEntries/${USER_ID}/entries/${entryId}`;
const userJournalEntriesCollectionPath = `userJournalEntries/${USER_ID}/entries`;

export function useJournalEntry(entryId?: string | null) { // entryId is for fetching a specific entry for editing
  const [entry, setEntry] = useState<Partial<JournalEntry> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchSpecificEntry = useCallback(async (idToFetch: string) => {
    setIsLoading(true);
    setError(null);
    if (!firebaseInitialized || !db) {
      setError(fbConfigError || "Firebase not initialized.");
      setIsLoading(false);
      return null;
    }
    try {
      const docRef = doc(db, getJournalEntryDocPath(idToFetch));
      const docSnap: DocumentSnapshot = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const fetchedEntryData = {
          id: docSnap.id,
          content: data.content || '',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : new Date(data.lastUpdated),
          userId: data.userId || USER_ID,
        };
        setEntry(fetchedEntryData); // Update local state for editor
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
  }, [toast, fbConfigError]);


  const saveJournalEntry = useCallback(async (contentToSave: string, currentEntryData?: Partial<JournalEntry>): Promise<string | undefined> => {
    if (!firebaseInitialized || !db) {
      toast({ title: 'Error', description: 'Cannot save: Firebase not configured.', variant: 'destructive' });
      setError(fbConfigError || "Firebase not configured.");
      return undefined;
    }
    setIsSaving(true);
    setError(null);

    const now = serverTimestamp(); // For Firestore server-side timestamp
    let entryToPersist: Omit<JournalEntry, 'id'> & { id?: string };

    if (currentEntryData?.id) { // Existing entry
      entryToPersist = {
        id: currentEntryData.id,
        content: contentToSave,
        userId: USER_ID,
        createdAt: currentEntryData.createdAt instanceof Date ? Timestamp.fromDate(currentEntryData.createdAt) : currentEntryData.createdAt as Timestamp, // Preserve original createdAt
        lastUpdated: now,
      };
    } else { // New entry
      entryToPersist = {
        content: contentToSave,
        userId: USER_ID,
        createdAt: now,
        lastUpdated: now,
      };
    }
    
    try {
      if (entryToPersist.id) {
        const docRef = doc(db, getJournalEntryDocPath(entryToPersist.id));
        await setDoc(docRef, { 
            content: entryToPersist.content, 
            userId: entryToPersist.userId, 
            createdAt: entryToPersist.createdAt, // Ensure it's a Timestamp
            lastUpdated: entryToPersist.lastUpdated 
        }, { merge: true });
        toast({ title: 'Journal Updated', description: 'Your entry has been saved.' });
        return entryToPersist.id;
      } else {
        const docRef = await addDoc(collection(db, userJournalEntriesCollectionPath), {
            content: entryToPersist.content,
            userId: entryToPersist.userId,
            createdAt: entryToPersist.createdAt, // This will be a serverTimestamp
            lastUpdated: entryToPersist.lastUpdated, // This will be a serverTimestamp
        });
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
  }, [toast, fbConfigError]);
  
  const deleteJournalEntry = useCallback(async (idToDelete: string): Promise<boolean> => {
    if (!firebaseInitialized || !db) {
      toast({ title: 'Error', description: 'Cannot delete: Firebase not configured.', variant: 'destructive' });
      return false;
    }
    setIsSaving(true); // Indicate an operation is in progress
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
  }, [toast, fbConfigError]);

  const finalError = !firebaseInitialized ? (fbConfigError || "Firebase configuration error.") : error;

  return { entry, isLoading, isSaving, error: finalError, fetchSpecificEntry, saveJournalEntry, deleteJournalEntry };
}
