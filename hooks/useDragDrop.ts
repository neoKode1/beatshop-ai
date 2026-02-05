import { useState, useCallback, DragEvent } from 'react';
import { Sample } from '@/store/useBeatStore';

/**
 * useDragDrop - Reusable drag-and-drop hook
 * 
 * Eliminates duplicate drag-drop handlers across:
 * - PadGrid (drop to pad)
 * - StepSequencer (drop to add track)
 * - PianoKeyboard (drop to load sample)
 * - SampleBrowser (drag source)
 */

export interface DragDropHandlers {
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}

export interface DragDropState {
  isDragOver: boolean;
  handlers: DragDropHandlers;
}

export interface UseDragDropOptions {
  /** Called when a valid sample is dropped */
  onDrop: (sample: Sample) => void;
  /** Optional: validate if drop should be accepted */
  canDrop?: (sample: Sample) => boolean;
  /** Optional: custom drop effect */
  dropEffect?: 'copy' | 'move' | 'link' | 'none';
}

/**
 * Hook for drop targets (PadGrid, StepSequencer, PianoKeyboard)
 */
export function useDragDrop(options: UseDragDropOptions): DragDropState {
  const { onDrop, canDrop, dropEffect = 'copy' } = options;
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = dropEffect;
    setIsDragOver(true);
  }, [dropEffect]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const sampleData = e.dataTransfer.getData('application/json');
      if (!sampleData) return;

      const sample: Sample = JSON.parse(sampleData);
      
      // Validate if canDrop is provided
      if (canDrop && !canDrop(sample)) {
        return;
      }

      onDrop(sample);
    } catch (error) {
      console.error('useDragDrop: Failed to parse dropped data', error);
    }
  }, [onDrop, canDrop]);

  return {
    isDragOver,
    handlers: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}

/**
 * Hook for drag sources (SampleBrowser)
 */
export interface DragSourceHandlers {
  onDragStart: (e: DragEvent, sample: Sample) => void;
  onDragEnd: () => void;
}

export interface DragSourceState {
  draggedSample: Sample | null;
  handlers: DragSourceHandlers;
}

export function useDragSource(): DragSourceState {
  const [draggedSample, setDraggedSample] = useState<Sample | null>(null);

  const handleDragStart = useCallback((e: DragEvent, sample: Sample) => {
    setDraggedSample(sample);
    e.dataTransfer.setData('application/json', JSON.stringify(sample));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedSample(null);
  }, []);

  return {
    draggedSample,
    handlers: {
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
    },
  };
}

/**
 * Helper to create draggable props for a sample element
 */
export function createDraggableProps(
  sample: Sample,
  handlers: DragSourceHandlers
) {
  return {
    draggable: true,
    onDragStart: (e: DragEvent) => handlers.onDragStart(e, sample),
    onDragEnd: handlers.onDragEnd,
  };
}

/**
 * Helper to determine track type from sample category
 */
export function getTrackTypeFromSample(sample: Sample): 'drum' | 'instrument' {
  const melodicCategories = ['melodic', 'synth'];
  return melodicCategories.includes(sample.category) ? 'instrument' : 'drum';
}

