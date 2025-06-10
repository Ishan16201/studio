
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { JournalEntry } from '@/types';
import { useAutosave } from '@/hooks/useAutosave';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format, isValid } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface JournalEditorProps {
  initialEntryData?: Partial<JournalEntry>;
  onSave: (content: string, entryId?: string) => Promise<string | undefined | void>;
  onClose: () => void;
  isOpen: boolean;
  isSavingJournal: boolean;
  journalError?: string | null;
}

export default function JournalEditor({
  initialEntryData,
  onSave,
  onClose,
  isOpen,
  isSavingJournal,
  journalError,
}: JournalEditorProps) {
  const [content, setContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [currentEntryId, setCurrentEntryId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingInitial(true);
      const entryContent = initialEntryData?.content || '';
      const entryId = initialEntryData?.id;
      
      setContent(entryContent);
      setCurrentEntryId(entryId);
      setIsDirty(false); 
      setIsLoadingInitial(false);
    } else {
      setContent('');
      setCurrentEntryId(undefined);
      setIsDirty(false);
      setIsLoadingInitial(true); 
    }
  }, [initialEntryData, isOpen]);

  const handleInternalSave = useCallback(async (currentContent: string) => {
    if (!isDirty && currentEntryId) return; 
    
    const savedId = await onSave(currentContent, currentEntryId);
    
    if (savedId) {
      setIsDirty(false);
      if (!currentEntryId) { 
        setCurrentEntryId(savedId);
      }
    }
  }, [onSave, currentEntryId, isDirty]);

  useAutosave<string>({
    data: content,
    onSave: handleInternalSave,
    interval: 3000,
    isDirty: isDirty,
  });

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
    setIsDirty(true);
  };

  const handleManualSaveAndClose = async () => {
    if (isDirty || !currentEntryId) { 
      await handleInternalSave(content);
    }
    onClose();
  };
  
  const editorContentArea = () => {
    if (isLoadingInitial) {
      return (
        <div className="p-4 sm:p-6 h-[400px] md:h-[500px]">
          <Skeleton className="h-full w-full rounded-md" />
        </div>
      );
    }
    if (journalError && !isLoadingInitial) { 
      return (
        <div className="p-4 sm:p-6 text-center text-destructive-foreground bg-destructive/80 rounded-b-xl h-[400px] md:h-[500px] flex flex-col justify-center items-center">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
          <p className="font-semibold">Error Saving</p>
          <p className="text-sm">{journalError}</p>
        </div>
      );
    }
    return (
       <Textarea
        value={content}
        onChange={handleChange}
        placeholder="What's on your mind? Your progress, your struggles, your wins... Type it all out."
        className="w-full h-[350px] sm:h-[400px] md:h-[450px] p-4 text-sm sm:text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none bg-background text-foreground"
        aria-label="Journal Entry"
        disabled={isSavingJournal || !!journalError || isLoadingInitial}
      />
    );
  };

  let displayableLastUpdated: Date | null = null;
  if (initialEntryData?.lastUpdated) {
    if (initialEntryData.lastUpdated instanceof Date && isValid(initialEntryData.lastUpdated)) {
      displayableLastUpdated = initialEntryData.lastUpdated;
    } else if (initialEntryData.lastUpdated instanceof Timestamp && isValid(initialEntryData.lastUpdated.toDate())) {
      displayableLastUpdated = initialEntryData.lastUpdated.toDate();
    } else if (typeof (initialEntryData.lastUpdated as any)?.toDate === 'function') { // Handle cases where it might be a plain object
        const convertedDate = (initialEntryData.lastUpdated as any).toDate();
        if (isValid(convertedDate)) {
            displayableLastUpdated = convertedDate;
        }
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={(openState) => !openState && onClose()}>
      <DialogContent className="sm:max-w-2xl w-[90vw] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{currentEntryId ? 'Edit Entry' : 'New Journal Entry'}</DialogTitle>
          {displayableLastUpdated && (
            <DialogDescription className="text-xs">
              Last saved: {format(displayableLastUpdated, 'Pp')}
            </DialogDescription>
          )}
           {!displayableLastUpdated && currentEntryId && (
             <DialogDescription className="text-xs text-muted-foreground">
                Not saved yet.
             </DialogDescription>
           )}
        </DialogHeader>
        <div className="flex-grow overflow-y-auto">
         {editorContentArea()}
        </div>
        <DialogFooter className="p-4 border-t items-center">
          <span className="text-xs text-muted-foreground mr-auto">
            {isSavingJournal ? 'Saving...' : isDirty ? 'Unsaved changes' : (currentEntryId ? 'Autosaved' : 'Ready to save')}
          </span>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSavingJournal}>
            Close
          </Button>
          <Button type="button" onClick={handleManualSaveAndClose} disabled={isSavingJournal || (!isDirty && !!currentEntryId) }>
             <Save className="mr-2 h-4 w-4" /> Save & Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
