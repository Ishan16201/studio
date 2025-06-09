
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { JournalEntry } from '@/types';
import { useAutosave } from '@/hooks/useAutosave';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

interface JournalEditorProps {
  initialEntryData?: Partial<JournalEntry>; // For new or existing entry
  onSave: (content: string, entryId?: string) => Promise<string | undefined | void>; // Returns new/updated entry ID or void
  onClose: () => void;
  isOpen: boolean;
  isSavingJournal: boolean; // Passed down from parent managing the save state
  journalError?: string | null; // Passed down error
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
  const [isLoading, setIsLoading] = useState<boolean>(true); // Local loading for initial content set

  useEffect(() => {
    setIsLoading(true);
    if (initialEntryData) {
      setContent(initialEntryData.content || '');
    } else {
      setContent(''); // For a completely new entry not yet in DB
    }
    setIsDirty(false); // Reset dirty state when entry changes
    setIsLoading(false);
  }, [initialEntryData, isOpen]); // Re-run when dialog opens or initial data changes

  const handleInternalSave = useCallback(async (currentContent: string) => {
    if (!isDirty) return; // Don't save if not dirty
    
    // onSave is expected to handle isSaving state and toast
    const savedEntryId = await onSave(currentContent, initialEntryData?.id);
    
    if (savedEntryId) { // If save was successful (indicated by returned ID or just completion)
        setIsDirty(false);
        // If it was a new entry and we got an ID, we might want to update initialEntryData if editor stays open
        // For now, onClose will typically be called by parent
    }
    // If save failed, error will be handled by parent via journalError prop & toast
  }, [onSave, initialEntryData?.id, isDirty]);

  useAutosave<string>({
    data: content,
    onSave: handleInternalSave,
    interval: 2500,
    isDirty: isDirty,
  });

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
    setIsDirty(true);
  };

  const handleManualSaveAndClose = async () => {
    await handleInternalSave(content); // Ensure latest content is saved
    onClose();
  };
  
  const editorContent = () => {
    if (isLoading) {
      return (
        <div className="p-4 sm:p-6 h-[400px] md:h-[500px]">
          <Skeleton className="h-full w-full rounded-md" />
        </div>
      );
    }
    if (journalError && !isLoading) { // Show error only if not loading initial data
      return (
        <div className="p-4 sm:p-6 text-center text-destructive-foreground bg-destructive/80 rounded-b-xl h-[400px] md:h-[500px] flex flex-col justify-center items-center">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
          <p className="font-semibold">Error</p>
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
        disabled={isSavingJournal || journalError ? true : false}
      />
    );
  };


  return (
    <Dialog open={isOpen} onOpenChange={(openState) => !openState && onClose()}>
      <DialogContent className="sm:max-w-2xl w-[90vw] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{initialEntryData?.id ? 'Edit Entry' : 'New Journal Entry'}</DialogTitle>
          {initialEntryData?.lastUpdated && (
            <DialogDescription className="text-xs">
              Last saved: {initialEntryData.lastUpdated instanceof Date ? format(initialEntryData.lastUpdated, 'Pp') : 'Recently'}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex-grow overflow-y-auto">
         {editorContent()}
        </div>
        <DialogFooter className="p-4 border-t">
          <span className="text-xs text-muted-foreground mr-auto">
            {isSavingJournal ? 'Saving...' : isDirty ? 'Unsaved changes' : 'Autosaved'}
          </span>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSavingJournal}>
            Close
          </Button>
          <Button type="button" onClick={handleManualSaveAndClose} disabled={isSavingJournal || !isDirty}>
             <Save className="mr-2 h-4 w-4" /> Save & Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
