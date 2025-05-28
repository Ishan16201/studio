'use client';

import { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { db, USER_ID } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { JournalEntry } from '@/types';
import { useAutosave } from '@/hooks/useAutosave';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const JOURNAL_DOC_PATH = `journal/${USER_ID}/entry/main`;

export default function JournalEditor() {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        const docRef = doc(db, JOURNAL_DOC_PATH);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as JournalEntry;
          setContent(data.content);
        }
      } catch (error) {
        console.error('Error fetching journal:', error);
        toast({
          title: 'Error',
          description: 'Could not load your journal. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchJournal();
  }, [toast]);

  const handleSave = useCallback(async (currentContent: string) => {
    try {
      const docRef = doc(db, JOURNAL_DOC_PATH);
      await setDoc(docRef, {
        content: currentContent,
        lastUpdated: serverTimestamp(),
        userId: USER_ID, // Good practice to include userId
      }, { merge: true });
      setIsDirty(false); 
    } catch (error) {
      console.error('Error saving journal:', error);
      toast({
        title: 'Save Error',
        description: 'Could not save your journal. Please check your connection.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useAutosave<string>({
    data: content,
    onSave: handleSave,
    interval: 2500, 
    isDirty: isDirty,
  });

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
    setIsDirty(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)] md:h-[500px]">
        <Skeleton className="h-full w-full rounded-md" />
      </div>
    );
  }

  return (
    <Textarea
      value={content}
      onChange={handleChange}
      placeholder="What's on your mind? Your progress, your struggles, your wins... Type it all out."
      className="w-full h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)] md:h-[500px] p-4 sm:p-6 text-sm sm:text-base md:text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none rounded-b-xl bg-card text-card-foreground"
      aria-label="Journal Entry"
    />
  );
}
