'use client';

import React, { useState, useRef } from 'react';
import { useBeatStore, MidiNote } from '@/store/useBeatStore';
import { Music, Trash2, Copy, Save } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * TimelineView - Horizontal timeline showing recorded MIDI notes
 * 
 * Features:
 * - Horizontal layout (like Ableton/FL Studio)
 * - Shows notes as blocks on timeline
 * - Displays pattern name and duration
 * - Draggable to arrangement view
 * - Easy to understand workflow
 */

const GRID_WIDTH = 40; // Width of each 16th note
const TRACK_HEIGHT = 60; // Height of each track
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getNoteInfo = (midiNote: number) => {
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = NOTE_NAMES[midiNote % 12];
  return `${noteName}${octave}`;
};

export const TimelineView: React.FC = () => {
  const {
    midiNotes,
    patternLength,
    bpm,
    currentStep,
    isPlaying,
    deleteMidiNote,
    clearMidiNotes,
    savePattern,
  } = useBeatStore();

  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [patternName, setPatternName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Group notes by pitch for display
  const notesByPitch = midiNotes.reduce((acc, note) => {
    if (!acc[note.pitch]) {
      acc[note.pitch] = [];
    }
    acc[note.pitch].push(note);
    return acc;
  }, {} as Record<number, MidiNote[]>);

  const pitches = Object.keys(notesByPitch).map(Number).sort((a, b) => b - a);
  const totalWidth = patternLength * GRID_WIDTH;
  const hasNotes = midiNotes.length > 0;

  const handleNoteClick = (noteId: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      setSelectedNotes(prev => {
        const next = new Set(prev);
        if (next.has(noteId)) {
          next.delete(noteId);
        } else {
          next.add(noteId);
        }
        return next;
      });
    } else {
      setSelectedNotes(new Set([noteId]));
    }
  };

  const handleDeleteSelected = () => {
    selectedNotes.forEach(noteId => deleteMidiNote(noteId));
    setSelectedNotes(new Set());
  };

  const handleClearAll = () => {
    if (confirm('Clear all notes?')) {
      clearMidiNotes();
      setSelectedNotes(new Set());
    }
  };

  const handleSavePattern = () => {
    if (!hasNotes) return;
    setShowSaveDialog(true);
    setPatternName(`Pattern ${new Date().toLocaleTimeString()}`);
  };

  const confirmSavePattern = () => {
    if (!patternName.trim()) {
      alert('Please enter a pattern name');
      return;
    }

    savePattern(patternName.trim(), 'piano');
    setShowSaveDialog(false);
    setPatternName('');

    // Show success message
    alert(`Pattern "${patternName}" saved! You can now drag it to the Arrangement view.`);
  };

  return (
    <div className="timeline-view h-full flex flex-col bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4)] border-2 border-gray-800/50">
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-800/50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
            <Music size={24} className="text-purple-400" />
            Pattern Timeline
          </h2>
          <p className="text-sm text-gray-400">
            {hasNotes ? `${midiNotes.length} notes recorded` : 'No notes recorded yet'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasNotes && (
            <button
              onClick={handleSavePattern}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white transition-all shadow-lg"
            >
              <Save size={18} />
              Save as Pattern
            </button>
          )}
          {selectedNotes.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-white transition-all"
            >
              <Trash2 size={18} />
              Delete ({selectedNotes.size})
            </button>
          )}
          {hasNotes && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold text-white transition-all"
            >
              <Trash2 size={18} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto p-4" ref={containerRef}>
        {!hasNotes ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Music size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-bold mb-2">No notes recorded</p>
              <p className="text-sm">
                Press the <span className="text-red-400 font-bold">Record</span> button and play some notes!
              </p>
            </div>
          </div>
        ) : (
          <div className="relative" style={{ minWidth: totalWidth, minHeight: pitches.length * TRACK_HEIGHT }}>
            {/* Grid Background */}
            <div className="absolute inset-0">
              {/* Vertical lines (16th notes) */}
              {Array.from({ length: patternLength + 1 }).map((_, i) => (
                <div
                  key={`vline-${i}`}
                  className={`absolute top-0 bottom-0 ${
                    i % 16 === 0 ? 'border-l-2 border-purple-500/30' : // Bar line
                    i % 4 === 0 ? 'border-l border-gray-700' : // Beat line
                    'border-l border-gray-800/30' // 16th line
                  }`}
                  style={{ left: i * GRID_WIDTH }}
                >
                  {i % 4 === 0 && (
                    <div className="absolute -top-6 left-1 text-xs text-gray-500 font-mono">
                      {Math.floor(i / 4) + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Playhead */}
            {isPlaying && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] z-50 pointer-events-none"
                style={{ left: currentStep * GRID_WIDTH }}
              >
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-green-500 rounded-full shadow-lg" />
              </div>
            )}

            {/* Note Tracks */}
            {pitches.map((pitch, trackIndex) => (
              <div
                key={pitch}
                className="absolute left-0 right-0 border-b border-gray-800/30"
                style={{ top: trackIndex * TRACK_HEIGHT, height: TRACK_HEIGHT }}
              >
                {/* Track Label */}
                <div className="absolute -left-16 top-0 h-full flex items-center">
                  <div className="text-xs font-bold text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                    {getNoteInfo(pitch)}
                  </div>
                </div>

                {/* Notes on this track */}
                {notesByPitch[pitch].map(note => (
                  <motion.div
                    key={note.id}
                    onClick={(e) => handleNoteClick(note.id, e)}
                    className={`absolute top-2 bottom-2 rounded-lg cursor-pointer transition-all group ${
                      selectedNotes.has(note.id)
                        ? 'bg-purple-500 border-2 border-purple-300 shadow-lg'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-blue-400/50 hover:border-purple-400'
                    }`}
                    style={{
                      left: note.startTime * GRID_WIDTH,
                      width: note.duration * GRID_WIDTH,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="h-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {getNoteInfo(note.pitch)}
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Pattern Info */}
      {hasNotes && (
        <div className="p-4 border-t-2 border-gray-800/50 bg-gray-900/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-gray-400">Duration:</span>
                <span className="ml-2 font-bold text-gray-200">
                  {Math.max(...midiNotes.map(n => n.startTime + n.duration))} steps
                </span>
              </div>
              <div>
                <span className="text-gray-400">BPM:</span>
                <span className="ml-2 font-bold text-gray-200">{bpm}</span>
              </div>
              <div>
                <span className="text-gray-400">Notes:</span>
                <span className="ml-2 font-bold text-gray-200">{midiNotes.length}</span>
              </div>
            </div>
            <div className="text-gray-500 text-xs">
              💡 Tip: Shift+Click to select multiple notes
            </div>
          </div>
        </div>
      )}

      {/* Save Pattern Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 shadow-2xl border-2 border-purple-500/50 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Save size={24} className="text-green-400" />
              Save Pattern
            </h3>
            <p className="text-gray-400 mb-6">
              Give your pattern a name so you can use it in the Arrangement view.
            </p>

            <input
              type="text"
              value={patternName}
              onChange={(e) => setPatternName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmSavePattern()}
              placeholder="Enter pattern name..."
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-purple-500 outline-none mb-6"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={confirmSavePattern}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white transition-all"
              >
                Save Pattern
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineView;

