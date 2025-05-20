'use client';

import { useEffect, useCallback, useRef } from 'react';

function simpleDebounce<F extends (...args: any[]) => any>(func: F, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const debouncedFunction = (...args: Parameters<F>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };

  debouncedFunction.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };
  
  return debouncedFunction;
}


interface UseAutosaveProps<T> {
  data: T;
  onSave: (data: T) => Promise<void> | void;
  interval?: number; // in milliseconds
  isDirty?: boolean; // Optional flag to control saving only when dirty
}

export function useAutosave<T>({
  data,
  onSave,
  interval = 2000, // Default to 2 seconds
  isDirty = true, // Default to always save if data changes
}: UseAutosaveProps<T>) {
  const firstRender = useRef(true);
  const onSaveRef = useRef(onSave); // Keep onSave reference stable

  // Update ref if onSave changes
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const debouncedSave = useCallback(
    simpleDebounce((currentData: T) => {
      if (isDirty) { // Only save if isDirty is true
        onSaveRef.current(currentData);
      }
    }, interval),
    [interval, isDirty] 
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return; // Don't save on initial mount if data is loaded
    }
    
    if (isDirty) { // Only trigger debounce if isDirty
        debouncedSave(data);
    }

    return () => {
      // Optionally, you might want to cancel any pending save on unmount
      // debouncedSave.cancel(); 
    };
  }, [data, debouncedSave, isDirty]);
}
