'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBeatStore, MidiNote, Sample } from '@/store/useBeatStore';

// Piano roll constants
const PIANO_KEY_HEIGHT = 16; // Height of each piano key row
const GRID_WIDTH = 32; // Width of each 16th note
const OCTAVES = 4; // C1 to C5
const TOTAL_NOTES = OCTAVES * 12; // 48 notes

// MIDI note number to note name
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getNoteInfo = (midiNote: number) => {
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = NOTE_NAMES[midiNote % 12];
  const isBlackKey = noteName.includes('#');
  return { noteName, octave, isBlackKey };
};

interface NoteBlockProps {
  note: MidiNote;
  onUpdate: (id: string, updates: Partial<MidiNote>) => void;
  onDelete: (id: string) => void;
  gridWidth: number;
  keyHeight: number;
}

const NoteBlock: React.FC<NoteBlockProps> = ({ note, onUpdate, onDelete, gridWidth, keyHeight }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startNoteRef = useRef({ startTime: 0, duration: 0, pitch: 0 });

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.stopPropagation();
    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startNoteRef.current = { startTime: note.startTime, duration: note.duration, pitch: note.pitch };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;

      if (isDragging) {
        // Move note
        const newStartTime = Math.max(0, startNoteRef.current.startTime + Math.round(deltaX / gridWidth));
        const newPitch = Math.max(24, Math.min(95, startNoteRef.current.pitch - Math.round(deltaY / keyHeight)));
        onUpdate(note.id, { startTime: newStartTime, pitch: newPitch });
      } else if (isResizing) {
        // Resize note
        const newDuration = Math.max(1, startNoteRef.current.duration + Math.round(deltaX / gridWidth));
        onUpdate(note.id, { duration: newDuration });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, note.id, onUpdate, gridWidth, keyHeight]);

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete(note.id);
  };

  const left = note.startTime * gridWidth;
  const width = note.duration * gridWidth;
  const top = (95 - note.pitch) * keyHeight;

  return (
    <div
      className="absolute bg-gradient-to-r from-purple-500 to-purple-600 border border-purple-400 rounded cursor-move select-none shadow-lg hover:from-purple-400 hover:to-purple-500 transition-colors"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${keyHeight}px`,
      }}
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
      onContextMenu={handleRightClick}
    >
      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 bg-purple-300 cursor-ew-resize hover:bg-purple-200"
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
      />
    </div>
  );
};

const PianoRoll: React.FC = () => {
  const { midiNotes, addMidiNote, updateMidiNote, deleteMidiNote, currentStep, patternLength } = useBeatStore();
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top;

    const startTime = Math.floor(x / GRID_WIDTH);
    const pitch = 95 - Math.floor(y / PIANO_KEY_HEIGHT);

    // Add new note (1 beat = 4 sixteenth notes)
    addMidiNote({
      pitch,
      startTime,
      duration: 4, // Default 1 beat
      velocity: 0.8,
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);

    // Calculate preview position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragPreview({ x, y });
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    setDragPreview(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragPreview(null);

    try {
      // Get the sample data from the drag event
      const sampleData = e.dataTransfer.getData('application/json');
      if (!sampleData) return;

      const sample: Sample = JSON.parse(sampleData);

      // Calculate drop position
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const startTime = Math.floor(x / GRID_WIDTH);
      const pitch = 95 - Math.floor(y / PIANO_KEY_HEIGHT);

      // Add new MIDI note with the sample
      addMidiNote({
        pitch,
        startTime,
        duration: 4, // Default 1 beat
        velocity: 0.8,
        sampleId: sample.id, // Store the sample ID with the note
      });
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const totalWidth = patternLength * GRID_WIDTH;

  return (
    <div className="piano-roll h-full flex flex-col bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4)] border-2 border-gray-800/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-800/50">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Piano Roll</h3>
        <button
          onClick={() => deleteMidiNote}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-bold text-white transition-all"
        >
          Clear All
        </button>
      </div>

      {/* Piano Roll Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Piano Keys (left sidebar) */}
        <div className="w-16 bg-gradient-to-r from-[#1F1F1F] to-[#252525] border-r-2 border-gray-800/50 overflow-hidden">
          <div style={{ height: `${TOTAL_NOTES * PIANO_KEY_HEIGHT}px` }}>
            {Array.from({ length: TOTAL_NOTES }).map((_, index) => {
              const midiNote = 95 - index; // C5 (96) down to C2 (24)
              const { noteName, octave, isBlackKey } = getNoteInfo(midiNote);
              const showLabel = noteName === 'C';

              return (
                <div
                  key={index}
                  className={`flex items-center justify-end px-2 border-b border-gray-800/30 ${
                    isBlackKey ? 'bg-gray-900/50' : 'bg-gray-800/30'
                  }`}
                  style={{ height: `${PIANO_KEY_HEIGHT}px` }}
                >
                  {showLabel && (
                    <span className="text-[10px] font-bold text-gray-500">
                      {noteName}{octave}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid Area */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-auto bg-[#1A1A1A]"
          onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        >
          <div
            className={`relative transition-all ${isDragOver ? 'ring-2 ring-purple-500/50' : ''}`}
            style={{ width: `${totalWidth}px`, height: `${TOTAL_NOTES * PIANO_KEY_HEIGHT}px` }}
            onClick={handleGridClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Horizontal grid lines (piano keys) */}
            {Array.from({ length: TOTAL_NOTES }).map((_, index) => {
              const midiNote = 95 - index;
              const { isBlackKey } = getNoteInfo(midiNote);
              return (
                <div
                  key={`h-${index}`}
                  className={`absolute left-0 right-0 border-b ${
                    isBlackKey ? 'border-gray-800/40 bg-gray-900/20' : 'border-gray-800/60'
                  }`}
                  style={{ top: `${index * PIANO_KEY_HEIGHT}px`, height: `${PIANO_KEY_HEIGHT}px` }}
                />
              );
            })}

            {/* Vertical grid lines (beats) */}
            {Array.from({ length: patternLength + 1 }).map((_, index) => {
              const isMeasure = index % 16 === 0;
              const isBeat = index % 4 === 0;
              return (
                <div
                  key={`v-${index}`}
                  className={`absolute top-0 bottom-0 ${
                    isMeasure
                      ? 'border-l-2 border-purple-500/50'
                      : isBeat
                      ? 'border-l border-gray-700/60'
                      : 'border-l border-gray-800/40'
                  }`}
                  style={{ left: `${index * GRID_WIDTH}px` }}
                />
              );
            })}

            {/* Playback cursor */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-purple-500 pointer-events-none z-20"
              style={{ left: `${currentStep * GRID_WIDTH}px` }}
            />

            {/* MIDI Notes */}
            {midiNotes.map((note) => (
              <NoteBlock
                key={note.id}
                note={note}
                onUpdate={updateMidiNote}
                onDelete={deleteMidiNote}
                gridWidth={GRID_WIDTH}
                keyHeight={PIANO_KEY_HEIGHT}
              />
            ))}

            {/* Drag Preview */}
            {isDragOver && dragPreview && (
              <div
                className="absolute bg-purple-500/30 border-2 border-purple-500 rounded pointer-events-none z-30"
                style={{
                  left: `${Math.floor(dragPreview.x / GRID_WIDTH) * GRID_WIDTH}px`,
                  top: `${(95 - Math.floor(dragPreview.y / PIANO_KEY_HEIGHT)) * PIANO_KEY_HEIGHT}px`,
                  width: `${4 * GRID_WIDTH}px`,
                  height: `${PIANO_KEY_HEIGHT}px`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;

