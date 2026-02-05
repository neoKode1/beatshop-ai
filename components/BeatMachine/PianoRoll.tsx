'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useBeatStore, MidiNote, Sample } from '@/store/useBeatStore';
import { Music, Trash2, Pencil, PaintBucket, Grid3X3, MousePointer2, Scissors, VolumeX, Volume2, X, ZoomIn, ZoomOut } from 'lucide-react';

// Piano Roll Tool definitions
type PianoRollTool = 'draw' | 'paint' | 'paintDrum' | 'delete' | 'mute' | 'select' | 'slice' | 'chord';

const TOOL_CONFIG: Record<PianoRollTool, { label: string; shortcut: string; icon: React.ReactNode; color: string }> = {
  draw: { label: 'Draw', shortcut: 'P', icon: <Pencil size={12} />, color: 'text-purple-400' },
  paint: { label: 'Paint', shortcut: 'B', icon: <PaintBucket size={12} />, color: 'text-blue-400' },
  paintDrum: { label: 'Drum Seq', shortcut: 'N', icon: <Grid3X3 size={12} />, color: 'text-green-400' },
  delete: { label: 'Delete', shortcut: 'D', icon: <Trash2 size={12} />, color: 'text-red-400' },
  mute: { label: 'Mute', shortcut: 'T', icon: <VolumeX size={12} />, color: 'text-yellow-400' },
  select: { label: 'Select', shortcut: 'E', icon: <MousePointer2 size={12} />, color: 'text-cyan-400' },
  slice: { label: 'Slice', shortcut: 'C', icon: <Scissors size={12} />, color: 'text-orange-400' },
  chord: { label: 'Chord', shortcut: 'K', icon: <Music size={12} />, color: 'text-pink-400' },
};

// Chord definitions - intervals from root note (in semitones)
const CHORD_TYPES: Record<string, { name: string; intervals: number[] }> = {
  major: { name: 'Major', intervals: [0, 4, 7] },
  minor: { name: 'Minor', intervals: [0, 3, 7] },
  dim: { name: 'Dim', intervals: [0, 3, 6] },
  aug: { name: 'Aug', intervals: [0, 4, 8] },
  sus2: { name: 'Sus2', intervals: [0, 2, 7] },
  sus4: { name: 'Sus4', intervals: [0, 5, 7] },
  maj7: { name: 'Maj7', intervals: [0, 4, 7, 11] },
  min7: { name: 'Min7', intervals: [0, 3, 7, 10] },
  dom7: { name: '7', intervals: [0, 4, 7, 10] },
  dim7: { name: 'Dim7', intervals: [0, 3, 6, 9] },
  aug7: { name: 'Aug7', intervals: [0, 4, 8, 10] },
  maj9: { name: 'Maj9', intervals: [0, 4, 7, 11, 14] },
  min9: { name: 'Min9', intervals: [0, 3, 7, 10, 14] },
  dom9: { name: '9', intervals: [0, 4, 7, 10, 14] },
  add9: { name: 'Add9', intervals: [0, 4, 7, 14] },
  '6': { name: '6', intervals: [0, 4, 7, 9] },
  min6: { name: 'Min6', intervals: [0, 3, 7, 9] },
  power: { name: 'Power', intervals: [0, 7] },
};

// Piano roll constants
const PIANO_KEY_HEIGHT = 14; // Height of each piano key row
const GRID_WIDTH = 24; // Width of each 16th note (smaller for more beats visible)
const OCTAVES = 3; // C2 to C5 (reduced for better fit)
const TOTAL_NOTES = OCTAVES * 12; // 36 notes

// MIDI note number to note name
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Pattern length options (in beats)
const PATTERN_LENGTHS = [4, 8, 16, 32] as const;

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
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  gridWidth: number;
  keyHeight: number;
  isSelected: boolean;
  isMuted: boolean;
  activeTool: PianoRollTool;
}

const NoteBlock: React.FC<NoteBlockProps> = ({
  note, onUpdate, onDelete, onClick, onDoubleClick, gridWidth, keyHeight,
  isSelected, isMuted, activeTool
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startNoteRef = useRef({ startTime: 0, duration: 0, pitch: 0 });

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.stopPropagation();

    // Handle different tools
    if (activeTool === 'delete') {
      onDelete(note.id);
      return;
    }
    if (activeTool === 'mute' || activeTool === 'select') {
      onClick?.(e);
      return;
    }

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
        const newStartTime = Math.max(0, startNoteRef.current.startTime + Math.round(deltaX / gridWidth));
        const newPitch = Math.max(24, Math.min(95, startNoteRef.current.pitch - Math.round(deltaY / keyHeight)));
        onUpdate(note.id, { startTime: newStartTime, pitch: newPitch });
      } else if (isResizing) {
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

  // Determine colors based on state
  const baseColor = isMuted ? 'from-gray-500 to-gray-600' : 'from-purple-500 to-purple-600';
  const hoverColor = isMuted ? 'hover:from-gray-400 hover:to-gray-500' : 'hover:from-purple-400 hover:to-purple-500';
  const borderColor = isSelected ? 'border-2 border-cyan-400 ring-1 ring-cyan-400/50' : (isMuted ? 'border border-gray-400' : 'border border-purple-400');
  const resizeHandleColor = isMuted ? 'bg-gray-300 hover:bg-gray-200' : 'bg-purple-300 hover:bg-purple-200';

  return (
    <div
      className={`absolute bg-gradient-to-r ${baseColor} ${borderColor} rounded cursor-move select-none shadow-lg ${hoverColor} transition-colors ${isMuted ? 'opacity-50' : ''}`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${keyHeight}px`,
        zIndex: isSelected ? 20 : 10,
      }}
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
      onDoubleClick={onDoubleClick}
      onContextMenu={handleRightClick}
    >
      {/* Resize handle */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-2 ${resizeHandleColor} cursor-ew-resize`}
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
      />
      {/* Mute indicator */}
      {isMuted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <VolumeX size={8} className="text-gray-300" />
        </div>
      )}
    </div>
  );
};

// Ghost Note Block - semi-transparent notes from other channels (FL Studio style)
interface GhostNoteBlockProps {
  note: MidiNote;
  gridWidth: number;
  keyHeight: number;
  color?: string;
  onDoubleRightClick?: () => void; // Switch to that channel
}

const GhostNoteBlock: React.FC<GhostNoteBlockProps> = ({
  note, gridWidth, keyHeight, color = '#4a5568', onDoubleRightClick
}) => {
  const x = note.startTime * gridWidth;
  const y = (71 - note.pitch) * keyHeight; // 71 = top of visible range (B4)
  const width = Math.max(gridWidth * 0.75, note.duration * gridWidth - 1);

  return (
    <div
      className="absolute pointer-events-auto cursor-pointer transition-opacity hover:opacity-40"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${keyHeight - 1}px`,
        backgroundColor: color,
        opacity: 0.25,
        borderRadius: '2px',
        border: `1px solid ${color}`,
      }}
      onContextMenu={(e) => {
        if (e.detail === 2 && onDoubleRightClick) {
          e.preventDefault();
          onDoubleRightClick();
        }
      }}
      title="Ghost note (from another channel)"
    />
  );
};

// Note Properties Panel - FL Studio style popup for editing note properties
interface NotePropertiesPanelProps {
  note: MidiNote;
  onUpdate: (updates: Partial<MidiNote>) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const NotePropertiesPanel: React.FC<NotePropertiesPanelProps> = ({
  note, onUpdate, onClose, position
}) => {
  const getNoteNameFromPitch = (pitch: number): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(pitch / 12) - 1;
    const noteName = noteNames[pitch % 12];
    return `${noteName}${octave}`;
  };

  // Handle click outside to close
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="fixed bg-[#1a1a1a] border border-gray-600 rounded-lg shadow-2xl z-50 p-3 min-w-[220px]"
      style={{
        left: `${Math.min(position.x, window.innerWidth - 240)}px`,
        top: `${Math.min(position.y, window.innerHeight - 280)}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
        <span className="text-xs font-bold text-gray-200">
          🎵 {getNoteNameFromPitch(note.pitch)} Properties
        </span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Velocity Slider */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <label className="text-[10px] text-gray-400 uppercase font-medium">Velocity</label>
          <span className="text-[10px] text-purple-400 font-mono">{Math.round((note.velocity || 0.8) * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={(note.velocity || 0.8) * 100}
          onChange={(e) => {
            const vel = parseInt(e.target.value) / 100;
            onUpdate({ velocity: vel });
            console.log(`🎵 Note velocity changed: ${Math.round(vel * 100)}%`);
          }}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>

      {/* Pan Slider */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <label className="text-[10px] text-gray-400 uppercase font-medium">Pan</label>
          <span className="text-[10px] text-blue-400 font-mono">
            {note.pan === 0 ? 'C' : note.pan && note.pan > 0 ? `R${Math.round(note.pan * 100)}` : `L${Math.round(Math.abs(note.pan || 0) * 100)}`}
          </span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          value={(note.pan || 0) * 100}
          onChange={(e) => {
            const pan = parseInt(e.target.value) / 100;
            onUpdate({ pan });
            console.log(`🎵 Note pan changed: ${pan === 0 ? 'Center' : pan > 0 ? `Right ${Math.round(pan * 100)}%` : `Left ${Math.round(Math.abs(pan) * 100)}%`}`);
          }}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Pitch Offset Slider */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <label className="text-[10px] text-gray-400 uppercase font-medium">Pitch Offset</label>
          <span className="text-[10px] text-green-400 font-mono">{note.pitchOffset || 0} st</span>
        </div>
        <input
          type="range"
          min="-12"
          max="12"
          value={note.pitchOffset || 0}
          onChange={(e) => {
            const pitchOffset = parseInt(e.target.value);
            onUpdate({ pitchOffset });
            console.log(`🎵 Note pitch offset changed: ${pitchOffset} semitones`);
          }}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
      </div>

      {/* Mod X Slider */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <label className="text-[10px] text-gray-400 uppercase font-medium">Mod X</label>
          <span className="text-[10px] text-orange-400 font-mono">{Math.round((note.modX || 0.5) * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={(note.modX || 0.5) * 100}
          onChange={(e) => {
            const modX = parseInt(e.target.value) / 100;
            onUpdate({ modX });
            console.log(`🎵 Note Mod X changed: ${Math.round(modX * 100)}%`);
          }}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
      </div>

      {/* Mod Y Slider */}
      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <label className="text-[10px] text-gray-400 uppercase font-medium">Mod Y</label>
          <span className="text-[10px] text-yellow-400 font-mono">{Math.round((note.modY || 0.5) * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={(note.modY || 0.5) * 100}
          onChange={(e) => {
            const modY = parseInt(e.target.value) / 100;
            onUpdate({ modY });
            console.log(`🎵 Note Mod Y changed: ${Math.round(modY * 100)}%`);
          }}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
        />
      </div>

      <div className="text-[8px] text-gray-500 text-center mt-2 pt-2 border-t border-gray-700">
        Press ESC or click outside to close
      </div>
    </div>
  );
};

const PianoRoll: React.FC = () => {
  const {
    midiNotes,
    addMidiNote,
    updateMidiNote,
    deleteMidiNote,
    currentStep,
    numBars,
    setNumBars,
    patterns,
    currentPatternId,
    clearPattern,
    // Piano Roll Tools & Selection
    pianoRollTool,
    setPianoRollTool,
    selectedNoteIds,
    mutedNoteIds,
    selectNote,
    deselectAllNotes,
    selectNotesInRange,
    toggleNoteSelection,
    toggleNoteMute,
    copySelectedNotes,
    pasteNotes,
    deleteSelectedNotes,
    selectAllNotes,
    duplicateSelectedNotes,
    // Ghost Notes
    showGhostNotes,
    toggleGhostNotes,
    getGhostNotes,
    tracks,
    selectedTrackId,
    // Snap to Scale
    snapToScale,
    toggleSnapToScale,
    selectedScale,
    setSelectedScale,
    scaleRootNote,
    setScaleRootNote,
    isNoteInScale,
    snapPitchToScale,
    // Chord Stamp Tool
    selectedChordType,
    setSelectedChordType,
  } = useBeatStore();

  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selection box state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);

  // Paint mode state
  const [isPainting, setIsPainting] = useState(false);
  const lastPaintedStepRef = useRef<number | null>(null);

  // Note Properties Panel state (FL Studio style)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [propertiesPanelPosition, setPropertiesPanelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Get the note being edited
  const editingNote = editingNoteId ? midiNotes.find(n => n.id === editingNoteId) : null;

  // Zoom state (FL Studio style)
  const [zoomLevel, setZoomLevel] = useState(1.0); // 0.25 to 4.0
  const ZOOM_MIN = 0.25;
  const ZOOM_MAX = 4.0;
  const ZOOM_STEP = 0.25;

  // Computed grid width based on zoom
  const effectiveGridWidth = GRID_WIDTH * zoomLevel;

  // Calculate pattern length in 16th notes (4 per beat, 4 beats per bar in 4/4)
  const stepsPerBar = 16; // 16th notes per bar in 4/4
  const totalSteps = numBars * stepsPerBar;
  const totalBeats = numBars * 4; // 4 beats per bar

  // Get current pattern info
  const currentPattern = patterns.find(p => p.id === currentPatternId);
  const patternName = currentPattern?.name || 'Pattern 1';
  const patternColor = currentPattern?.color || '#ff6b35';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts (only when not in input field)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'p': setPianoRollTool('draw'); break;
          case 'b': setPianoRollTool('paint'); break;
          case 'n': setPianoRollTool('paintDrum'); break;
          case 'd': setPianoRollTool('delete'); break;
          case 't': setPianoRollTool('mute'); break;
          case 'e': setPianoRollTool('select'); break;
          case 'c': if (!e.ctrlKey && !e.metaKey) setPianoRollTool('slice'); break;
          case 'k': setPianoRollTool('chord'); console.log('🎹 Piano Roll: Switched to Chord Stamp tool'); break;
        }
      }

      // Edit shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'a': e.preventDefault(); selectAllNotes(); break;
          case 'c': e.preventDefault(); copySelectedNotes(); break;
          case 'v': e.preventDefault(); pasteNotes(); break;
          case 'd': e.preventDefault(); duplicateSelectedNotes(); break;
        }
      }

      // Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNoteIds.length > 0) {
          e.preventDefault();
          deleteSelectedNotes();
        }
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        deselectAllNotes();
      }

      // Alt+V to toggle ghost notes (FL Studio style)
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        toggleGhostNotes();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPianoRollTool, selectAllNotes, copySelectedNotes, pasteNotes, duplicateSelectedNotes, deleteSelectedNotes, deselectAllNotes, selectedNoteIds.length, toggleGhostNotes]);

  // Mouse wheel zoom handler (Ctrl+scroll)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoomLevel(prev => {
          const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev + delta));
          if (newZoom !== prev) {
            console.log(`🔍 Piano Roll: Zoom ${delta > 0 ? 'in' : 'out'} to ${Math.round(newZoom * 100)}%`);
          }
          return newZoom;
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top;

    const startTime = Math.floor(x / effectiveGridWidth);
    let pitch = 71 - Math.floor(y / PIANO_KEY_HEIGHT);

    // Apply snap to scale if enabled
    if (snapToScale) {
      pitch = snapPitchToScale(pitch);
    }

    const noteName = getNoteNameFromPitch(pitch);

    // Handle different tools
    if (pianoRollTool === 'select') {
      // Click on empty space deselects
      deselectAllNotes();
      console.log('🎹 Piano Roll: Deselected all notes');
      return;
    }

    if (pianoRollTool === 'draw' || pianoRollTool === 'paint') {
      console.log(`🎹 Piano Roll: Drawing note ${noteName} at step ${startTime}`, { pitch, tool: pianoRollTool, snapToScale });
      addMidiNote({
        pitch: Math.max(36, Math.min(71, pitch)),
        startTime,
        duration: 4, // Default 1 beat
        velocity: 0.8,
      });
    } else if (pianoRollTool === 'paintDrum') {
      // Paint Drum mode: toggle note at position
      const existingNote = midiNotes.find(n =>
        n.startTime === startTime && n.pitch === Math.max(36, Math.min(71, pitch))
      );
      if (existingNote) {
        console.log(`🎹 Piano Roll: Removing drum note ${noteName} at step ${startTime}`);
        deleteMidiNote(existingNote.id);
      } else {
        console.log(`🎹 Piano Roll: Adding drum note ${noteName} at step ${startTime}`, { snapToScale });
        addMidiNote({
          pitch: Math.max(36, Math.min(71, pitch)),
          startTime,
          duration: 1, // Short duration for drums
          velocity: 0.8,
        });
      }
    } else if (pianoRollTool === 'chord') {
      // Chord Stamp Tool: stamp a chord at the clicked position
      const chordDef = CHORD_TYPES[selectedChordType];
      if (chordDef) {
        console.log(`🎹 Piano Roll: Stamping ${chordDef.name} chord at ${noteName}, step ${startTime}`, {
          intervals: chordDef.intervals,
          snapToScale
        });

        // Create notes for each interval in the chord
        chordDef.intervals.forEach((interval) => {
          let notePitch = pitch + interval;

          // Apply snap to scale to chord notes if enabled
          if (snapToScale) {
            notePitch = snapPitchToScale(notePitch);
          }

          // Clamp pitch to valid range
          notePitch = Math.max(36, Math.min(71, notePitch));

          addMidiNote({
            pitch: notePitch,
            startTime,
            duration: 4, // Default 1 beat for chord notes
            velocity: 0.8,
          });
        });

        console.log(`✅ Stamped ${chordDef.name} chord with ${chordDef.intervals.length} notes`);
      }
    }
  };

  // Helper to get note name from MIDI pitch
  const getNoteNameFromPitch = (pitch: number): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(pitch / 12) - 1;
    const noteName = noteNames[pitch % 12];
    return `${noteName}${octave}`;
  };

  // Handle mouse down for selection box
  const handleGridMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pianoRollTool === 'select' && e.button === 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const y = e.clientY - rect.top;
      setIsSelecting(true);
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
    } else if ((pianoRollTool === 'paint' || pianoRollTool === 'paintDrum') && e.button === 0) {
      setIsPainting(true);
      lastPaintedStepRef.current = null;
    }
  };

  // Handle mouse move for selection box and paint
  const handleGridMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top;

    if (isSelecting && selectionStart) {
      setSelectionEnd({ x, y });
    } else if (isPainting) {
      const startTime = Math.floor(x / effectiveGridWidth);
      let pitch = 71 - Math.floor(y / PIANO_KEY_HEIGHT);

      // Apply snap to scale if enabled
      if (snapToScale) {
        pitch = snapPitchToScale(pitch);
      }

      // Only paint if we moved to a new step
      if (lastPaintedStepRef.current !== startTime) {
        lastPaintedStepRef.current = startTime;

        if (pianoRollTool === 'paint') {
          addMidiNote({
            pitch: Math.max(36, Math.min(71, pitch)),
            startTime,
            duration: 4,
            velocity: 0.8,
          });
        } else if (pianoRollTool === 'paintDrum') {
          const existingNote = midiNotes.find(n =>
            n.startTime === startTime && n.pitch === Math.max(36, Math.min(71, pitch))
          );
          if (!existingNote) {
            addMidiNote({
              pitch: Math.max(36, Math.min(71, pitch)),
              startTime,
              duration: 1,
              velocity: 0.8,
            });
          }
        }
      }
    }
  };

  // Handle mouse up for selection box
  const handleGridMouseUp = () => {
    if (isSelecting && selectionStart && selectionEnd) {
      // Convert pixel positions to time/pitch
      const startTime = Math.floor(Math.min(selectionStart.x, selectionEnd.x) / effectiveGridWidth);
      const endTime = Math.ceil(Math.max(selectionStart.x, selectionEnd.x) / effectiveGridWidth);
      const startPitch = 71 - Math.floor(Math.max(selectionStart.y, selectionEnd.y) / PIANO_KEY_HEIGHT);
      const endPitch = 71 - Math.floor(Math.min(selectionStart.y, selectionEnd.y) / PIANO_KEY_HEIGHT);

      selectNotesInRange(startTime, endTime, startPitch, endPitch);
    }
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsPainting(false);
    lastPaintedStepRef.current = null;
  };

  // Handle note click based on tool
  const handleNoteClick = (noteId: string, e: React.MouseEvent) => {
    if (pianoRollTool === 'mute') {
      toggleNoteMute(noteId);
    } else if (pianoRollTool === 'select') {
      if (e.ctrlKey || e.metaKey) {
        toggleNoteSelection(noteId);
      } else {
        selectNote(noteId);
      }
    }
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

      const startTime = Math.floor(x / effectiveGridWidth);
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

  const totalWidth = totalSteps * effectiveGridWidth;

  return (
    <div className="piano-roll h-full flex flex-col bg-[#1a1a1a] overflow-hidden">
      {/* Header - FL Studio Style */}
      <div className="flex items-center justify-between px-3 border-b border-gray-600 bg-[#2a2a2a] flex-shrink-0" style={{ height: '32px' }}>
        <div className="flex items-center gap-4">
          {/* Pattern Name Badge */}
          <div className="flex items-center gap-2">
            <Music size={12} className="text-gray-500" />
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{ backgroundColor: patternColor, color: '#fff' }}
            >
              {patternName}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-gray-600" />

          {/* Tools Toolbar - FL Studio Style */}
          <div className="flex items-center gap-0.5">
            {(Object.entries(TOOL_CONFIG) as [PianoRollTool, typeof TOOL_CONFIG[PianoRollTool]][]).map(([tool, config]) => (
              <button
                key={tool}
                onClick={() => setPianoRollTool(tool)}
                title={`${config.label} (${config.shortcut})`}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                  pianoRollTool === tool
                    ? `bg-[#444] ${config.color} ring-1 ring-white/30`
                    : 'text-gray-400 hover:bg-[#333] hover:text-white'
                }`}
              >
                {config.icon}
                <span className="hidden sm:inline">{config.label}</span>
              </button>
            ))}
          </div>

          {/* Chord Type Selector - visible when chord tool is active */}
          {pianoRollTool === 'chord' && (
            <div className="flex items-center gap-1 ml-1">
              <select
                value={selectedChordType}
                onChange={(e) => setSelectedChordType(e.target.value)}
                className="bg-[#2a2a2a] border border-pink-400/50 rounded text-[9px] text-pink-300 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-pink-400"
              >
                <optgroup label="Basic">
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                  <option value="dim">Dim</option>
                  <option value="aug">Aug</option>
                  <option value="sus2">Sus2</option>
                  <option value="sus4">Sus4</option>
                  <option value="power">Power</option>
                </optgroup>
                <optgroup label="7th Chords">
                  <option value="maj7">Maj7</option>
                  <option value="min7">Min7</option>
                  <option value="dom7">Dom7</option>
                  <option value="dim7">Dim7</option>
                  <option value="aug7">Aug7</option>
                </optgroup>
                <optgroup label="Extended">
                  <option value="maj9">Maj9</option>
                  <option value="min9">Min9</option>
                  <option value="dom9">Dom9</option>
                  <option value="add9">Add9</option>
                </optgroup>
                <optgroup label="6th Chords">
                  <option value="6">6</option>
                  <option value="min6">Min6</option>
                </optgroup>
              </select>
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-4 bg-gray-600" />

          {/* Ghost Notes Toggle */}
          <button
            onClick={toggleGhostNotes}
            title="Toggle Ghost Notes (Alt+V)"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium transition-all ${
              showGhostNotes
                ? 'bg-[#444] text-gray-200 ring-1 ring-white/30'
                : 'text-gray-500 hover:bg-[#333] hover:text-gray-300'
            }`}
          >
            <span className="opacity-50">👻</span>
            <span className="hidden sm:inline">Ghost</span>
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-gray-600" />

          {/* Snap to Scale Controls */}
          <button
            onClick={toggleSnapToScale}
            title="Toggle Snap to Scale"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium transition-all ${
              snapToScale
                ? 'bg-purple-500/30 text-purple-300 ring-1 ring-purple-400/50'
                : 'text-gray-500 hover:bg-[#333] hover:text-gray-300'
            }`}
          >
            <span className="opacity-80">🎼</span>
            <span className="hidden sm:inline">Scale</span>
          </button>

          {snapToScale && (
            <div className="flex items-center gap-1">
              {/* Root Note Selector */}
              <select
                value={scaleRootNote}
                onChange={(e) => setScaleRootNote(parseInt(e.target.value))}
                className="bg-[#2a2a2a] border border-gray-600 rounded text-[9px] text-gray-300 px-1 py-0.5"
              >
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((note, i) => (
                  <option key={note} value={i}>{note}</option>
                ))}
              </select>

              {/* Scale Type Selector */}
              <select
                value={selectedScale}
                onChange={(e) => setSelectedScale(e.target.value)}
                className="bg-[#2a2a2a] border border-gray-600 rounded text-[9px] text-gray-300 px-1 py-0.5"
              >
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
                <option value="Harmonic Minor">Harmonic Minor</option>
                <option value="Melodic Minor">Melodic Minor</option>
                <option value="Pentatonic Major">Pent Major</option>
                <option value="Pentatonic Minor">Pent Minor</option>
                <option value="Blues">Blues</option>
                <option value="Dorian">Dorian</option>
                <option value="Phrygian">Phrygian</option>
                <option value="Lydian">Lydian</option>
                <option value="Mixolydian">Mixolydian</option>
                <option value="Locrian">Locrian</option>
              </select>
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-4 bg-gray-600" />

          {/* Pattern Length Selector - FL Style */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-500 font-bold uppercase mr-1">Beats</span>
            {PATTERN_LENGTHS.map((beats) => (
              <button
                key={beats}
                onClick={() => setNumBars(beats / 4)}
                className={`w-6 h-5 text-[10px] font-bold rounded transition-all ${
                  totalBeats === beats
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#333] text-gray-400 hover:bg-[#444] hover:text-white border border-gray-600'
                }`}
              >
                {beats}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-gray-600" />

          {/* Zoom Controls - FL Studio Style */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const newZoom = Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP);
                setZoomLevel(newZoom);
                console.log(`🔍 Piano Roll: Zoom out to ${Math.round(newZoom * 100)}%`);
              }}
              disabled={zoomLevel <= ZOOM_MIN}
              title="Zoom Out (Ctrl+Mouse Wheel)"
              className={`p-1 rounded transition-all ${
                zoomLevel <= ZOOM_MIN
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:bg-[#333] hover:text-white'
              }`}
            >
              <ZoomOut size={12} />
            </button>
            <span className="text-[9px] text-gray-400 font-mono min-w-[35px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => {
                const newZoom = Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP);
                setZoomLevel(newZoom);
                console.log(`🔍 Piano Roll: Zoom in to ${Math.round(newZoom * 100)}%`);
              }}
              disabled={zoomLevel >= ZOOM_MAX}
              title="Zoom In (Ctrl+Mouse Wheel)"
              className={`p-1 rounded transition-all ${
                zoomLevel >= ZOOM_MAX
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:bg-[#333] hover:text-white'
              }`}
            >
              <ZoomIn size={12} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selection info */}
          {selectedNoteIds.length > 0 && (
            <span className="text-[9px] text-cyan-400 font-medium">
              {selectedNoteIds.length} selected
            </span>
          )}

          <button
            onClick={clearPattern}
            className="flex items-center gap-1 px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded text-[9px] font-bold text-white transition-all"
          >
            <Trash2 size={10} />
            Clear
          </button>
        </div>
      </div>

      {/* Piano Roll Grid with Timeline - Fills remaining space */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Timeline Ruler - FL Studio Style */}
        <div className="flex border-b border-gray-600 flex-shrink-0" style={{ height: '20px' }}>
          {/* Spacer for piano keys column - matches piano keys width */}
          <div className="flex-shrink-0 bg-[#2a2a2a] border-r border-gray-600 flex items-center justify-center" style={{ width: '50px' }}>
            <span className="text-[8px] text-gray-500 font-bold">BAR</span>
          </div>

          {/* Beat numbers ruler - extends across full width, scrolls with grid */}
          <div className="flex-1 overflow-hidden bg-[#2a2a2a]">
            <div
              className="flex h-full"
              style={{
                transform: `translateX(-${scrollLeft}px)`,
                minWidth: `${Math.max(totalSteps * effectiveGridWidth, 2000)}px`,
              }}
            >
              {/* Generate enough beats to fill extended grid (at least 32 beats worth) */}
              {Array.from({ length: Math.max(totalBeats, 32) }).map((_, beatIndex) => {
                const beatNumber = beatIndex + 1;
                const isBarStart = beatIndex % 4 === 0;
                const isWithinPattern = beatIndex < totalBeats;

                return (
                  <div
                    key={beatIndex}
                    className="flex items-center h-full flex-shrink-0"
                    style={{
                      width: `${4 * effectiveGridWidth}px`,
                      borderLeft: isBarStart
                        ? `2px solid ${isWithinPattern ? '#f97316' : 'rgba(249, 115, 22, 0.3)'}`
                        : `1px solid ${isWithinPattern ? '#444' : '#333'}`,
                      backgroundColor: isBarStart
                        ? (isWithinPattern ? '#333' : '#2a2a2a')
                        : '#2a2a2a',
                      paddingLeft: '4px',
                    }}
                  >
                    <span
                      className="font-mono"
                      style={{
                        fontSize: isBarStart ? '11px' : '9px',
                        color: isWithinPattern
                          ? (isBarStart ? '#f97316' : '#666')
                          : (isBarStart ? 'rgba(249, 115, 22, 0.4)' : '#444'),
                        fontWeight: isBarStart ? 'bold' : 'normal',
                      }}
                    >
                      {beatNumber}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Piano Keys + Grid - Fills remaining space */}
        <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
          {/* Piano Keys (left sidebar) - Matches ruler width exactly */}
          <div
            className="flex-shrink-0 bg-[#1a1a1a] border-r border-gray-600 overflow-y-auto overflow-x-hidden scrollbar-hide"
            style={{ width: '50px' }}
          >
            <div style={{ height: `${TOTAL_NOTES * PIANO_KEY_HEIGHT}px` }}>
              {Array.from({ length: TOTAL_NOTES }).map((_, index) => {
                const midiNote = 71 - index; // C5 (72) down to C2 (36)
                const { noteName, octave, isBlackKey } = getNoteInfo(midiNote);
                const isC = noteName === 'C';
                const inScale = snapToScale && isNoteInScale(midiNote);

                // Determine background color: scale notes get purple tint
                let bgColor = isBlackKey ? '#1a1a1a' : isC ? '#2a2a2a' : '#222';
                if (snapToScale) {
                  bgColor = inScale
                    ? (isBlackKey ? '#2d1f3d' : '#3d2f5d') // Purple tint for scale notes
                    : (isBlackKey ? '#151515' : '#1a1a1a'); // Dimmer for non-scale notes
                }

                return (
                  <div
                    key={index}
                    style={{
                      height: `${PIANO_KEY_HEIGHT}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '4px',
                      backgroundColor: bgColor,
                      borderBottom: '1px solid #333',
                      borderTop: isC ? '1px solid #555' : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        color: isC ? '#f97316' : '#555',
                        fontWeight: isC ? 'bold' : 'normal',
                      }}
                    >
                      {noteName}{octave}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Area - Fills entire space, scrollable when pattern is longer */}
          <div
            ref={containerRef}
            className="flex-1 relative overflow-auto bg-[#1a1a1a]"
            style={{ minWidth: 0, cursor: pianoRollTool === 'select' ? 'crosshair' : pianoRollTool === 'paint' ? 'cell' : 'default' }}
            onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
          >
            <div
              className={`relative ${isDragOver ? 'ring-2 ring-purple-500/50' : ''}`}
              style={{
                minWidth: '100%',
                width: `${Math.max(totalWidth, 2000)}px`, // Always extend grid, minimum 2000px
                height: `${TOTAL_NOTES * PIANO_KEY_HEIGHT}px`,
              }}
              onClick={handleGridClick}
              onMouseDown={handleGridMouseDown}
              onMouseMove={handleGridMouseMove}
              onMouseUp={handleGridMouseUp}
              onMouseLeave={handleGridMouseUp}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Horizontal grid lines (piano keys) - FL Studio style */}
              {Array.from({ length: TOTAL_NOTES }).map((_, index) => {
                const midiNote = 71 - index;
                const { noteName, isBlackKey } = getNoteInfo(midiNote);
                const isC = noteName === 'C';
                const inScale = snapToScale && isNoteInScale(midiNote);

                // Determine background color: scale notes get purple tint in grid too
                let gridBgColor = isBlackKey ? '#1a1a1a' : '#222';
                if (snapToScale) {
                  gridBgColor = inScale
                    ? (isBlackKey ? '#1f1a2d' : '#252030') // Subtle purple tint for scale notes
                    : (isBlackKey ? '#121212' : '#181818'); // Dimmer for non-scale notes
                }

                return (
                  <div
                    key={`h-${index}`}
                    className="absolute left-0 right-0"
                    style={{
                      top: `${index * PIANO_KEY_HEIGHT}px`,
                      height: `${PIANO_KEY_HEIGHT}px`,
                      backgroundColor: gridBgColor,
                      borderBottom: '1px solid #333',
                      borderTop: isC ? '1px solid #444' : 'none'
                    }}
                  />
                );
              })}

              {/* Vertical grid lines - extend across entire grid width */}
              {Array.from({ length: Math.ceil(2000 / effectiveGridWidth) + 1 }).map((_, index) => {
                const isBarLine = index % 16 === 0; // Every 4 beats (bar)
                const isBeatLine = index % 4 === 0; // Every beat
                const isWithinPattern = index < totalSteps;
                return (
                  <div
                    key={`v-${index}`}
                    className="absolute top-0 bottom-0"
                    style={{
                      left: `${index * effectiveGridWidth}px`,
                      borderLeft: isBarLine
                        ? `2px solid ${isWithinPattern ? 'rgba(249, 115, 22, 0.6)' : 'rgba(249, 115, 22, 0.2)'}`
                        : isBeatLine
                          ? `1px solid ${isWithinPattern ? '#444' : '#333'}`
                          : `1px solid ${isWithinPattern ? '#2a2a2a' : '#222'}`
                    }}
                  />
                );
              })}

              {/* Pattern boundary marker - shows where current pattern ends */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-10"
                style={{
                  left: `${totalWidth}px`,
                  width: '2px',
                  backgroundColor: '#f97316',
                  boxShadow: '0 0 8px rgba(249, 115, 22, 0.5)',
                }}
              />

              {/* Playback cursor */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-purple-500 pointer-events-none z-20 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                style={{ left: `${currentStep * effectiveGridWidth}px` }}
              />

              {/* Ghost Notes (notes from other channels) */}
              {showGhostNotes && getGhostNotes().map((note) => {
                // Find the track color for this ghost note
                const trackId = note.id.startsWith('ghost_') ? note.id.split('_')[1] : null;
                const track = trackId ? tracks.find(t => t.id === trackId) : null;
                return (
                  <GhostNoteBlock
                    key={note.id}
                    note={note}
                    gridWidth={effectiveGridWidth}
                    keyHeight={PIANO_KEY_HEIGHT}
                    color={track?.color || '#6b7280'}
                  />
                );
              })}

              {/* MIDI Notes */}
              {midiNotes.map((note) => (
                <NoteBlock
                  key={note.id}
                  note={note}
                  onUpdate={updateMidiNote}
                  onDelete={deleteMidiNote}
                  onClick={(e) => handleNoteClick(note.id, e)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingNoteId(note.id);
                    setPropertiesPanelPosition({ x: e.clientX, y: e.clientY });
                    console.log(`🎵 Opening note properties panel for ${note.id}`);
                  }}
                  gridWidth={effectiveGridWidth}
                  keyHeight={PIANO_KEY_HEIGHT}
                  isSelected={selectedNoteIds.includes(note.id)}
                  isMuted={mutedNoteIds.includes(note.id)}
                  activeTool={pianoRollTool}
                />
              ))}

              {/* Selection Box */}
              {isSelecting && selectionStart && selectionEnd && (
                <div
                  className="absolute border-2 border-cyan-400 bg-cyan-400/10 pointer-events-none z-40"
                  style={{
                    left: `${Math.min(selectionStart.x, selectionEnd.x)}px`,
                    top: `${Math.min(selectionStart.y, selectionEnd.y)}px`,
                    width: `${Math.abs(selectionEnd.x - selectionStart.x)}px`,
                    height: `${Math.abs(selectionEnd.y - selectionStart.y)}px`,
                  }}
                />
              )}

              {/* Drag Preview */}
              {isDragOver && dragPreview && (
                <div
                  className="absolute bg-purple-500/30 border-2 border-purple-500 rounded pointer-events-none z-30"
                  style={{
                    left: `${Math.floor(dragPreview.x / effectiveGridWidth) * effectiveGridWidth}px`,
                    top: `${(71 - Math.floor(dragPreview.y / PIANO_KEY_HEIGHT)) * PIANO_KEY_HEIGHT}px`,
                    width: `${4 * effectiveGridWidth}px`,
                    height: `${PIANO_KEY_HEIGHT}px`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Scrollbar indicator */}
        <div className="h-3 flex-shrink-0 bg-[#1a1a1a] border-t border-gray-800/50 flex items-center px-12">
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-600 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (containerRef.current?.clientWidth || 100) / totalWidth * 100)}%`,
                marginLeft: `${(scrollLeft / totalWidth) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Note Properties Panel (FL Studio style) */}
      {editingNote && (
        <NotePropertiesPanel
          note={editingNote}
          onUpdate={(updates) => {
            updateMidiNote(editingNote.id, updates);
          }}
          onClose={() => {
            setEditingNoteId(null);
            console.log('🎵 Closed note properties panel');
          }}
          position={propertiesPanelPosition}
        />
      )}
    </div>
  );
};

export default PianoRoll;

