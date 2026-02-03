'use client';

import { useEffect, useRef, useState } from 'react';
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
  } = useBeatStore();

  const [countIn, setCountIn] = useState(0); // 0 = not counting, 1-4 = count beats
  const [isCountingIn, setIsCountingIn] = useState(false);
  const recordingStartTimeRef = useRef<number>(0);
  const recordedNotesRef = useRef<MidiNote[]>([]);
  const metronomeRef = useRef<Tone.Synth | null>(null);
  const activeNotesRef = useRef<Map<string, { startTime: number; pitch: number }>>(new Map());

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

    const beatDuration = (60 / bpm) * 1000; // Duration of one beat in ms

    // Count in 4 beats
    for (let i = 1; i <= 4; i++) {
      setTimeout(() => {
        setCountIn(i);
        
        // Play metronome click
        if (metronomeRef.current && (metronomeEnabled || isRecording)) {
          const pitch = i === 1 ? 'C6' : 'C5'; // Higher pitch on beat 1
          const volume = Tone.gainToDb(metronomeVolume);
          metronomeRef.current.volume.value = volume;
          metronomeRef.current.triggerAttackRelease(pitch, '32n');
        }

        // Start recording after count-in
        if (i === 4) {
          setTimeout(() => {
            setIsCountingIn(false);
            setCountIn(0);
            startRecording();
          }, beatDuration);
        }
      }, (i - 1) * beatDuration);
    }
  };

  const startRecording = () => {
    recordingStartTimeRef.current = Tone.now();
    recordedNotesRef.current = [];
    clearMidiNotes(); // Clear existing notes
    setIsPlaying(true);
    
    // Start transport for timing reference
    Tone.getTransport().start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPlaying(false);
    setIsCountingIn(false);
    setCountIn(0);
    
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    // Process recorded notes
    const notes = recordedNotesRef.current;
    
    // Quantize notes to 16th note grid (optional - can be made configurable)
    const quantizedNotes = quantizeNotes(notes, bpm);
    
    // Add notes to store
    quantizedNotes.forEach(note => addMidiNote(note));
    
    // Callback with recorded notes
    if (onRecordingComplete) {
      onRecordingComplete(quantizedNotes);
    }

    recordedNotesRef.current = [];
    activeNotesRef.current.clear();
  };

  // Handle keyboard/MIDI input during recording
  const handleNoteOn = (pitch: number, velocity: number = 0.8) => {
    if (!isRecording || isCountingIn) return;

    const currentTime = Tone.now();
    const relativeTime = currentTime - recordingStartTimeRef.current;
    
    // Store note start time
    const noteKey = `note_${pitch}`;
    activeNotesRef.current.set(noteKey, {
      startTime: relativeTime,
      pitch,
    });
  };

  const handleNoteOff = (pitch: number) => {
    if (!isRecording || isCountingIn) return;

    const noteKey = `note_${pitch}`;
    const noteStart = activeNotesRef.current.get(noteKey);

    if (noteStart) {
      const currentTime = Tone.now();
      const relativeTime = currentTime - recordingStartTimeRef.current;
      const duration = relativeTime - noteStart.startTime;

      // Create MIDI note
      const note: MidiNote = {
        id: `note_${Date.now()}_${Math.random()}`,
        pitch,
        startTime: timeToSixteenths(noteStart.startTime, bpm),
        duration: Math.max(1, timeToSixteenths(duration, bpm)), // Minimum 1 sixteenth
        velocity: 0.8,
      };

      recordedNotesRef.current.push(note);
      activeNotesRef.current.delete(noteKey);

      // Add note to display in real-time
      addMidiNote(note);
    }
  };

  // Expose recording controls to parent components
  useEffect(() => {
    // Attach to window for global access (can be improved with context)
    (window as any).recordingEngine = {
      handleNoteOn,
      handleNoteOff,
      stopRecording,
    };

    return () => {
      delete (window as any).recordingEngine;
    };
  }, [isRecording, isCountingIn]);

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

