'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useBeatStore, Sample } from '@/store/useBeatStore';
import { motion } from 'framer-motion';
import * as Tone from 'tone';

// Piano keyboard with 2 octaves (24 keys)
const PIANO_KEYS = [
  // Octave 1
  { note: 'C2', type: 'white', key: 'A', semitone: 0 },
  { note: 'C#2', type: 'black', key: 'W', semitone: 1 },
  { note: 'D2', type: 'white', key: 'S', semitone: 2 },
  { note: 'D#2', type: 'black', key: 'E', semitone: 3 },
  { note: 'E2', type: 'white', key: 'D', semitone: 4 },
  { note: 'F2', type: 'white', key: 'F', semitone: 5 },
  { note: 'F#2', type: 'black', key: 'T', semitone: 6 },
  { note: 'G2', type: 'white', key: 'G', semitone: 7 },
  { note: 'G#2', type: 'black', key: 'Y', semitone: 8 },
  { note: 'A2', type: 'white', key: 'H', semitone: 9 },
  { note: 'A#2', type: 'black', key: 'U', semitone: 10 },
  { note: 'B2', type: 'white', key: 'J', semitone: 11 },
  // Octave 2
  { note: 'C3', type: 'white', key: 'K', semitone: 12 },
  { note: 'C#3', type: 'black', key: 'O', semitone: 13 },
  { note: 'D3', type: 'white', key: 'L', semitone: 14 },
  { note: 'D#3', type: 'black', key: 'P', semitone: 15 },
  { note: 'E3', type: 'white', key: ';', semitone: 16 },
  { note: 'F3', type: 'white', key: '\'', semitone: 17 },
  { note: 'F#3', type: 'black', key: ']', semitone: 18 },
  { note: 'G3', type: 'white', key: 'Z', semitone: 19 },
  { note: 'G#3', type: 'black', key: 'X', semitone: 20 },
  { note: 'A3', type: 'white', key: 'C', semitone: 21 },
  { note: 'A#3', type: 'black', key: 'V', semitone: 22 },
  { note: 'B3', type: 'white', key: 'B', semitone: 23 },
];

// Calculate playback rate for chromatic pitch shifting
// Each semitone is 2^(1/12) ratio
const semitoneToPlaybackRate = (semitone: number, rootSemitone: number = 0): number => {
  return Math.pow(2, (semitone - rootSemitone) / 12);
};

const PianoKeyboard: React.FC = () => {
  const {
    pads,
    padMode,
    assignSampleToPad,
    // Track system
    addTrack,
    isRecording,
    isPlaying,
    isCountingIn,
  } = useBeatStore();
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [isDragOverKeyboard, setIsDragOverKeyboard] = useState(false);

  // Chromatic sampler state
  const [loadedSample, setLoadedSample] = useState<Sample | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const bufferRef = useRef<Tone.ToneAudioBuffer | null>(null);
  // Track active players per note for polyphonic playback (like a real piano)
  const activePlayersRef = useRef<Map<string, Tone.Player>>(new Map());

  // Track ID for the current recording session
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Dispose all active players
      activePlayersRef.current.forEach(player => {
        player.stop();
        player.dispose();
      });
      activePlayersRef.current.clear();
    };
  }, []);

  // 🎹 AUTO-CREATE TRACK: When recording starts with a loaded sample, create instrument track
  useEffect(() => {
    // Only create track if:
    // 1. We have a loaded sample
    // 2. Recording is active
    // 3. Not counting in
    // 4. We haven't created a track yet for this recording session
    if (loadedSample && isRecording && !isCountingIn && !currentTrackId) {
      const trackId = addTrack('instrument', loadedSample);
      setCurrentTrackId(trackId);
      console.log('✅ Created instrument track for piano recording:', trackId, loadedSample.name);
    }

    // Reset track ID when recording stops
    if (!isRecording && currentTrackId) {
      setCurrentTrackId(null);
      console.log('🛑 Recording stopped, reset track ID');
    }
  }, [loadedSample, isRecording, isCountingIn, currentTrackId, addTrack]);

  // Play note with chromatic pitch shifting (polyphonic - like a real piano)
  const playNote = useCallback(async (note: string) => {
    const pianoKey = PIANO_KEYS.find(k => k.note === note);
    if (!pianoKey) return;

    // Ensure audio context is started (required for first user interaction)
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }

    // Trigger recording engine if recording
    const recordingEngine = (window as any).recordingEngine;
    if (recordingEngine) {
      // Convert note to MIDI pitch (C2 = 24, C3 = 36, etc.)
      const basePitch = 24; // C2
      const midiPitch = basePitch + pianoKey.semitone;
      recordingEngine.handleNoteOn(midiPitch, 0.8);
    }

    // If we have a loaded sample, use chromatic playback
    if (loadedSample && bufferRef.current && bufferRef.current.loaded) {
      // Stop any existing player for this specific note (re-trigger)
      const existingPlayer = activePlayersRef.current.get(note);
      if (existingPlayer) {
        existingPlayer.stop();
        existingPlayer.dispose();
        activePlayersRef.current.delete(note);
      }

      // Create new player with pitch-shifted playback rate
      // Root note is C2 (semitone 0), so we shift relative to that
      const playbackRate = semitoneToPlaybackRate(pianoKey.semitone, 0);

      const player = new Tone.Player(bufferRef.current).toDestination();
      player.playbackRate = playbackRate;

      // Store the player so we can stop it on key release
      activePlayersRef.current.set(note, player);

      player.start();
      return;
    }

    // Fallback to pad-based playback
    const padIndex = pads.findIndex(pad => pad.note === note);
    if (padIndex !== -1) {
      const pad = pads[padIndex];
      if (pad.sample && !pad.muted) {
        if (pad.player) {
          pad.player.start();
        } else if (pad.synth) {
          pad.synth.triggerAttackRelease(note, '8n');
        }
      }
    }
  }, [loadedSample, pads]);

  // Stop note on key release (for sustain behavior like a real piano)
  const stopNote = useCallback((note: string) => {
    const pianoKey = PIANO_KEYS.find(k => k.note === note);

    // Trigger recording engine if recording
    const recordingEngine = (window as any).recordingEngine;
    if (recordingEngine && pianoKey) {
      const basePitch = 24; // C2
      const midiPitch = basePitch + pianoKey.semitone;
      recordingEngine.handleNoteOff(midiPitch);
    }

    const player = activePlayersRef.current.get(note);
    if (player) {
      // Fade out quickly for natural release
      player.volume.rampTo(-Infinity, 0.1);
      setTimeout(() => {
        player.stop();
        player.dispose();
        activePlayersRef.current.delete(note);
      }, 150);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toUpperCase();
    const pianoKey = PIANO_KEYS.find(k => k.key === key);

    if (pianoKey && !activeKeys.has(pianoKey.note)) {
      setActiveKeys(prev => new Set(prev).add(pianoKey.note));
      playNote(pianoKey.note);
    }
  }, [activeKeys, playNote]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toUpperCase();
    const pianoKey = PIANO_KEYS.find(k => k.key === key);

    if (pianoKey) {
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(pianoKey.note);
        return newSet;
      });
      // Stop the note on key release (piano sustain behavior)
      stopNote(pianoKey.note);
    }
  }, [stopNote]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleMouseDown = (note: string) => {
    setActiveKeys(prev => new Set(prev).add(note));
    playNote(note);
  };

  const handleMouseUp = (note: string) => {
    setActiveKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });
    // Stop the note on mouse release (piano sustain behavior)
    stopNote(note);
  };

  // Keyboard-wide drop zone handlers
  const handleKeyboardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOverKeyboard(true);
  };

  const handleKeyboardDragLeave = (e: React.DragEvent) => {
    // Only set to false if we're leaving the keyboard container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOverKeyboard(false);
    }
  };

  const handleKeyboardDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverKeyboard(false);
    setDragOverKey(null);

    try {
      const sampleData = e.dataTransfer.getData('application/json');
      if (!sampleData) return;

      const sample: Sample = JSON.parse(sampleData);

      // Only load audio samples (not synths)
      if (sample.type !== 'audio' || !sample.url) {
        console.warn('Only audio samples can be loaded into the chromatic keyboard');
        return;
      }

      setIsLoading(true);

      // Dispose old buffer and all active players
      if (bufferRef.current) {
        bufferRef.current.dispose();
        bufferRef.current = null;
      }

      // Dispose all active players
      activePlayersRef.current.forEach(player => {
        player.stop();
        player.dispose();
      });
      activePlayersRef.current.clear();

      // Load the sample buffer
      bufferRef.current = new Tone.ToneAudioBuffer(sample.url, () => {
        setLoadedSample(sample);
        setIsLoading(false);
      }, (error) => {
        console.error('Error loading sample:', error);
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error handling drop:', error);
      setIsLoading(false);
    }
  };

  // Individual key drag handlers (for visual feedback)
  const handleDragOver = (e: React.DragEvent, note: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverKey(note);
  };

  const handleDragLeave = () => {
    setDragOverKey(null);
  };

  // Clear loaded sample
  const clearSample = () => {
    // Dispose buffer
    if (bufferRef.current) {
      bufferRef.current.dispose();
      bufferRef.current = null;
    }

    // Dispose all active players
    activePlayersRef.current.forEach(player => {
      player.stop();
      player.dispose();
    });
    activePlayersRef.current.clear();

    setLoadedSample(null);
  };

  // Count white keys for flex calculation
  const whiteKeyCount = PIANO_KEYS.filter(k => k.type === 'white').length;

  return (
    <div
      className={`piano-keyboard h-full w-full p-2 bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4)] border-2 transition-all duration-200 flex flex-col ${
        isDragOverKeyboard
          ? 'border-purple-500 ring-2 ring-purple-500/50'
          : loadedSample
            ? 'border-green-600/50'
            : 'border-gray-800/50'
      }`}
      onDragOver={handleKeyboardDragOver}
      onDragLeave={handleKeyboardDragLeave}
      onDrop={handleKeyboardDrop}
    >
      {/* Loaded sample indicator */}
      {(loadedSample || isLoading) && (
        <div className="mb-2 flex items-center justify-between bg-gradient-to-r from-green-900/30 to-green-800/20 rounded-lg px-3 py-1.5 border border-green-600/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">
              {isLoading ? 'Loading...' : `🎹 ${loadedSample?.name}`}
            </span>
          </div>
          {loadedSample && (
            <button
              onClick={clearSample}
              className="text-gray-400 hover:text-red-400 text-[10px] px-1.5 py-0.5 rounded hover:bg-red-900/20 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Drag overlay hint */}
      {isDragOverKeyboard && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-900/40 rounded-xl z-50 pointer-events-none">
          <div className="text-purple-200 text-sm font-bold">
            Drop sample for chromatic playback
          </div>
        </div>
      )}

      {/* Piano keys container - fills available space */}
      <div className="flex-1 flex relative min-h-0" style={{ minHeight: '180px' }}>
        {PIANO_KEYS.map((pianoKey, index) => {
          const isActive = activeKeys.has(pianoKey.note);
          const isWhite = pianoKey.type === 'white';
          const isDragOver = dragOverKey === pianoKey.note;
          const hasSample = !!loadedSample;

          // Calculate position for black keys (they overlap white keys)
          // Black keys are positioned at specific offsets relative to white keys
          const whiteKeyIndex = PIANO_KEYS.slice(0, index).filter(k => k.type === 'white').length;
          const blackKeyOffset = isWhite ? 0 : `calc(${(whiteKeyIndex / whiteKeyCount) * 100}% - ${100 / whiteKeyCount / 3}%)`;

          return (
            <motion.button
              key={pianoKey.note}
              onMouseDown={() => handleMouseDown(pianoKey.note)}
              onMouseUp={() => handleMouseUp(pianoKey.note)}
              onMouseLeave={() => handleMouseUp(pianoKey.note)}
              onDragOver={(e) => handleDragOver(e, pianoKey.note)}
              onDragLeave={handleDragLeave}
              className={`
                ${isWhite
                  ? 'relative h-full z-0 flex-1 min-w-0'
                  : 'absolute h-[60%] z-10'}
                ${isDragOver ? 'ring-2 ring-purple-500 ring-inset' : ''}
                ${hasSample && isWhite ? 'ring-1 ring-green-500/30' : ''}
                ${isWhite
                  ? isActive
                    ? 'bg-gradient-to-b from-green-300 to-green-400 shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)]'
                    : isDragOver
                      ? 'bg-gradient-to-b from-purple-200 to-purple-300 shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.8)]'
                      : 'bg-gradient-to-b from-gray-100 to-gray-200 shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.8)]'
                  : isActive
                    ? 'bg-gradient-to-b from-green-700 to-green-800 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)]'
                    : isDragOver
                      ? 'bg-gradient-to-b from-purple-800 to-purple-900 shadow-[0_4px_8px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.1)]'
                      : 'bg-gradient-to-b from-gray-900 to-black shadow-[0_4px_8px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.1)]'
                }
                border ${isWhite ? 'border-gray-400/50' : 'border-black'}
                rounded-b-md
                flex flex-col items-center justify-end pb-2
                transition-all duration-75
                ${isWhite ? 'hover:bg-gradient-to-b hover:from-gray-200 hover:to-gray-300' : 'hover:bg-gradient-to-b hover:from-gray-800 hover:to-gray-900'}
                active:scale-[0.98]
              `}
              style={isWhite ? {} : {
                left: blackKeyOffset,
                width: `calc(${100 / whiteKeyCount}% * 0.6)`,
                top: 0
              }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={`text-[9px] font-bold ${isWhite ? 'text-gray-600' : 'text-gray-400'}`}>
                {pianoKey.key}
              </span>
              <span className={`text-[8px] ${isWhite ? 'text-gray-500' : 'text-gray-500'}`}>
                {pianoKey.note}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-2 text-center text-gray-400 text-xs">
        {loadedSample ? (
          <>
            <p className="text-green-400">Playing: <span className="font-medium">{loadedSample.name}</span> chromatically</p>
            <p className="text-[10px] mt-0.5 text-gray-500">Play chords! Notes sustain until you release the key</p>
          </>
        ) : (
          <>
            <p>Drop a sample here for chromatic playback</p>
            <p className="text-[10px] mt-0.5">Or use keyboard to play mapped pads (A-B keys)</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PianoKeyboard;

