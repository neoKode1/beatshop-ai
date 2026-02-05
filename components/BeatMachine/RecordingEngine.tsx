'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useBeatStore, MidiNote } from '@/store/useBeatStore';
import * as Tone from 'tone';

/**
 * RecordingEngine - Professional MIDI recording system
 * 
 * Features:
 * - Count-in (4 beats with metronome)
 * - Real-time MIDI capture from keyboard/MIDI devices
 * - Visual feedback during recording
 * - Automatic quantization to grid
 * - Pattern creation from recorded notes
 */

interface RecordingEngineProps {
  onRecordingComplete?: (notes: MidiNote[]) => void;
}

export const RecordingEngine: React.FC<RecordingEngineProps> = ({ onRecordingComplete }) => {
  const {
    isRecording,
    setIsRecording,
    isPlaying,
    setIsPlaying,
    bpm,
    metronomeEnabled,
    metronomeVolume,
    addMidiNote,
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
    tracks,
    // Score Logger
    addNoteToScoreLog,
  } = useBeatStore();

  const [countIn, setCountIn] = useState(0); // 0 = not counting, 1-4 = count beats
  const [isCountingIn, setIsCountingIn] = useState(false);
  const recordingStartTimeRef = useRef<number>(0);
  const recordedNotesRef = useRef<MidiNote[]>([]);
  const metronomeRef = useRef<Tone.Synth | null>(null);
  const activeNotesRef = useRef<Map<string, { startTime: number; pitch: number }>>(new Map());

  // Use refs to track recording state for callbacks
  const isRecordingRef = useRef(false);
  const isCountingInRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isCountingInRef.current = isCountingIn;
  }, [isCountingIn]);

  // Initialize metronome
  useEffect(() => {
    if (!metronomeRef.current) {
      metronomeRef.current = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.05,
          sustain: 0,
          release: 0.05,
        },
      }).toDestination();
    }

    return () => {
      if (metronomeRef.current) {
        metronomeRef.current.dispose();
        metronomeRef.current = null;
      }
    };
  }, []);

  // Start count-in when recording is armed
  useEffect(() => {
    if (isRecording && !isCountingIn && !isPlaying) {
      startCountIn();
    }
  }, [isRecording]);

  const startCountIn = async () => {
    await Tone.start();
    setIsCountingIn(true);
    setCountIn(1);
    console.log('🎬 COUNT-IN STARTED at', bpm, 'BPM');

    const beatDuration = (60 / bpm) * 1000; // Duration of one beat in ms

    // Count in 4 beats
    for (let i = 1; i <= 4; i++) {
      setTimeout(() => {
        setCountIn(i);
        console.log(`⏱️ Count-in: ${i}/4`);

        // Play metronome click
        if (metronomeRef.current && (metronomeEnabled || isRecording)) {
          const pitch = i === 1 ? 'C6' : 'C5'; // Higher pitch on beat 1
          const volume = Tone.gainToDb(metronomeVolume);
          metronomeRef.current.volume.value = volume;
          metronomeRef.current.triggerAttackRelease(pitch, '32n');
        }

        // Start recording on beat 5 (the downbeat after the count-in)
        if (i === 4) {
          // Wait one full beat after beat 4, so recording starts on beat 5 (the "1")
          setTimeout(() => {
            setIsCountingIn(false);
            setCountIn(0);
            console.log('🎬 Count-in complete - RECORDING STARTS NOW!');
            startRecording();
          }, beatDuration); // Full beat duration to land on beat 5
        }
      }, (i - 1) * beatDuration);
    }
  };

  const startRecording = () => {
    recordingStartTimeRef.current = Tone.now();
    recordedNotesRef.current = [];

    console.log('🔴 RECORDING STARTED', {
      bpm,
      blendMode: blendRecording ? 'OVERDUB (keeping existing notes)' : 'OVERWRITE (clearing notes)',
      targetTrack: selectedTrackId || 'Piano Roll (no track selected)',
      recordToStepSeq: inputQuantize.recordToStepSequencer,
    });

    // Start recording session (snapshot current state for cancel/revert)
    startRecordingSession();

    // Only clear notes if NOT in blend (overdub) mode
    if (!blendRecording) {
      clearMidiNotes();
      console.log('🗑️ Cleared existing notes (overwrite mode)');
    } else {
      console.log('➕ Blend mode active - keeping existing notes');
    }

    setIsPlaying(true);

    // Reset transport position to 0 before starting
    // This ensures recording always starts at step 0, not at a previous position
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    // Start transport for timing reference
    Tone.getTransport().start();
    console.log('▶️ Transport started - Play notes now!');
  };

  const stopRecording = () => {
    const notes = recordedNotesRef.current;
    console.log('⏹️ RECORDING STOPPED', {
      notesRecorded: notes.length,
      notes: notes.map(n => ({ pitch: n.pitch, start: n.startTime, duration: n.duration })),
    });

    setIsRecording(false);
    setIsPlaying(false);
    setIsCountingIn(false);
    setCountIn(0);

    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    // Commit the recording session (finalize - keep recorded notes)
    commitRecordingSession();
    console.log('✅ Recording session committed - notes saved');

    // Callback with recorded notes
    if (onRecordingComplete) {
      onRecordingComplete(notes);
    }

    recordedNotesRef.current = [];
    activeNotesRef.current.clear();
  };

  // Cancel recording and revert to pre-recording state
  const cancelRecording = () => {
    setIsRecording(false);
    setIsPlaying(false);
    setIsCountingIn(false);
    setCountIn(0);

    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    // Cancel the recording session (revert to pre-recording state)
    cancelRecordingSession();

    recordedNotesRef.current = [];
    activeNotesRef.current.clear();

    console.log('🚫 Recording cancelled - reverted to previous state');
  };

  // Handle keyboard/MIDI input during recording
  const handleNoteOn = useCallback((pitch: number, velocity: number = 0.8) => {
    // Use refs for accurate state checking
    if (!isRecordingRef.current || isCountingInRef.current) {
      console.log('❌ Note blocked:', { isRecording: isRecordingRef.current, isCountingIn: isCountingInRef.current });
      return;
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
  }, []); // Empty deps - uses refs only

  const handleNoteOff = useCallback((pitch: number) => {
    // Use refs for accurate state checking
    if (!isRecordingRef.current || isCountingInRef.current) {
      console.log('❌ Note OFF blocked:', { isRecording: isRecordingRef.current, isCountingIn: isCountingInRef.current });
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

  // Render count-in indicator
  if (isCountingIn) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 pointer-events-none">
        <div className="text-center">
          <div className="text-9xl font-bold text-white mb-4 animate-pulse">
            {countIn}
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

