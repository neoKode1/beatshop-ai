import { create } from 'zustand';
import * as Tone from 'tone';
import { DrumSynthesizer, BassSynthesizer } from '@/lib/audio/synthesizers';

export type SynthType =
  | 'kick808' | 'kickAcoustic' | 'snare' | 'clap'
  | 'hihatClosed' | 'hihatOpen' | 'rimShot' | 'tom'
  | 'shaker' | 'cowbell' | 'subBass';

export type SampleType = 'synth' | 'audio';

export interface Sample {
  id: string;
  name: string;
  type: SampleType; // 'synth' or 'audio'
  synthType?: SynthType; // For synthesizers
  url?: string; // For audio files
  category: 'kick' | 'snare' | 'hihat' | 'perc' | 'bass' | 'synth' | 'fx' | 'melodic';
  pitch?: string;
}

export interface Pad {
  id: number;
  sample: Sample | null;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  synth: any | null; // For synthesizers
  player: Tone.Player | null; // For audio files
  note?: string;
}

export interface Step {
  padIndex: number;
  stepIndex: number;
  velocity: number;
  active: boolean;
}

// MIDI Note for Piano Roll
export interface MidiNote {
  id: string;
  pitch: number; // MIDI note number (0-127)
  startTime: number; // In 16th notes
  duration: number; // In 16th notes
  velocity: number; // 0-1
  sampleId?: string; // Optional: ID of the sample assigned to this note
}

export type PadMode = 'drum' | 'chromatic';

export type PatternType = 'drum' | 'piano';

// Pattern - A saved configuration of pads/steps or MIDI notes
export interface Pattern {
  id: string;
  name: string;
  type: PatternType;
  createdAt: number;

  // For drum patterns
  pads?: Pad[];
  steps?: Step[];

  // For piano patterns
  midiNotes?: MidiNote[];

  // Metadata
  bpm?: number;
  timeSignature?: string;
  patternLength?: 16 | 32 | 64;
}

// Arrangement Clip - A pattern placed on the timeline
export interface ArrangementClip {
  id: string;
  patternId: string;
  startTime: number; // In bars
  duration: number; // In bars
  track: number; // Track number (0-7 for example)
}

export interface UserPreferences {
  audioQuality: 'low' | 'medium' | 'high';
  keyboardEnabled: boolean;
  autoSave: boolean;
}

// Master Effects Settings
export interface MasterEffects {
  // Volume & Dynamics
  volume: number; // 0-1

  // Compression
  compressorThreshold: number; // -100 to 0 dB
  compressorRatio: number; // 1 to 20
  compressorAttack: number; // 0 to 1 seconds
  compressorRelease: number; // 0 to 1 seconds

  // EQ
  eqLow: number; // -24 to 24 dB
  eqMid: number; // -24 to 24 dB
  eqHigh: number; // -24 to 24 dB

  // Effects
  distortion: number; // 0-1
  reverb: number; // 0-1
  delay: number; // 0-1
  stereoWidth: number; // 0-1

  // Limiter
  limiterThreshold: number; // -24 to 0 dB
}

interface BeatStore {
  // Audio state
  bpm: number;
  isPlaying: boolean;
  isRecording: boolean;
  currentStep: number;

  // Arrangement playback
  isArrangementPlaying: boolean;
  arrangementPosition: number; // Current position in bars

  // Metronome
  metronomeEnabled: boolean;
  metronomeVolume: number;

  // Pads
  pads: Pad[];
  padMode: PadMode; // 'drum' or 'chromatic'

  // Sequencer
  steps: Step[];
  numSteps: number;
  patternLength: 16 | 32 | 64; // Pattern length in steps
  swing: number; // 0-1 (0 = no swing, 0.5 = 50% swing)
  timeSignature: string; // e.g., '4/4', '8/8', '16/16'

  // Piano Roll (MIDI notes)
  midiNotes: MidiNote[];

  // Master Effects
  masterEffects: MasterEffects;

  // User Preferences
  preferences: UserPreferences;

  // Patterns & Arrangement
  patterns: Pattern[];
  currentPatternId: string | null;
  arrangementClips: ArrangementClip[];

  // Actions
  setBpm: (bpm: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsRecording: (recording: boolean) => void;
  setCurrentStep: (step: number) => void;
  setPatternLength: (length: 16 | 32 | 64) => void;
  setSwing: (swing: number) => void;
  setTimeSignature: (timeSignature: string) => void;

  // Arrangement playback actions
  setIsArrangementPlaying: (playing: boolean) => void;
  setArrangementPosition: (position: number) => void;
  playArrangement: () => void;
  stopArrangement: () => void;

  // Metronome actions
  setMetronomeEnabled: (enabled: boolean) => void;
  setMetronomeVolume: (volume: number) => void;

  // Pad actions
  assignSampleToPad: (padIndex: number, sample: Sample) => void;
  triggerPad: (padIndex: number, velocity?: number) => void;
  setPadVolume: (padIndex: number, volume: number) => void;
  setPadPan: (padIndex: number, pan: number) => void;
  togglePadMute: (padIndex: number) => void;
  togglePadSolo: (padIndex: number) => void;
  setPadMode: (mode: PadMode) => void;

  // Sequencer actions
  toggleStep: (padIndex: number, stepIndex: number) => void;
  setStepVelocity: (padIndex: number, stepIndex: number, velocity: number) => void;
  clearPattern: () => void;

  // Piano Roll actions
  addMidiNote: (note: Omit<MidiNote, 'id'>) => void;
  updateMidiNote: (id: string, updates: Partial<MidiNote>) => void;
  deleteMidiNote: (id: string) => void;
  clearMidiNotes: () => void;

  // Master Effects actions
  setMasterVolume: (volume: number) => void;
  setCompressorThreshold: (threshold: number) => void;
  setCompressorRatio: (ratio: number) => void;
  setCompressorAttack: (attack: number) => void;
  setCompressorRelease: (release: number) => void;
  setEqLow: (gain: number) => void;
  setEqMid: (gain: number) => void;
  setEqHigh: (gain: number) => void;
  setDistortion: (amount: number) => void;
  setMasterReverb: (amount: number) => void;
  setMasterDelay: (amount: number) => void;
  setStereoWidth: (width: number) => void;
  setLimiterThreshold: (threshold: number) => void;

  // Preference actions
  setAudioQuality: (quality: 'low' | 'medium' | 'high') => void;
  setKeyboardEnabled: (enabled: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  loadPreferences: () => void;
  savePreferences: () => void;

  // Pattern actions
  savePattern: (name: string, type: PatternType) => void;
  loadPattern: (patternId: string) => void;
  deletePattern: (patternId: string) => void;
  duplicatePattern: (patternId: string) => void;
  renamePattern: (patternId: string, newName: string) => void;

  // Arrangement actions
  addClipToArrangement: (patternId: string, startTime: number, track: number) => void;
  removeClipFromArrangement: (clipId: string) => void;
  moveClip: (clipId: string, newStartTime: number, newTrack: number) => void;
  resizeClip: (clipId: string, newDuration: number) => void;
}

const createSynth = (synthType: SynthType): any => {
  switch (synthType) {
    case 'kick808': return DrumSynthesizer.createKick808();
    case 'kickAcoustic': return DrumSynthesizer.createKickAcoustic();
    case 'snare': return DrumSynthesizer.createSnare();
    case 'clap': return DrumSynthesizer.createClap();
    case 'hihatClosed': return DrumSynthesizer.createHiHatClosed();
    case 'hihatOpen': return DrumSynthesizer.createHiHatOpen();
    case 'rimShot': return DrumSynthesizer.createRimShot();
    case 'tom': return DrumSynthesizer.createTom();
    case 'shaker': return DrumSynthesizer.createShaker();
    case 'cowbell': return DrumSynthesizer.createCowbell();
    case 'subBass': return BassSynthesizer.createSubBass();
    default: return DrumSynthesizer.createKick808();
  }
};

const createInitialPads = (): Pad[] => {
  return Array.from({ length: 16 }, (_, i) => ({
    id: i,
    sample: null,
    volume: 0.8,
    pan: 0,
    muted: false,
    solo: false,
    synth: null,
    player: null,
    note: 'C2',
  }));
};

const createInitialSteps = (numPads: number, numSteps: number): Step[] => {
  const steps: Step[] = [];
  for (let pad = 0; pad < numPads; pad++) {
    for (let step = 0; step < numSteps; step++) {
      steps.push({
        padIndex: pad,
        stepIndex: step,
        velocity: 0.8,
        active: false,
      });
    }
  }
  return steps;
};

// Chromatic scale notes for 16 pads (C2 to D#3)
const CHROMATIC_NOTES = [
  'C2', 'C#2', 'D2', 'D#2',
  'E2', 'F2', 'F#2', 'G2',
  'G#2', 'A2', 'A#2', 'B2',
  'C3', 'C#3', 'D3', 'D#3'
];

// Calculate playback rate for pitch shifting
// Each semitone = 2^(1/12) ratio
const getPitchRatio = (semitones: number): number => {
  return Math.pow(2, semitones / 12);
};

export const useBeatStore = create<BeatStore>((set, get) => ({
  bpm: 120,
  isPlaying: false,
  isRecording: false,
  currentStep: 0,

  // Arrangement playback
  isArrangementPlaying: false,
  arrangementPosition: 0,

  // Metronome
  metronomeEnabled: false,
  metronomeVolume: 0.5,

  pads: createInitialPads(),
  padMode: 'drum',
  steps: createInitialSteps(16, 16),
  numSteps: 16,
  patternLength: 16,
  swing: 0,
  timeSignature: '4/4',

  // Piano Roll
  midiNotes: [],

  // Master Effects - Default values
  masterEffects: {
    volume: 0.8,
    compressorThreshold: -24,
    compressorRatio: 4,
    compressorAttack: 0.003,
    compressorRelease: 0.25,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    distortion: 0,
    reverb: 0.2,
    delay: 0.3,
    stereoWidth: 0.5,
    limiterThreshold: -3,
  },

  // Patterns & Arrangement
  patterns: [],
  currentPatternId: null,
  arrangementClips: [],

  // Default preferences
  preferences: {
    audioQuality: 'high',
    keyboardEnabled: true,
    autoSave: true,
  },
  
  setBpm: (bpm) => {
    set({ bpm });
    Tone.getTransport().bpm.value = bpm;
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setPatternLength: (length) => {
    set({ patternLength: length, numSteps: length });
    // Recreate steps array with new length
    set({ steps: createInitialSteps(16, length) });
  },
  setSwing: (swing) => set({ swing }),
  setTimeSignature: (timeSignature) => set({ timeSignature }),

  // Metronome actions
  setMetronomeEnabled: (enabled) => set({ metronomeEnabled: enabled }),
  setMetronomeVolume: (volume) => set({ metronomeVolume: volume }),
  
  assignSampleToPad: (padIndex, sample) => {
    const mode = get().padMode;
    const pads = [...get().pads];

    if (mode === 'chromatic') {
      // CHROMATIC MODE: Assign sample to ALL pads with different pitches
      pads.forEach((pad, index) => {
        // Dispose old synth and player
        if (pad.synth) {
          pad.synth.dispose();
        }
        if (pad.player) {
          pad.player.dispose();
        }

        let synth = null;
        let player = null;

        if (sample.type === 'synth' && sample.synthType) {
          // Create synthesizer for each pad
          synth = createSynth(sample.synthType);
          synth.volume.value = Tone.gainToDb(pad.volume);
        } else if (sample.type === 'audio' && sample.url) {
          // Create audio player for each pad
          player = new Tone.Player(sample.url).toDestination();
          player.volume.value = Tone.gainToDb(pad.volume);
          // Set playback rate for pitch shifting (pad 0 = normal, others shifted)
          player.playbackRate = getPitchRatio(index);
        }

        pads[index] = {
          ...pad,
          sample,
          synth,
          player,
          note: CHROMATIC_NOTES[index],
        };
      });
    } else {
      // DRUM MODE: Assign sample to single pad
      const pad = pads[padIndex];

      // Dispose old synth and player
      if (pad.synth) {
        pad.synth.dispose();
      }
      if (pad.player) {
        pad.player.dispose();
      }

      let synth = null;
      let player = null;

      if (sample.type === 'synth' && sample.synthType) {
        // Create synthesizer
        synth = createSynth(sample.synthType);
        synth.volume.value = Tone.gainToDb(pad.volume);
      } else if (sample.type === 'audio' && sample.url) {
        // Create audio player
        player = new Tone.Player(sample.url).toDestination();
        player.volume.value = Tone.gainToDb(pad.volume);
      }

      pads[padIndex] = {
        ...pad,
        sample,
        synth,
        player,
        note: sample.pitch || 'C2',
      };
    }

    set({ pads });
  },
  
  triggerPad: (padIndex, velocity = 0.8) => {
    const pad = get().pads[padIndex];
    if (!pad.muted && pad.sample) {
      const time = Tone.now();
      const vel = velocity;

      // Trigger synthesizer
      if (pad.synth) {
        if (pad.synth instanceof Tone.NoiseSynth ||
            pad.synth instanceof Tone.MetalSynth) {
          pad.synth.triggerAttackRelease('16n', time, vel);
        } else if (pad.synth instanceof Tone.MembraneSynth ||
                   pad.synth instanceof Tone.MonoSynth) {
          pad.synth.triggerAttackRelease(pad.note || 'C2', '16n', time, vel);
        }
      }

      // Trigger audio player
      if (pad.player && pad.player.loaded) {
        pad.player.start(time);
      }
    }
  },
  
  setPadVolume: (padIndex, volume) => {
    const pads = [...get().pads];
    pads[padIndex].volume = volume;
    if (pads[padIndex].synth) {
      pads[padIndex].synth!.volume.value = Tone.gainToDb(volume);
    }
    set({ pads });
  },
  
  setPadPan: (padIndex, pan) => {
    const pads = [...get().pads];
    pads[padIndex].pan = pan;
    set({ pads });
  },
  
  togglePadMute: (padIndex) => {
    const pads = [...get().pads];
    pads[padIndex].muted = !pads[padIndex].muted;
    set({ pads });
  },
  
  togglePadSolo: (padIndex) => {
    const pads = [...get().pads];
    pads[padIndex].solo = !pads[padIndex].solo;
    set({ pads });
  },

  setPadMode: (mode) => {
    set({ padMode: mode });
  },

  toggleStep: (padIndex, stepIndex) => {
    const steps = [...get().steps];
    const stepIdx = steps.findIndex(
      s => s.padIndex === padIndex && s.stepIndex === stepIndex
    );
    if (stepIdx !== -1) {
      steps[stepIdx].active = !steps[stepIdx].active;
      set({ steps });
    }
  },
  
  setStepVelocity: (padIndex, stepIndex, velocity) => {
    const steps = [...get().steps];
    const stepIdx = steps.findIndex(
      s => s.padIndex === padIndex && s.stepIndex === stepIndex
    );
    if (stepIdx !== -1) {
      steps[stepIdx].velocity = velocity;
      set({ steps });
    }
  },
  
  clearPattern: () => {
    const { patternLength } = get();
    set({ steps: createInitialSteps(16, patternLength) });
  },

  // Piano Roll actions
  addMidiNote: (note) => {
    const newNote: MidiNote = {
      ...note,
      id: `note-${Date.now()}-${Math.random()}`,
    };
    set((state) => ({
      midiNotes: [...state.midiNotes, newNote],
    }));
  },

  updateMidiNote: (id, updates) => {
    set((state) => ({
      midiNotes: state.midiNotes.map((note) =>
        note.id === id ? { ...note, ...updates } : note
      ),
    }));
  },

  deleteMidiNote: (id) => {
    set((state) => ({
      midiNotes: state.midiNotes.filter((note) => note.id !== id),
    }));
  },

  clearMidiNotes: () => {
    set({ midiNotes: [] });
  },

  // Master Effects actions
  setMasterVolume: (volume) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, volume },
    }));
  },

  setCompressorThreshold: (threshold) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, compressorThreshold: threshold },
    }));
  },

  setCompressorRatio: (ratio) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, compressorRatio: ratio },
    }));
  },

  setCompressorAttack: (attack) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, compressorAttack: attack },
    }));
  },

  setCompressorRelease: (release) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, compressorRelease: release },
    }));
  },

  setEqLow: (gain) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, eqLow: gain },
    }));
  },

  setEqMid: (gain) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, eqMid: gain },
    }));
  },

  setEqHigh: (gain) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, eqHigh: gain },
    }));
  },

  setDistortion: (amount) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, distortion: amount },
    }));
  },

  setMasterReverb: (amount) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, reverb: amount },
    }));
  },

  setMasterDelay: (amount) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, delay: amount },
    }));
  },

  setStereoWidth: (width) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, stereoWidth: width },
    }));
  },

  setLimiterThreshold: (threshold) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, limiterThreshold: threshold },
    }));
  },

  // Preference actions
  setAudioQuality: (quality) => {
    set((state) => ({
      preferences: { ...state.preferences, audioQuality: quality }
    }));
    get().savePreferences();
  },

  setKeyboardEnabled: (enabled) => {
    set((state) => ({
      preferences: { ...state.preferences, keyboardEnabled: enabled }
    }));
    get().savePreferences();
  },

  setAutoSave: (enabled) => {
    set((state) => ({
      preferences: { ...state.preferences, autoSave: enabled }
    }));
    get().savePreferences();
  },

  loadPreferences: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userPreferences');
      if (saved) {
        try {
          const prefs = JSON.parse(saved);
          set({ preferences: prefs });
        } catch (e) {
          console.error('Failed to load preferences:', e);
        }
      }
    }
  },

  savePreferences: () => {
    if (typeof window !== 'undefined') {
      const prefs = get().preferences;
      localStorage.setItem('userPreferences', JSON.stringify(prefs));
    }
  },

  // Pattern Management
  savePattern: (name, type) => {
    const state = get();
    const pattern: Pattern = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      createdAt: Date.now(),
      bpm: state.bpm,
      timeSignature: state.timeSignature,
      patternLength: state.patternLength,
    };

    if (type === 'drum') {
      // Deep clone pads and steps
      pattern.pads = JSON.parse(JSON.stringify(state.pads.map(pad => ({
        ...pad,
        synth: null, // Don't serialize Tone.js objects
        player: null,
      }))));
      pattern.steps = JSON.parse(JSON.stringify(state.steps));
    } else if (type === 'piano') {
      pattern.midiNotes = JSON.parse(JSON.stringify(state.midiNotes));
    }

    set((state) => ({
      patterns: [...state.patterns, pattern],
      currentPatternId: pattern.id,
    }));

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('beatshop_patterns', JSON.stringify(get().patterns));
    }
  },

  loadPattern: (patternId) => {
    const state = get();
    const pattern = state.patterns.find(p => p.id === patternId);
    if (!pattern) return;

    if (pattern.type === 'drum' && pattern.pads && pattern.steps) {
      // Restore pads (need to recreate Tone.js objects)
      const restoredPads = pattern.pads.map(pad => ({
        ...pad,
        synth: pad.sample?.type === 'synth' && pad.sample.synthType
          ? createSynth(pad.sample.synthType)
          : null,
        player: pad.sample?.type === 'audio' && pad.sample.url
          ? new Tone.Player(pad.sample.url).toDestination()
          : null,
      }));

      set({
        pads: restoredPads,
        steps: pattern.steps,
        currentPatternId: patternId,
      });
    } else if (pattern.type === 'piano' && pattern.midiNotes) {
      set({
        midiNotes: pattern.midiNotes,
        currentPatternId: patternId,
      });
    }

    // Restore metadata
    if (pattern.bpm) set({ bpm: pattern.bpm });
    if (pattern.timeSignature) set({ timeSignature: pattern.timeSignature });
    if (pattern.patternLength) set({ patternLength: pattern.patternLength });
  },

  deletePattern: (patternId) => {
    set((state) => ({
      patterns: state.patterns.filter(p => p.id !== patternId),
      currentPatternId: state.currentPatternId === patternId ? null : state.currentPatternId,
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem('beatshop_patterns', JSON.stringify(get().patterns));
    }
  },

  duplicatePattern: (patternId) => {
    const state = get();
    const pattern = state.patterns.find(p => p.id === patternId);
    if (!pattern) return;

    const duplicate: Pattern = {
      ...JSON.parse(JSON.stringify(pattern)),
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${pattern.name} (Copy)`,
      createdAt: Date.now(),
    };

    set((state) => ({
      patterns: [...state.patterns, duplicate],
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem('beatshop_patterns', JSON.stringify(get().patterns));
    }
  },

  renamePattern: (patternId, newName) => {
    set((state) => ({
      patterns: state.patterns.map(p =>
        p.id === patternId ? { ...p, name: newName } : p
      ),
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem('beatshop_patterns', JSON.stringify(get().patterns));
    }
  },

  // Arrangement Management
  addClipToArrangement: (patternId, startTime, track) => {
    const pattern = get().patterns.find(p => p.id === patternId);
    if (!pattern) return;

    const clip: ArrangementClip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patternId,
      startTime,
      duration: 4, // Default 4 bars
      track,
    };

    set((state) => ({
      arrangementClips: [...state.arrangementClips, clip],
    }));
  },

  removeClipFromArrangement: (clipId) => {
    set((state) => ({
      arrangementClips: state.arrangementClips.filter(c => c.id !== clipId),
    }));
  },

  moveClip: (clipId, newStartTime, newTrack) => {
    set((state) => ({
      arrangementClips: state.arrangementClips.map(c =>
        c.id === clipId ? { ...c, startTime: newStartTime, track: newTrack } : c
      ),
    }));
  },

  resizeClip: (clipId, newDuration) => {
    set((state) => ({
      arrangementClips: state.arrangementClips.map(c =>
        c.id === clipId ? { ...c, duration: newDuration } : c
      ),
    }));
  },

  // Arrangement playback actions
  setIsArrangementPlaying: (playing) => set({ isArrangementPlaying: playing }),
  setArrangementPosition: (position) => set({ arrangementPosition: position }),

  playArrangement: () => {
    set({ isArrangementPlaying: true, arrangementPosition: 0 });
  },

  stopArrangement: () => {
    set({ isArrangementPlaying: false, arrangementPosition: 0 });
  },
}));

