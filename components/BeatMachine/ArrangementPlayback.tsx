'use client';

import { useEffect, useRef } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import * as Tone from 'tone';

/**
 * ArrangementPlayback - Handles playback of arrangement timeline
 * This component schedules and plays pattern clips according to the arrangement
 */
export const ArrangementPlayback: React.FC = () => {
  const {
    isArrangementPlaying,
    arrangementPosition,
    setArrangementPosition,
    setIsArrangementPlaying,
    arrangementClips,
    patterns,
    bpm,
  } = useBeatStore();

  const scheduledEventsRef = useRef<number[]>([]);
  const playbackLoopRef = useRef<Tone.Loop | null>(null);

  useEffect(() => {
    // Set BPM
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    if (!isArrangementPlaying) {
      // Stop playback
      if (playbackLoopRef.current) {
        playbackLoopRef.current.stop();
        playbackLoopRef.current.dispose();
        playbackLoopRef.current = null;
      }
      
      // Clear scheduled events
      scheduledEventsRef.current.forEach(id => Tone.getTransport().clear(id));
      scheduledEventsRef.current = [];
      
      Tone.getTransport().stop();
      Tone.getTransport().position = 0;
      setArrangementPosition(0);
      return;
    }

    // Start playback
    const startPlayback = async () => {
      await Tone.start();
      
      // Clear any existing scheduled events
      scheduledEventsRef.current.forEach(id => Tone.getTransport().clear(id));
      scheduledEventsRef.current = [];

      // Schedule all clips
      arrangementClips.forEach(clip => {
        const pattern = patterns.find(p => p.id === clip.patternId);
        if (!pattern) return;

        // Convert bars to Tone.js time
        const startTime = `${clip.startTime}:0:0`; // bar:beat:sixteenth
        const duration = `${clip.duration}:0:0`;

        if (pattern.type === 'drum') {
          // Schedule drum pattern
          scheduleDrumPattern(pattern, startTime, clip.duration);
        } else if (pattern.type === 'piano') {
          // Schedule piano pattern
          schedulePianoPattern(pattern, startTime, clip.duration);
        }
      });

      // Create position update loop (every 16th note)
      playbackLoopRef.current = new Tone.Loop((time) => {
        const position = Tone.getTransport().position as string;
        const bars = parseFloat(position.split(':')[0]);
        setArrangementPosition(bars);
      }, '16n');

      playbackLoopRef.current.start(0);
      
      Tone.getTransport().start();
    };

    startPlayback();

    return () => {
      if (playbackLoopRef.current) {
        playbackLoopRef.current.stop();
        playbackLoopRef.current.dispose();
        playbackLoopRef.current = null;
      }
      scheduledEventsRef.current.forEach(id => Tone.getTransport().clear(id));
      scheduledEventsRef.current = [];
    };
  }, [isArrangementPlaying, arrangementClips, patterns]);

  const scheduleDrumPattern = (pattern: any, startTime: string, durationBars: number) => {
    if (!pattern.pads || !pattern.steps) return;

    // Calculate pattern length in bars (16 steps = 1 bar in 4/4)
    const patternLengthBars = (pattern.patternLength || 16) / 16;
    const numRepeats = Math.ceil(durationBars / patternLengthBars);

    for (let repeat = 0; repeat < numRepeats; repeat++) {
      pattern.steps.forEach((step: any) => {
        if (!step.active) return;

        const pad = pattern.pads[step.padIndex];
        if (!pad || !pad.sample) return;

        // Calculate time for this step
        const barOffset = repeat * patternLengthBars;
        const stepTime = step.stepIndex / 16; // Convert step to bars
        const totalTime = `${parseFloat(startTime.split(':')[0]) + barOffset + stepTime}:0:0`;

        // Schedule the event
        const eventId = Tone.getTransport().schedule((time) => {
          triggerSample(pad.sample, step.velocity || 0.8, time);
        }, totalTime);

        scheduledEventsRef.current.push(eventId);
      });
    }
  };

  const schedulePianoPattern = (pattern: any, startTime: string, durationBars: number) => {
    if (!pattern.midiNotes) return;

    pattern.midiNotes.forEach((note: any) => {
      // Convert note startTime (in 16th notes) to bars
      const noteStartBars = note.startTime / 16;
      const noteDurationBars = note.duration / 16;
      
      const totalTime = `${parseFloat(startTime.split(':')[0]) + noteStartBars}:0:0`;
      const noteDuration = `${noteDurationBars}:0:0`;

      // Schedule the note
      const eventId = Tone.getTransport().schedule((time) => {
        triggerMidiNote(note.pitch, noteDuration, note.velocity || 0.8, time);
      }, totalTime);

      scheduledEventsRef.current.push(eventId);
    });
  };

  return null; // This is a logic-only component
};

// Helper function to trigger a sample
function triggerSample(sample: any, velocity: number, time: number) {
  // Implementation will depend on sample type
  // For now, we'll create a temporary player
  if (sample.type === 'audio' && sample.url) {
    const player = new Tone.Player(sample.url).toDestination();
    player.volume.value = Tone.gainToDb(velocity);
    player.start(time);
    
    // Dispose after playing
    setTimeout(() => player.dispose(), 5000);
  }
}

// Helper function to trigger a MIDI note
function triggerMidiNote(pitch: number, duration: string, velocity: number, time: number) {
  // Convert MIDI pitch to note name
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(pitch / 12) - 1;
  const noteName = noteNames[pitch % 12] + octave;

  // Create a simple synth for playback
  const synth = new Tone.Synth().toDestination();
  synth.volume.value = Tone.gainToDb(velocity);
  synth.triggerAttackRelease(noteName, duration, time);
  
  // Dispose after playing
  setTimeout(() => synth.dispose(), 5000);
}

export default ArrangementPlayback;

