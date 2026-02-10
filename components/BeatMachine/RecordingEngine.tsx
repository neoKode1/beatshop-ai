'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useBeatStore, MidiNote } from '@/store/useBeatStore';
import * as Tone from 'tone';

/**
 * RecordingEngine - Professional MIDI recording system
 *
 * NOTE: Count-in and metronome are handled EXCLUSIVELY by FLToolbar.
 * This component only handles:
 * - Recording session management (start/stop/commit)
 * - MIDI note capture from keyboard/MIDI devices
 * - Note quantization
 *
 * FL Studio workflow: Arm → Play → Count-in (FLToolbar) → Record
 */

interface RecordingEngineProps {
  onRecordingComplete?: (notes: MidiNote[]) => void;
}

export const RecordingEngine: React.FC<RecordingEngineProps> = ({ onRecordingComplete }) => {
  const {
    isRecording,
    isPlaying,
    bpm,
    clearMidiNotes,
    // Recording Session Actions
    startRecordingSession,
    cancelRecordingSession,
    commitRecordingSession,
    recordNoteWithQuantize,
    recordStepWithQuantize,
    // Input Quantize Settings
    inputQuantize,
    blendRecording,
    selectedTrackId,
    // Score Logger
    addNoteToScoreLog,
    // Count-in state from store (FL Studio style - single source of truth)
    // NOTE: Count-in is handled by FLToolbar, we just read the state
    isCountingIn,
    countInStep,
    timeSignature,
    // Recording Timing Sync
    recordingDownbeatTime,
  } = useBeatStore();

  // Derive beatsPerMeasure from timeSignature (e.g., '4/4' → 4, '3/4' → 3, '6/8' → 6)
  const beatsPerMeasure = parseInt(timeSignature.split('/')[0], 10) || 4;

  const recordingStartTimeRef = useRef<number>(0);
  const recordedNotesRef = useRef<MidiNote[]>([]);
  const activeNotesRef = useRef<Map<string, { startTime: number; pitch: number }>>(new Map());

  // Use refs to track recording state for callbacks
  const isRecordingRef = useRef(false);
  const isCountingInRef = useRef(false);
  const recordingSessionStartedRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isCountingInRef.current = isCountingIn;
  }, [isCountingIn]);

  // When count-in ends (isCountingIn goes from true to false while recording),
  // start the actual recording session
  useEffect(() => {
    if (isRecording && !isCountingIn && !recordingSessionStartedRef.current) {
      // Count-in just finished, start recording session
      console.log('🎬 [RecordingEngine] Count-in complete - Starting recording session');
      recordingSessionStartedRef.current = true;
      startRecordingSession();
      recordingStartTimeRef.current = recordingDownbeatTime;
      recordedNotesRef.current = [];
      console.log(`🎬 [RecordingEngine] Recording start time set to downbeat: ${recordingDownbeatTime.toFixed(3)}s`);

      // Only clear notes if NOT in blend (overdub) mode
      if (!blendRecording) {
        clearMidiNotes();
        console.log('🗑️ [RecordingEngine] Cleared existing notes (overwrite mode)');
      } else {
        console.log('➕ [RecordingEngine] Blend mode active - keeping existing notes');
      }

      console.log('🔴 [RecordingEngine] RECORDING ACTIVE - Play pads now!');
    }
  }, [isRecording, isCountingIn, blendRecording, clearMidiNotes, startRecordingSession]);

  // Reset recording session flag when recording stops
  useEffect(() => {
    if (!isRecording) {
      recordingSessionStartedRef.current = false;
    }
  }, [isRecording]);

  const stopRecording = () => {
    const notes = recordedNotesRef.current;
    console.log('⏹️ [RecordingEngine] RECORDING STOPPED', {
      notesRecorded: notes.length,
      notes: notes.map(n => ({ pitch: n.pitch, start: n.startTime, duration: n.duration })),
    });

    // NOTE: Transport control is handled by FLToolbar, not here
    // We only handle the recording session cleanup

    // Commit the recording session (finalize - keep recorded notes)
    commitRecordingSession();
    console.log('✅ [RecordingEngine] Recording session committed - notes saved');

    // Callback with recorded notes
    if (onRecordingComplete) {
      onRecordingComplete(notes);
    }

    recordedNotesRef.current = [];
    activeNotesRef.current.clear();
  };

  // Cancel recording and revert to pre-recording state
  const cancelRecording = () => {
    console.log('🚫 [RecordingEngine] Cancelling recording...');

    // NOTE: Transport control is handled by FLToolbar, not here
    // We only handle the recording session cleanup

    // Cancel the recording session (revert to pre-recording state)
    cancelRecordingSession();

    recordedNotesRef.current = [];
    activeNotesRef.current.clear();

    console.log('🚫 [RecordingEngine] Recording cancelled - reverted to previous state');
  };

  // Handle keyboard/MIDI input during recording
  const handleNoteOn = useCallback((pitch: number, velocity: number = 0.8) => {
    // Read directly from Zustand store (synchronous) instead of refs that lag behind
    // React renders. The FLToolbar scheduler sets isCountingIn=false in the store
    // immediately when count-in completes, but the ref sync goes through
    // useEffect → React re-render → ref update, adding 1-2 frames of delay.
    // During that delay window, notes on the downbeat would be blocked.
    const storeState = useBeatStore.getState();
    if (!storeState.isRecording || storeState.isCountingIn) {
      console.log('❌ Note blocked:', { isRecording: storeState.isRecording, isCountingIn: storeState.isCountingIn });
      return;
    }

    // Auto-start recording session if count-in just ended but useEffect hasn't fired yet
    if (!recordingSessionStartedRef.current) {
      console.log('🎬 [RecordingEngine] Auto-starting recording session (downbeat note arrived before useEffect)');
      recordingSessionStartedRef.current = true;
      startRecordingSession();
      recordingStartTimeRef.current = storeState.recordingDownbeatTime;
      recordedNotesRef.current = [];
    }

    console.log('✅ Recording note ON:', pitch);
    const currentTime = Tone.now();
    const relativeTime = currentTime - recordingStartTimeRef.current;

    // Store note start time
    const noteKey = `note_${pitch}`;
    activeNotesRef.current.set(noteKey, {
      startTime: relativeTime,
      pitch,
    });
  }, [startRecordingSession]); // startRecordingSession is stable (Zustand action)

  const handleNoteOff = useCallback((pitch: number) => {
    // Read directly from Zustand store (synchronous) — same reason as handleNoteOn
    const storeState = useBeatStore.getState();
    if (!storeState.isRecording || storeState.isCountingIn) {
      console.log('❌ Note OFF blocked:', { isRecording: storeState.isRecording, isCountingIn: storeState.isCountingIn });
      return;
    }

    console.log('✅ Recording note OFF:', pitch);
    const noteKey = `note_${pitch}`;
    const noteStart = activeNotesRef.current.get(noteKey);

    if (noteStart) {
      const currentTime = Tone.now();
      const relativeTime = currentTime - recordingStartTimeRef.current;
      const duration = relativeTime - noteStart.startTime;

      const startTimeInSixteenths = timeToSixteenths(noteStart.startTime, bpm);
      const durationInSixteenths = Math.max(1, timeToSixteenths(duration, bpm));

      // Check if we should record to step sequencer instead of piano roll
      if (inputQuantize.recordToStepSequencer && selectedTrackId) {
        // Record to step sequencer (drum mode)
        recordStepWithQuantize(selectedTrackId, startTimeInSixteenths, 0.8);
        console.log('🥁 Recorded to step sequencer:', { trackId: selectedTrackId, step: startTimeInSixteenths });
      } else {
        // Record to piano roll with quantization
        recordNoteWithQuantize({
          pitch,
          startTime: startTimeInSixteenths,
          duration: durationInSixteenths,
          velocity: 0.8,
        });
        console.log('🎵 Recorded to piano roll with quantize');
      }

      // Keep track of recorded notes for callback
      const note: MidiNote = {
        id: `note_${Date.now()}_${Math.random()}`,
        pitch,
        startTime: startTimeInSixteenths,
        duration: durationInSixteenths,
        velocity: 0.8,
      };
      recordedNotesRef.current.push(note);
      activeNotesRef.current.delete(noteKey);

      // 📝 Score Logger: Always add notes to the 3-minute buffer (FL Studio behavior)
      // The score logger captures ALL notes regardless of recording state
      const msPerBeat = 60000 / bpm;
      const msPerStep = msPerBeat / 4; // 16th notes
      addNoteToScoreLog({
        pitch,
        velocity: 0.8,
        startTime: Date.now() - (duration * 1000), // Approximate start time in ms
        duration: durationInSixteenths * msPerStep, // Duration in ms
      });
      console.log('📝 Score Logger: Note added to 3-minute buffer', { pitch, duration: durationInSixteenths });
    } else {
      console.log('⚠️ No note start found for:', pitch);
    }
  }, [bpm, inputQuantize, selectedTrackId, recordNoteWithQuantize, recordStepWithQuantize, addNoteToScoreLog]); // Include dependencies

  // Expose recording controls to parent components
  useEffect(() => {
    // Attach to window for global access (can be improved with context)
    (window as any).recordingEngine = {
      handleNoteOn,
      handleNoteOff,
      stopRecording,
      cancelRecording, // New: Cancel and revert to pre-recording state
    };

    return () => {
      delete (window as any).recordingEngine;
    };
  }, [handleNoteOn, handleNoteOff]); // Include callback dependencies

  // Render count-in indicator using store's countInStep
  if (isCountingIn) {
    const displayCount = (countInStep % beatsPerMeasure) + 1; // Show 1-N for current beat
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 pointer-events-none">
        <div className="text-center">
          <div className="text-9xl font-bold text-white mb-4 animate-pulse">
            {displayCount}
          </div>
          <div className="text-2xl text-gray-300">
            Get ready to record...
          </div>
        </div>
      </div>
    );
  }

  // Render recording indicator
  if (isRecording && !isCountingIn) {
    return (
      <div className="fixed top-24 right-8 z-50 pointer-events-none">
        <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-pulse">
          <div className="w-4 h-4 bg-white rounded-full animate-ping" />
          <span className="text-lg font-bold">RECORDING</span>
        </div>
      </div>
    );
  }

  return null;
};

// Helper: Convert time in seconds to 16th notes
function timeToSixteenths(timeInSeconds: number, bpm: number): number {
  const beatsPerSecond = bpm / 60;
  const sixteenthsPerSecond = beatsPerSecond * 4; // 4 sixteenths per beat
  return Math.round(timeInSeconds * sixteenthsPerSecond);
}

// Helper: Quantize notes to 16th note grid
function quantizeNotes(notes: MidiNote[], bpm: number): MidiNote[] {
  return notes.map(note => ({
    ...note,
    startTime: Math.round(note.startTime), // Snap to nearest 16th
    duration: Math.max(1, Math.round(note.duration)), // Minimum 1 sixteenth
  }));
}

export default RecordingEngine;
