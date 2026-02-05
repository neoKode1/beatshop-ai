'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useBeatStore, Sample } from '@/store/useBeatStore';
import { motion } from 'framer-motion';
import { getTrackTypeFromSample } from '@/hooks/useDragDrop';
import {
  RotateCcw, RotateCw, Grid, Shuffle, Trash2,
  ChevronRight, ArrowLeftRight
} from 'lucide-react';
import WaveformPreview from './WaveformPreview';

// Context menu for pad step operations
interface PadContextMenuProps {
  padIndex: number;
  position: { x: number; y: number };
  onClose: () => void;
}

const PadContextMenu: React.FC<PadContextMenuProps> = ({ padIndex, position, onClose }) => {
  const {
    fillSteps, fillAllSteps, clearPadSteps,
    rotateSteps, reverseSteps, randomizeSteps
  } = useBeatStore();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuItems = [
    { label: 'Fill Every Beat', icon: <Grid size={12} />, action: () => { fillSteps(padIndex, 4); console.log(`🥁 Pad ${padIndex + 1}: Filled every beat (interval: 4)`); } },
    { label: 'Fill Every 2 Beats', icon: <Grid size={12} />, action: () => { fillSteps(padIndex, 8); console.log(`🥁 Pad ${padIndex + 1}: Filled every 2 beats (interval: 8)`); } },
    { label: 'Fill Every Step', icon: <Grid size={12} />, action: () => { fillAllSteps(padIndex); console.log(`🥁 Pad ${padIndex + 1}: Filled all steps`); } },
    { label: 'Fill 1/8 Notes', icon: <Grid size={12} />, action: () => { fillSteps(padIndex, 2); console.log(`🥁 Pad ${padIndex + 1}: Filled 1/8 notes (interval: 2)`); } },
    { divider: true },
    { label: 'Rotate Left', icon: <RotateCcw size={12} />, action: () => { rotateSteps(padIndex, -1); console.log(`🔄 Pad ${padIndex + 1}: Rotated left by 1 step`); } },
    { label: 'Rotate Right', icon: <RotateCw size={12} />, action: () => { rotateSteps(padIndex, 1); console.log(`🔄 Pad ${padIndex + 1}: Rotated right by 1 step`); } },
    { label: 'Rotate Left 4', icon: <RotateCcw size={12} />, action: () => { rotateSteps(padIndex, -4); console.log(`🔄 Pad ${padIndex + 1}: Rotated left by 4 steps (1 beat)`); } },
    { label: 'Rotate Right 4', icon: <RotateCw size={12} />, action: () => { rotateSteps(padIndex, 4); console.log(`🔄 Pad ${padIndex + 1}: Rotated right by 4 steps (1 beat)`); } },
    { divider: true },
    { label: 'Reverse', icon: <ArrowLeftRight size={12} />, action: () => { reverseSteps(padIndex); console.log(`🔀 Pad ${padIndex + 1}: Steps reversed`); } },
    { label: 'Randomize 25%', icon: <Shuffle size={12} />, action: () => { randomizeSteps(padIndex, 0.25); console.log(`🎲 Pad ${padIndex + 1}: Randomized at 25% density`); } },
    { label: 'Randomize 50%', icon: <Shuffle size={12} />, action: () => { randomizeSteps(padIndex, 0.5); console.log(`🎲 Pad ${padIndex + 1}: Randomized at 50% density`); } },
    { divider: true },
    { label: 'Clear Steps', icon: <Trash2 size={12} />, action: () => { clearPadSteps(padIndex); console.log(`🗑️ Pad ${padIndex + 1}: All steps cleared`); }, danger: true },
  ];
  // Note: Per-step probability and microtiming are set via the StepPropertiesPanel (right-click on individual step)

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-xl py-1 min-w-[160px]"
      style={{ left: position.x, top: position.y }}
    >
      <div className="px-3 py-1.5 text-[10px] text-gray-400 font-bold uppercase border-b border-gray-700">
        Pad {padIndex + 1} Steps
      </div>
      {menuItems.map((item, idx) =>
        item.divider ? (
          <div key={idx} className="border-t border-gray-700 my-1" />
        ) : (
          <button
            key={idx}
            onClick={() => { item.action?.(); onClose(); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors ${
              item.danger
                ? 'text-red-400 hover:bg-red-500/20'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        )
      )}
    </div>
  );
};

const PadGrid: React.FC = () => {
  const {
    // Track system (new)
    tracks,
    addTrack,
    triggerTrack,
    addStepToTrack,
    setSelectedTrackId,
    // Legacy pads (for backward compatibility)
    pads,
    triggerPad,
    assignSampleToPad,
    padMode,
    setSelectedPadIndex,
    selectedPadIndex,
    isRecording,
    isCountingIn,
    isPlaying,
    currentStep,
    toggleStep,
    // MPC features
    noteRepeatEnabled,
    noteRepeatRate,
    latchEnabled,
    padMuteMode,
    togglePadMute,
    eraseMode,
    getEffectiveVelocity,
    bpm,
    sixteenLevelEnabled,
    sixteenLevelPadIndex,
    toggle16Level,
    // Score Logger
    addNoteToScoreLog,
  } = useBeatStore();
  const [activePads, setActivePads] = useState<Set<number>>(new Set());
  const [dragOverPad, setDragOverPad] = useState<number | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ padIndex: number; position: { x: number; y: number } } | null>(null);

  // Note repeat state
  const [heldPads, setHeldPads] = useState<Set<number>>(new Set());
  const noteRepeatTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const latchedPads = useRef<Set<number>>(new Set());

  // Map pad indices to track IDs for the track system
  const [padToTrackMap, setPadToTrackMap] = useState<Map<number, string>>(new Map());

  // Handle right-click on pad
  const handlePadContextMenu = useCallback((e: React.MouseEvent, padIndex: number) => {
    e.preventDefault();
    setContextMenu({ padIndex, position: { x: e.clientX, y: e.clientY } });
  }, []);

  // Convert note repeat rate to milliseconds
  const getNoteRepeatIntervalMs = useCallback((): number => {
    const beatDurationMs = (60 / bpm) * 1000;
    const rateMap: Record<string, number> = {
      '1/4': beatDurationMs,
      '1/8': beatDurationMs / 2,
      '1/16': beatDurationMs / 4,
      '1/32': beatDurationMs / 8,
      '1/4T': beatDurationMs * (2/3),
      '1/8T': (beatDurationMs / 2) * (2/3),
      '1/16T': (beatDurationMs / 4) * (2/3),
      '1/32T': (beatDurationMs / 8) * (2/3),
    };
    return rateMap[noteRepeatRate] || beatDurationMs / 4;
  }, [bpm, noteRepeatRate]);

  // Trigger a pad with proper velocity
  const triggerPadWithVelocity = useCallback((padIndex: number) => {
    const velocity = getEffectiveVelocity(padIndex, 100);
    const trackId = padToTrackMap.get(padIndex);

    // Get pad pitch for score logger (convert pad index to MIDI note)
    const basePitch = 36 + padIndex; // C2 = 36, typical drum pad start
    const msPerBeat = 60000 / bpm;
    const sixteenthDuration = msPerBeat / 4; // Duration of a 16th note in ms

    if (trackId) {
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        triggerTrack(trackId, undefined, velocity / 127);
        if (isRecording && isPlaying && !isCountingIn && track.type === 'drum') {
          addStepToTrack(trackId, currentStep, velocity / 127);
        }
      }
    } else {
      triggerPad(padIndex, velocity / 127);
      if (isRecording && isPlaying && !isCountingIn) {
        toggleStep(padIndex, currentStep);
      }
    }

    // 📝 Score Logger: Always add pad hits to 3-minute buffer (FL Studio behavior)
    addNoteToScoreLog({
      pitch: basePitch,
      velocity: velocity / 127,
      startTime: Date.now(),
      duration: sixteenthDuration, // Drum hits are typically 1 16th note
    });
    console.log(`📝 Score Logger: Pad ${padIndex + 1} added to buffer (pitch: ${basePitch})`);

    // Visual feedback
    setActivePads(prev => new Set(prev).add(padIndex));
    setTimeout(() => {
      setActivePads(prev => {
        const next = new Set(prev);
        next.delete(padIndex);
        return next;
      });
    }, 100);
  }, [getEffectiveVelocity, padToTrackMap, tracks, triggerTrack, triggerPad, isRecording, isPlaying, isCountingIn, addStepToTrack, currentStep, toggleStep, bpm, addNoteToScoreLog]);

  // Start note repeat for a pad
  const startNoteRepeat = useCallback((padIndex: number) => {
    if (noteRepeatTimers.current.has(padIndex)) return;

    // Trigger immediately
    triggerPadWithVelocity(padIndex);

    // Set up repeating interval
    const intervalMs = getNoteRepeatIntervalMs();
    const timer = setInterval(() => {
      triggerPadWithVelocity(padIndex);
    }, intervalMs);

    noteRepeatTimers.current.set(padIndex, timer);
  }, [triggerPadWithVelocity, getNoteRepeatIntervalMs]);

  // Stop note repeat for a pad
  const stopNoteRepeat = useCallback((padIndex: number) => {
    const timer = noteRepeatTimers.current.get(padIndex);
    if (timer) {
      clearInterval(timer);
      noteRepeatTimers.current.delete(padIndex);
    }
  }, []);

  // Handle pad press (mouse down)
  const handlePadMouseDown = useCallback((padIndex: number) => {
    // PAD MUTE mode - toggle mute instead of trigger
    if (padMuteMode) {
      togglePadMute(padIndex);
      return;
    }

    // ERASE mode - erase the step instead of trigger
    if (eraseMode && isPlaying) {
      toggleStep(padIndex, currentStep);
      return;
    }

    // 16 LEVEL mode - select pad or trigger selected pad with velocity based on clicked pad
    if (sixteenLevelEnabled) {
      if (sixteenLevelPadIndex === null) {
        // First click selects the pad to use
        toggle16Level(padIndex);
      } else {
        // Subsequent clicks trigger the selected pad with velocity based on this pad's index
        // Pad 0 = lowest velocity, Pad 15 = highest velocity
        const velocity = ((padIndex + 1) / 16) * 127;
        const targetPadIndex = sixteenLevelPadIndex;

        const trackId = padToTrackMap.get(targetPadIndex);
        if (trackId) {
          triggerTrack(trackId, undefined, velocity / 127);
          if (isRecording && isPlaying && !isCountingIn) {
            addStepToTrack(trackId, currentStep, velocity / 127);
          }
        } else {
          triggerPad(targetPadIndex, velocity / 127);
          if (isRecording && isPlaying && !isCountingIn) {
            toggleStep(targetPadIndex, currentStep);
          }
        }

        // Visual feedback on clicked pad
        setActivePads(prev => new Set(prev).add(padIndex));
        setTimeout(() => {
          setActivePads(prev => {
            const next = new Set(prev);
            next.delete(padIndex);
            return next;
          });
        }, 100);
      }
      return;
    }

    setHeldPads(prev => new Set(prev).add(padIndex));
    setSelectedPadIndex(padIndex);

    if (noteRepeatEnabled) {
      if (latchEnabled) {
        // Toggle latch state
        if (latchedPads.current.has(padIndex)) {
          latchedPads.current.delete(padIndex);
          stopNoteRepeat(padIndex);
        } else {
          latchedPads.current.add(padIndex);
          startNoteRepeat(padIndex);
        }
      } else {
        startNoteRepeat(padIndex);
      }
    } else {
      triggerPadWithVelocity(padIndex);
    }
  }, [padMuteMode, togglePadMute, eraseMode, isPlaying, toggleStep, currentStep, setSelectedPadIndex, noteRepeatEnabled, latchEnabled, startNoteRepeat, stopNoteRepeat, triggerPadWithVelocity, sixteenLevelEnabled, sixteenLevelPadIndex, toggle16Level, padToTrackMap, triggerTrack, triggerPad, isRecording, isCountingIn, addStepToTrack]);

  // Handle pad release (mouse up)
  const handlePadMouseUp = useCallback((padIndex: number) => {
    setHeldPads(prev => {
      const next = new Set(prev);
      next.delete(padIndex);
      return next;
    });

    // Only stop if not latched
    if (!latchEnabled || !latchedPads.current.has(padIndex)) {
      stopNoteRepeat(padIndex);
    }
  }, [latchEnabled, stopNoteRepeat]);

  // Cleanup note repeat timers when disabled
  useEffect(() => {
    if (!noteRepeatEnabled) {
      noteRepeatTimers.current.forEach((timer) => clearInterval(timer));
      noteRepeatTimers.current.clear();
      latchedPads.current.clear();
    }
  }, [noteRepeatEnabled]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      noteRepeatTimers.current.forEach((timer) => clearInterval(timer));
    };
  }, []);

  // Legacy click handler (for backward compatibility)
  const handlePadClick = (padIndex: number) => {
    // Only handle if not using mousedown/up for note repeat
    if (!noteRepeatEnabled && !padMuteMode && !eraseMode) {
      // Check if this pad has a track
      const trackId = padToTrackMap.get(padIndex);

      if (trackId) {
        // TRACK SYSTEM: Trigger track
        const track = tracks.find(t => t.id === trackId);
        if (track) {
          triggerTrack(trackId);
          setSelectedTrackId(trackId);

          // 🎙️ LIVE RECORDING: If recording and playing (and NOT counting in), add hit to current step
          if (isRecording && isPlaying && !isCountingIn && track.type === 'drum') {
            addStepToTrack(trackId, currentStep, 0.8);
            console.log(`🔴 Recorded track ${trackId} at step ${currentStep + 1}`);
          }
        }
      } else {
        // LEGACY PAD SYSTEM: Trigger pad
        triggerPad(padIndex);
        setSelectedPadIndex(padIndex);

        // 🎙️ LIVE RECORDING: If recording and playing (and NOT counting in), add hit to current step
        if (isRecording && isPlaying && !isCountingIn) {
          toggleStep(padIndex, currentStep);
          console.log(`🔴 Recorded pad ${padIndex} at step ${currentStep + 1}`);
        }
      }

      // Visual feedback
      setActivePads(prev => new Set(prev).add(padIndex));
      setTimeout(() => {
        setActivePads(prev => {
          const next = new Set(prev);
          next.delete(padIndex);
          return next;
        });
      }, 150);
    }
  };

  // Unified drag handlers using pattern from useDragDrop hook
  const handleDragOver = useCallback((e: React.DragEvent, padIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverPad(padIndex);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPad(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, padIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPad(null);

    try {
      const sampleData = e.dataTransfer.getData('application/json');
      if (!sampleData) return;

      const sample: Sample = JSON.parse(sampleData);

      // 🎵 CREATE TRACK: Determine track type from sample category
      const trackType = getTrackTypeFromSample(sample);
      const trackId = addTrack(trackType, sample);

      // Map this pad index to the new track
      setPadToTrackMap(prev => new Map(prev).set(padIndex, trackId));

      console.log(`✅ Created ${trackType} track for pad ${padIndex}:`, trackId, sample.name);

      // Also assign to legacy pad system for backward compatibility
      assignSampleToPad(padIndex, sample);
    } catch (error) {
      console.error('Failed to parse sample data:', error);
    }
  }, [addTrack, assignSampleToPad]);

  // Keyboard mapping (Q-P for top row, A-; for second row, etc.)
  useEffect(() => {
    const keyMap: { [key: string]: number } = {
      'q': 0, 'w': 1, 'e': 2, 'r': 3,
      'a': 4, 's': 5, 'd': 6, 'f': 7,
      'z': 8, 'x': 9, 'c': 10, 'v': 11,
      't': 12, 'g': 13, 'b': 14, 'y': 15,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const padIndex = keyMap[e.key.toLowerCase()];
      if (padIndex !== undefined && !activePads.has(padIndex)) {
        handlePadClick(padIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePads]);

  const getPadColor = (padIndex: number) => {
    const pad = pads[padIndex];
    // Lighter gray pads on dark background
    if (!pad.sample) return 'bg-gradient-to-br from-gray-500 to-gray-600';

    // Subtle color tint when sample is loaded
    const categoryColors: { [key: string]: string } = {
      kick: 'bg-gradient-to-br from-red-600 to-red-700',
      snare: 'bg-gradient-to-br from-blue-600 to-blue-700',
      hihat: 'bg-gradient-to-br from-yellow-600 to-yellow-700',
      perc: 'bg-gradient-to-br from-green-600 to-green-700',
      bass: 'bg-gradient-to-br from-purple-600 to-purple-700',
      synth: 'bg-gradient-to-br from-pink-600 to-pink-700',
      fx: 'bg-gradient-to-br from-cyan-600 to-cyan-700',
      melodic: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
    };

    return categoryColors[pad.sample.category] || 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  const getPadActiveColor = (padIndex: number) => {
    const pad = pads[padIndex];
    if (!pad.sample) return 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-inner';

    // Brighter when active
    const categoryColors: { [key: string]: string } = {
      kick: 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50',
      snare: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50',
      hihat: 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/50',
      perc: 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50',
      bass: 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50',
      synth: 'bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg shadow-pink-500/50',
      fx: 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/50',
      melodic: 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/50',
    };

    return categoryColors[pad.sample.category] || 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-inner';
  };

  // MPC Studio pad border colors (matches the real hardware)
  const mpcPadBorderColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', // Row 4: red, orange, yellow, green
    '#ef4444', '#f97316', '#eab308', '#22c55e', // Row 3: red, orange, yellow, green
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', // Row 2: cyan, blue, purple, pink
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', // Row 1: cyan, blue, purple, pink
  ];

  // MPC function labels for each pad (like SAMPLER, LOOPER, etc.)
  const mpcPadLabels = [
    'TRACK VIEW', 'GRID', 'WAVE', 'LIST EDIT',
    'SAMPLE EDIT', 'PROG EDIT', 'PAD MIXER', 'CH MIXER',
    'NEXT SEQ', 'SONG', 'MIDI CTRL', 'MEDIA',
    'SAMPLER', 'LOOPER', 'STEP SEQ', 'SAVE',
  ];

  return (
    <div className="pad-grid w-full h-full">
      {/* Context menu for Fill Steps / Rotate Steps */}
      {contextMenu && (
        <PadContextMenu
          padIndex={contextMenu.padIndex}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}

      <div className="grid grid-cols-4 gap-2 w-full h-full p-3">
        {pads.map((pad, index) => {
          const borderColor = mpcPadBorderColors[index] || '#666';
          const funcLabel = mpcPadLabels[index];

          return (
            <motion.button
              key={pad.id}
              onClick={() => handlePadClick(index)}
              onContextMenu={(e) => handlePadContextMenu(e, index)}
              onMouseDown={() => handlePadMouseDown(index)}
              onMouseUp={() => handlePadMouseUp(index)}
              onMouseLeave={() => handlePadMouseUp(index)}
              onTouchStart={() => handlePadMouseDown(index)}
              onTouchEnd={() => handlePadMouseUp(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                relative rounded-md
                flex flex-col items-center justify-center
                transition-all duration-75
                ${activePads.has(index) || heldPads.has(index) ? 'scale-95' : 'hover:scale-[1.02]'}
                ${pad.muted ? 'opacity-40' : ''}
                ${pad.solo ? 'ring-2 ring-yellow-500' : ''}
                ${dragOverPad === index ? 'scale-[1.02]' : ''}
                ${latchedPads.current.has(index) ? 'ring-2 ring-orange-500' : ''}
              `}
              style={{
                background: activePads.has(index) || heldPads.has(index)
                  ? `linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 100%)`
                  : `linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)`,
                boxShadow: activePads.has(index) || heldPads.has(index)
                  ? `inset 0 2px 4px rgba(0,0,0,0.5), 0 0 15px ${borderColor}50`
                  : `0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
                border: `2px solid ${selectedPadIndex === index ? '#3b82f6' : borderColor}`,
              }}
              whileTap={{ scale: 0.92 }}
            >
              {/* 16 LEVEL mode indicator */}
              {sixteenLevelEnabled && (
                <div className="absolute top-1 left-1 right-1">
                  <div
                    className="h-1 bg-blue-500 rounded-full"
                    style={{ width: `${((index + 1) / 16) * 100}%` }}
                  />
                  <div className="text-[6px] text-blue-400 font-bold mt-0.5">
                    VEL {Math.round(((index + 1) / 16) * 127)}
                  </div>
                </div>
              )}
              {/* Pad number */}
              <div className={`text-[8px] font-bold ${sixteenLevelEnabled && sixteenLevelPadIndex === index ? 'text-blue-400' : 'text-gray-500'}`}>
                {sixteenLevelEnabled && sixteenLevelPadIndex === index ? '★ PAD' : 'PAD'} {index + 1}
              </div>
              {/* Sample name or Empty */}
              <div className="text-[10px] font-bold text-center px-1 text-white leading-tight mt-0.5">
                {pad.sample ? (
                  <span className="line-clamp-1">{pad.sample.name}</span>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>
              {/* Waveform Preview - shows when sample is loaded */}
              {pad.sample && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                  <WaveformPreview
                    sampleUrl={pad.sample.url}
                    color={borderColor}
                    width={56}
                    height={24}
                  />
                </div>
              )}
              {/* Function label below pad */}
              <div
                className="absolute -bottom-3 left-0 right-0 text-center"
                style={{ color: borderColor }}
              >
                <span className="text-[5px] font-bold uppercase tracking-wide">{funcLabel}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

const PadControl: React.FC<{ padIndex: number }> = ({ padIndex }) => {
  const { pads, setPadVolume, togglePadMute, togglePadSolo } = useBeatStore();
  const pad = pads[padIndex];

  return (
    <div className="bg-gray-200/50 rounded-lg p-3 space-y-2 border border-gray-300">
      <div className="text-xs font-bold text-gray-700">PAD {padIndex + 1}</div>

      <div>
        <label className="text-xs text-gray-600 font-semibold">Volume</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={pad.volume}
          onChange={(e) => setPadVolume(padIndex, parseFloat(e.target.value))}
          className="w-full accent-gray-600"
        />
      </div>

      <div className="flex gap-1">
        <button
          onClick={() => togglePadMute(padIndex)}
          className={`flex-1 px-2 py-1 text-xs rounded font-bold ${
            pad.muted ? 'bg-red-500 text-white' : 'bg-gray-400 text-gray-800'
          }`}
        >
          M
        </button>
        <button
          onClick={() => togglePadSolo(padIndex)}
          className={`flex-1 px-2 py-1 text-xs rounded font-bold ${
            pad.solo ? 'bg-yellow-500 text-gray-900' : 'bg-gray-400 text-gray-800'
          }`}
        >
          S
        </button>
      </div>
    </div>
  );
};

export default PadGrid;

