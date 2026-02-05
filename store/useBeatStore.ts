import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as Tone from 'tone';
import { createSynth } from '@/lib/audio/synthesizers';
import { getMasterEffects } from '@/lib/audio/effects';

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

export interface PadEffects {
  // ADSR Envelope
  attack: number;
  decay: number;
  sustain: number;
  release: number;

  // Filter
  filterFreq: number;
  filterQ: number;

  // Pitch & Effects
  pitch: number; // semitones
  reverse: boolean;
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
  effects: PadEffects; // Sample editing parameters

  // Tone.js effect nodes
  envelope?: Tone.AmplitudeEnvelope | null;
  filter?: Tone.Filter | null;
}

export interface Step {
  padIndex: number;
  stepIndex: number;
  velocity: number;
  active: boolean;
  probability?: number; // 0-100%, default 100% (always trigger). For humanization/variation
  microTiming?: number; // -50 to +50 ms offset for groove/swing
}

// MIDI Note for Piano Roll
export interface MidiNote {
  id: string;
  pitch: number; // MIDI note number (0-127)
  startTime: number; // In 16th notes
  duration: number; // In 16th notes
  velocity: number; // 0-1
  sampleId?: string; // Optional: ID of the sample assigned to this note
  // FL Studio-style per-note properties
  pan?: number; // -1 (left) to 1 (right), 0 = center
  pitchOffset?: number; // Semitone offset from base pitch (-12 to +12)
  modX?: number; // Mod wheel X (0-1)
  modY?: number; // Mod wheel Y (0-1)
}

// Track - Unified system for both drums and instruments
// Channel Group - FL Studio style track grouping
export interface ChannelGroup {
  id: string;
  name: string;
  color: string;
  collapsed: boolean; // Whether the group is collapsed in the UI
  muted: boolean; // Mute all tracks in group
  solo: boolean; // Solo all tracks in group
}

export interface Track {
  id: string;
  name: string;
  type: 'drum' | 'instrument'; // drum = one-shot samples, instrument = chromatic/melodic
  sample: Sample | null;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string; // For visual identification
  groupId?: string; // Optional channel group ID

  // Audio engine
  synth: any | null; // For synthesizers
  player: Tone.Player | null; // For audio files (drum mode)
  sampler: Tone.Sampler | null; // For chromatic instruments (instrument mode)

  // Sequencer data
  steps: Step[]; // For drum tracks (16/32/64 steps)
  midiNotes: MidiNote[]; // For instrument tracks (piano roll style)

  // Effects
  effects: PadEffects;
  envelope?: Tone.AmplitudeEnvelope | null;
  filter?: Tone.Filter | null;
}

export type PadMode = 'drum' | 'chromatic';

export type PatternType = 'drum' | 'piano';

// FL Studio Playback Mode - PAT plays current pattern, SONG plays arrangement
export type PlaybackMode = 'PAT' | 'SONG';

// Channel Group - For organizing channels in the Channel Rack
export interface ChannelGroup {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
  channelIds: number[]; // Pad indices belonging to this group
}

// FL Studio Pattern Colors (16 preset colors)
export const PATTERN_COLORS = [
  '#ff6b35', // Orange
  '#f7c948', // Yellow
  '#2ec4b6', // Teal
  '#e71d36', // Red
  '#7b2cbf', // Purple
  '#3a86ff', // Blue
  '#06d6a0', // Green
  '#ff006e', // Pink
  '#8338ec', // Violet
  '#fb5607', // Deep Orange
  '#ffbe0b', // Amber
  '#3a0ca3', // Indigo
  '#4cc9f0', // Cyan
  '#f72585', // Magenta
  '#4361ee', // Royal Blue
  '#7209b7', // Deep Purple
] as const;

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
  numBars?: number;

  // FL Studio features
  color: string; // Pattern color for visual identification
  index: number; // Pattern number (1-999)
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

  // Modulation Effects
  chorus: number; // 0-1 (wet mix)
  phaser: number; // 0-1 (wet mix)
  flanger: number; // 0-1 (wet mix)

  // Bitcrusher
  bitcrusher: number; // 0-1 (0 = off, 1 = max crush)

  // Limiter
  limiterThreshold: number; // -24 to 0 dB
}

interface BeatStore {
  // Audio state
  bpm: number;
  isPlaying: boolean;
  isArmed: boolean; // Recording is armed (ready to record when playback starts)
  isRecording: boolean;
  isCountingIn: boolean;
  countInStep: number;
  countInEnabled: boolean; // Whether count-in is enabled for recording
  countInBars: number; // Number of bars to count in (1, 2, or 4)
  currentStep: number;

  // Arrangement playback
  isArrangementPlaying: boolean;
  arrangementPosition: number; // Current position in bars

  // Metronome
  metronomeEnabled: boolean;
  metronomeVolume: number;

  // TRACK SYSTEM (replaces pads)
  tracks: Track[];
  selectedTrackId: string | null; // For waveform editor and selection

  // Channel Groups (FL Studio style)
  channelGroups: ChannelGroup[];
  selectedGroupId: string | null;

  // Legacy pads (for backward compatibility - will be removed)
  pads: Pad[];
  padMode: PadMode; // 'drum' or 'chromatic'
  selectedPadIndex: number | null; // For waveform editor

  // Sequencer
  steps: Step[];
  numSteps: number; // Calculated from numBars * stepsPerBar
  numBars: number; // Pattern length in bars (1-16)
  patternLength: 16 | 32 | 64; // Legacy - kept for compatibility
  swing: number; // 0-1 (0 = no swing, 0.5 = 50% swing)
  timeSignature: string; // e.g., '4/4', '3/4', '6/8', '7/8'
  snapSetting: string; // FL Studio snap: 'line', 'cell', 'none', 'step', 'beat', 'bar', etc.

  // Piano Roll (MIDI notes) - legacy, will be moved to tracks
  midiNotes: MidiNote[];

  // Piano Roll Tools & Selection (FL Studio style)
  pianoRollTool: 'draw' | 'paint' | 'paintDrum' | 'delete' | 'mute' | 'select' | 'slice' | 'chord';
  selectedNoteIds: string[]; // IDs of selected notes
  noteClipboard: MidiNote[]; // Copied notes for paste
  mutedNoteIds: string[]; // IDs of muted notes
  selectedChordType: string; // For chord stamp tool (e.g., 'major', 'minor', 'dom7')

  // Snap to Scale (FL Studio style)
  snapToScale: boolean; // When enabled, notes snap to selected scale
  selectedScale: string; // e.g., 'C Major', 'A Minor', 'C Pentatonic', etc.
  scaleRootNote: number; // Root note (0-11 = C-B)

  // Ghost Notes (FL Studio style - show notes from other channels)
  showGhostNotes: boolean; // Alt+V to toggle
  ghostNoteChannels: string[]; // Track IDs to show as ghosts (empty = all)

  // Master Effects
  masterEffects: MasterEffects;

  // User Preferences
  preferences: UserPreferences;

  // Patterns & Arrangement
  patterns: Pattern[];
  currentPatternId: string | null;
  currentPatternIndex: number; // FL Studio pattern number (1-999)
  arrangementClips: ArrangementClip[];

  // FL Studio Features
  playbackMode: PlaybackMode; // 'PAT' or 'SONG'
  channelGroups: ChannelGroup[];
  currentChannelFilter: string | 'all' | 'unsorted'; // Filter channels by group
  globalSwing: number; // Global swing amount (0-100%)
  maxPatterns: number; // Max 999 patterns

  // MPC Studio Mode States
  noteRepeatEnabled: boolean; // NOTE REPEAT mode active
  noteRepeatRate: string; // Note division: '1/4', '1/8', '1/16', '1/32', etc.
  latchEnabled: boolean; // LATCH mode - sustain note repeat without holding
  fullLevelEnabled: boolean; // FULL LEVEL - all pads trigger at max velocity
  halfLevelEnabled: boolean; // HALF LEVEL - all pads trigger at 50% velocity
  sixteenLevelEnabled: boolean; // 16 LEVEL mode - pads map to velocity levels
  sixteenLevelPadIndex: number | null; // The pad selected for 16 level mode
  padMuteMode: boolean; // PAD MUTE mode - click pads to mute/unmute
  trackMuteMode: boolean; // TRACK MUTE mode - click to mute tracks
  eraseMode: boolean; // ERASE mode - hold and play to delete notes in realtime
  overdubEnabled: boolean; // OVERDUB mode - record over existing notes
  shiftPressed: boolean; // SHIFT modifier key
  activePadBank: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'; // Current pad bank

  // Undo/Redo System
  undoStack: Array<{ steps: Step[]; midiNotes: MidiNote[] }>;
  redoStack: Array<{ steps: Step[]; midiNotes: MidiNote[] }>;
  maxUndoSteps: number;

  // Quantize Settings
  quantizeEnabled: boolean;
  quantizeStrength: number; // 0-100%

  // Zoom Level
  zoomLevel: number; // 1-4 (1 = normal, 4 = max zoom)

  // Current Mode (for MODE button)
  currentMode: 'main' | 'browser' | 'sampler' | 'mixer' | 'config';

  // FL Studio Recording Mode Settings
  loopRecordingEnabled: boolean; // When ON: recording loops at pattern end. When OFF: recording continues beyond pattern
  blendRecording: boolean; // When ON: new notes blend with existing (overdub). When OFF: new notes overwrite
  recordingFilter: {
    notes: boolean; // Record MIDI notes
    automation: boolean; // Record automation
    audio: boolean; // Record audio
  };
  recordingStartsPlayback: boolean; // Pressing record also starts playback
  disarmOnStop: boolean; // Deselect record arm when stopped
  waitForInput: boolean; // Wait for MIDI input before starting recording

  // Score Logger - 3 minute MIDI buffer (FL Studio feature)
  scoreLogger: {
    enabled: boolean;
    notes: Array<{
      pitch: number;
      velocity: number;
      startTime: number; // Timestamp in ms
      duration: number; // Duration in ms
    }>;
    maxDuration: number; // 3 minutes = 180000ms
  };

  // Pattern Clipboard (for copy/paste entire patterns)
  patternClipboard: {
    steps: Step[];
    midiNotes: MidiNote[];
    numSteps: number;
    numBars: number;
    timeSignature: string;
  } | null;

  // Tap Tempo
  tapTempoTimes: number[]; // Array of tap timestamps

  // Input Quantize Options
  inputQuantize: {
    noteStartTime: boolean; // Quantize note start
    noteEndTime: boolean; // Quantize note end
    leaveDuration: boolean; // Leave note duration as played
    recordToStepSequencer: boolean; // Record to step seq instead of piano roll
  };

  // Recording Session State (for cancel/revert)
  recordingSession: {
    isActive: boolean;
    preRecordingMidiNotes: MidiNote[]; // Snapshot of midiNotes before recording
    preRecordingSteps: Step[]; // Snapshot of steps before recording
    recordedNoteIds: string[]; // IDs of notes recorded in this session
    recordedStepKeys: string[]; // Keys of steps recorded (format: "trackId_stepIndex")
  };

  // MIDI Learn Mode
  midiLearnMode: boolean; // Whether MIDI Learn mode is active
  midiLearnTarget: { type: string; id: string | number; label: string } | null; // Current control being mapped
  midiMappings: Array<{
    id: string;
    type: 'note' | 'cc';
    channel: number;
    value: number;
    targetType: string;
    targetId: string | number;
    label: string;
  }>;

  // Actions
  setBpm: (bpm: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsArmed: (armed: boolean) => void;
  setIsRecording: (recording: boolean) => void;
  togglePlayback: () => void; // Toggle play/pause state
  toggleRecording: () => void; // Toggle recording armed state
  setIsCountingIn: (countingIn: boolean) => void;
  setCountInStep: (step: number) => void;
  setCountInEnabled: (enabled: boolean) => void;
  setCountInBars: (bars: number) => void;
  setCurrentStep: (step: number) => void;
  setNumBars: (bars: number) => void;
  setPatternLength: (length: 16 | 32 | 64) => void; // Legacy
  setSwing: (swing: number) => void;
  setTimeSignature: (timeSignature: string) => void;
  setSnapSetting: (snap: string) => void;

  // FL Studio Recording Mode Actions
  setLoopRecordingEnabled: (enabled: boolean) => void;
  toggleLoopRecording: () => void;
  setBlendRecording: (enabled: boolean) => void;
  toggleBlendRecording: () => void;
  setRecordingFilter: (filter: Partial<{ notes: boolean; automation: boolean; audio: boolean }>) => void;
  setRecordingStartsPlayback: (enabled: boolean) => void;
  setDisarmOnStop: (enabled: boolean) => void;
  extendPatternForRecording: () => void; // Extend pattern by 1 bar during recording
  setWaitForInput: (enabled: boolean) => void;
  toggleWaitForInput: () => void;

  // Score Logger Actions
  addNoteToScoreLog: (note: { pitch: number; velocity: number; startTime: number; duration: number }) => void;
  clearScoreLog: () => void;
  dumpScoreLogToPattern: () => void; // Dumps last 3 min of notes to current pattern

  // Tap Tempo Actions
  tapTempo: () => void; // Records a tap and calculates new BPM
  resetTapTempo: () => void;

  // Input Quantize Actions
  setInputQuantize: (options: Partial<{ noteStartTime: boolean; noteEndTime: boolean; leaveDuration: boolean; recordToStepSequencer: boolean }>) => void;

  // Recording Session Actions (FL Studio style)
  startRecordingSession: () => void; // Snapshot current state before recording
  cancelRecordingSession: () => void; // Revert to pre-recording state
  commitRecordingSession: () => void; // Finalize recording (clear session data)
  recordNoteWithQuantize: (note: Omit<MidiNote, 'id'>) => void; // Record note with quantization applied
  recordStepWithQuantize: (trackId: string, stepIndex: number, velocity?: number) => void; // Record to step sequencer

  // Panic Mode - Stop all sounds immediately
  panicMode: () => void;

  // MIDI Learn Actions
  setMidiLearnMode: (enabled: boolean) => void;
  setMidiLearnTarget: (target: { type: string; id: string | number; label: string } | null) => void;
  addMidiMapping: (mapping: { type: 'note' | 'cc'; channel: number; value: number; targetType: string; targetId: string | number; label: string }) => void;
  removeMidiMapping: (id: string) => void;
  clearMidiMappings: () => void;
  loadMidiMappings: () => void;
  saveMidiMappings: () => void;

  // Arrangement playback actions
  setIsArrangementPlaying: (playing: boolean) => void;
  setArrangementPosition: (position: number) => void;
  playArrangement: () => void;
  stopArrangement: () => void;

  // Metronome actions
  setMetronomeEnabled: (enabled: boolean) => void;
  setMetronomeVolume: (volume: number) => void;

  // TRACK ACTIONS (new system)
  addTrack: (type: 'drum' | 'instrument', sample?: Sample) => string; // Returns track ID
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  assignSampleToTrack: (trackId: string, sample: Sample) => void;
  triggerTrack: (trackId: string, pitch?: number, velocity?: number, scheduledTime?: number) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  setSelectedTrackId: (trackId: string | null) => void;
  addStepToTrack: (trackId: string, stepIndex: number, velocity?: number) => void;
  removeStepFromTrack: (trackId: string, stepIndex: number) => void;
  setStepProbability: (trackId: string, stepIndex: number, probability: number) => void;
  setStepMicroTiming: (trackId: string, stepIndex: number, microTiming: number) => void;
  addMidiNoteToTrack: (trackId: string, note: Omit<MidiNote, 'id'>) => void;
  removeMidiNoteFromTrack: (trackId: string, noteId: string) => void;
  clearTrack: (trackId: string) => void;

  // Channel Group actions (FL Studio style)
  createChannelGroup: (name: string, color?: string) => string;
  deleteChannelGroup: (groupId: string) => void;
  updateChannelGroup: (groupId: string, updates: Partial<ChannelGroup>) => void;
  addTrackToGroup: (trackId: string, groupId: string) => void;
  removeTrackFromGroup: (trackId: string) => void;
  toggleGroupCollapsed: (groupId: string) => void;
  toggleGroupMute: (groupId: string) => void;
  toggleGroupSolo: (groupId: string) => void;
  setSelectedGroupId: (groupId: string | null) => void;
  getTracksInGroup: (groupId: string) => Track[];

  // Pad actions (legacy - for backward compatibility)
  assignSampleToPad: (padIndex: number, sample: Sample) => void;
  triggerPad: (padIndex: number, velocity?: number, scheduledTime?: number) => void | Promise<void>;
  setPadVolume: (padIndex: number, volume: number) => void;
  setPadPan: (padIndex: number, pan: number) => void;
  togglePadMute: (padIndex: number) => void;
  togglePadSolo: (padIndex: number) => void;
  setPadMode: (mode: PadMode) => void;
  setSelectedPadIndex: (padIndex: number | null) => void;
  setPadEffects: (padIndex: number, effects: Partial<PadEffects>) => void;

  // Sequencer actions
  toggleStep: (padIndex: number, stepIndex: number) => void;
  setStepVelocity: (padIndex: number, stepIndex: number, velocity: number) => void;
  setLegacyStepProbability: (padIndex: number, stepIndex: number, probability: number) => void;
  setLegacyStepMicroTiming: (padIndex: number, stepIndex: number, microTiming: number) => void;
  clearPattern: () => void;

  // Fill Steps & Rotate Steps (FL Studio style)
  fillSteps: (padIndex: number, interval: number, offset?: number) => void; // Fill every Nth step
  fillAllSteps: (padIndex: number) => void; // Fill all steps for a pad
  clearPadSteps: (padIndex: number) => void; // Clear all steps for a pad
  rotateSteps: (padIndex: number, amount: number) => void; // Rotate steps left (negative) or right (positive)
  rotateAllSteps: (amount: number) => void; // Rotate all pads' steps
  reverseSteps: (padIndex: number) => void; // Reverse step order for a pad
  randomizeSteps: (padIndex: number, density?: number) => void; // Random fill with density 0-1

  // Piano Roll actions
  addMidiNote: (note: Omit<MidiNote, 'id'>) => void;
  updateMidiNote: (id: string, updates: Partial<MidiNote>) => void;
  deleteMidiNote: (id: string) => void;
  clearMidiNotes: () => void;

  // Piano Roll Tool & Selection actions
  setPianoRollTool: (tool: 'draw' | 'paint' | 'paintDrum' | 'delete' | 'mute' | 'select' | 'slice' | 'chord') => void;
  setSelectedChordType: (chordType: string) => void;
  selectNote: (noteId: string, addToSelection?: boolean) => void;
  selectNotes: (noteIds: string[]) => void;
  selectAllNotes: () => void;
  deselectAllNotes: () => void;
  selectNotesInRange: (startTime: number, endTime: number, startPitch: number, endPitch: number) => void;
  toggleNoteSelection: (noteId: string) => void;
  copySelectedNotes: () => void;
  pasteNotes: (offsetTime?: number) => void;
  deleteSelectedNotes: () => void;
  toggleNoteMute: (noteId: string) => void;
  muteSelectedNotes: () => void;
  unmuteSelectedNotes: () => void;
  quantizeSelectedNotes: (snapValue?: number) => void;
  duplicateSelectedNotes: (offsetTime?: number) => void;
  moveSelectedNotes: (deltaTime: number, deltaPitch: number) => void;

  // Ghost Notes actions (FL Studio style)
  toggleGhostNotes: () => void; // Alt+V shortcut
  setShowGhostNotes: (show: boolean) => void;
  setGhostNoteChannels: (channelIds: string[]) => void;
  getGhostNotes: () => MidiNote[]; // Get notes from other tracks to display as ghosts

  // Snap to Scale actions (FL Studio style)
  toggleSnapToScale: () => void;
  setSnapToScale: (enabled: boolean) => void;
  setSelectedScale: (scale: string) => void;
  setScaleRootNote: (rootNote: number) => void;
  isNoteInScale: (pitch: number) => boolean; // Check if a pitch is in the current scale
  getScaleNotes: () => number[]; // Get array of pitches in scale (0-11 = C-B)
  snapPitchToScale: (pitch: number) => number; // Snap a pitch to nearest scale note

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
  setChorus: (amount: number) => void;
  setPhaser: (amount: number) => void;
  setFlanger: (amount: number) => void;
  setBitcrusher: (amount: number) => void;

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
  setPatternColor: (patternId: string, color: string) => void;
  clonePattern: (patternId: string) => string; // Returns new pattern ID
  movePattern: (patternId: string, newIndex: number) => void;
  selectPattern: (patternIndex: number) => void; // Select by pattern number (1-999)
  createNewPattern: (name?: string) => string; // Create empty pattern, returns ID
  getPatternByIndex: (index: number) => Pattern | undefined;

  // FL Studio Playback Mode
  setPlaybackMode: (mode: PlaybackMode) => void;
  togglePlaybackMode: () => void;

  // Channel Group actions
  createChannelGroup: (name: string, color?: string) => string; // Returns group ID
  deleteChannelGroup: (groupId: string) => void;
  renameChannelGroup: (groupId: string, newName: string) => void;
  setChannelGroupColor: (groupId: string, color: string) => void;
  assignChannelToGroup: (padIndex: number, groupId: string) => void;
  removeChannelFromGroup: (padIndex: number, groupId: string) => void;
  setChannelFilter: (filter: string | 'all' | 'unsorted') => void;
  toggleChannelGroupCollapsed: (groupId: string) => void;
  getFilteredChannels: () => number[]; // Returns pad indices matching current filter

  // Global swing and groove templates
  setGlobalSwing: (swing: number) => void;
  currentGrooveTemplate: string | null; // ID of currently applied groove template
  grooveAmount: number; // 0-100% how much groove to apply
  setGrooveTemplate: (templateId: string | null) => void;
  setGrooveAmount: (amount: number) => void;
  applyGrooveToPattern: () => void; // Apply current groove template to all steps

  // Arrangement actions
  addClipToArrangement: (patternId: string, startTime: number, track: number) => void;
  removeClipFromArrangement: (clipId: string) => void;
  moveClip: (clipId: string, newStartTime: number, newTrack: number) => void;
  resizeClip: (clipId: string, newDuration: number) => void;

  // Project restore action
  restoreProject: (projectData: {
    bpm?: number;
    timeSignature?: string;
    patterns?: Pattern[];
    arrangementClips?: ArrangementClip[];
    pads?: any[];
    steps?: Step[];
    tracks?: Track[];
    midiNotes?: MidiNote[];
    masterSettings?: any;
  }) => void;

  // MPC Studio Button Actions
  setNoteRepeatEnabled: (enabled: boolean) => void;
  setNoteRepeatRate: (rate: string) => void;
  toggleNoteRepeat: () => void;
  setLatchEnabled: (enabled: boolean) => void;
  toggleLatch: () => void;
  setFullLevelEnabled: (enabled: boolean) => void;
  toggleFullLevel: () => void;
  setHalfLevelEnabled: (enabled: boolean) => void;
  toggleHalfLevel: () => void;
  set16LevelEnabled: (enabled: boolean) => void;
  toggle16Level: (padIndex?: number) => void;
  setPadMuteMode: (enabled: boolean) => void;
  togglePadMuteMode: () => void;
  setTrackMuteMode: (enabled: boolean) => void;
  toggleTrackMuteMode: () => void;
  setEraseMode: (enabled: boolean) => void;
  toggleEraseMode: () => void;
  setOverdubEnabled: (enabled: boolean) => void;
  toggleOverdub: () => void;
  setShiftPressed: (pressed: boolean) => void;
  setActivePadBank: (bank: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H') => void;

  // Undo/Redo Actions
  pushUndoState: () => void;
  undo: () => void;
  redo: () => void;
  clearUndoHistory: () => void;

  // Quantize Actions
  setQuantizeEnabled: (enabled: boolean) => void;
  toggleQuantize: () => void;
  setQuantizeStrength: (strength: number) => void;
  quantizeCurrentPattern: () => void;

  // Zoom Actions
  setZoomLevel: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;

  // Mode Actions
  setCurrentMode: (mode: 'main' | 'browser' | 'sampler' | 'mixer' | 'config') => void;

  // MPC Transport Actions (additional)
  playFromStart: () => void;
  copyPattern: () => void;
  copyPatternToClipboard: () => void; // Copy current pattern data to clipboard
  pastePatternFromClipboard: () => void; // Paste clipboard data to current pattern
  deleteSelectedNotes: () => void;

  // Get effective velocity based on level modes
  getEffectiveVelocity: (padIndex: number, inputVelocity?: number) => number;
}

// createSynth is now imported from @/lib/audio/synthesizers

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
    effects: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.5,
      release: 0.3,
      filterFreq: 5000,
      filterQ: 1,
      pitch: 0,
      reverse: false,
    },
    envelope: null,
    filter: null,
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

/**
 * Calculate the number of steps based on bars and time signature
 * @param numBars - Number of bars (1-16)
 * @param timeSignature - Time signature string (e.g., '4/4', '3/4', '6/8', '7/8')
 * @returns Number of 16th note steps
 */
const calculateStepsFromBars = (numBars: number, timeSignature: string): number => {
  const [numerator, denominator] = timeSignature.split('/').map(Number);

  // Calculate steps per bar based on time signature
  // For x/4 time: numerator beats per bar, 4 sixteenth notes per beat = numerator * 4
  // For x/8 time: numerator eighth notes per bar, 2 sixteenth notes per eighth = numerator * 2
  const stepsPerBar = denominator === 8 ? numerator * 2 : numerator * 4;

  return numBars * stepsPerBar;
};

/**
 * Get the number of steps per bar for a given time signature
 */
const getStepsPerBar = (timeSignature: string): number => {
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  return denominator === 8 ? numerator * 2 : numerator * 4;
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

// Get color for track based on index
const TRACK_COLORS = [
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#84cc16', // lime
  '#eab308', // yellow
  '#f97316', // orange
  '#ec4899', // pink
  '#d946ef', // fuchsia
  '#a855f7', // purple
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#ef4444', // red
  '#f59e0b', // amber
  '#14b8a6', // teal
  '#0ea5e9', // sky
];

const getTrackColor = (index: number): string => {
  return TRACK_COLORS[index % TRACK_COLORS.length];
};

// Serializable pad data for persistence (without Tone.js objects)
interface SerializablePad {
  id: number;
  sample: Sample | null;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  note?: string;
}

// Convert pads to serializable format
const serializePads = (pads: Pad[]): SerializablePad[] => {
  return pads.map(pad => ({
    id: pad.id,
    sample: pad.sample,
    volume: pad.volume,
    pan: pad.pan,
    muted: pad.muted,
    solo: pad.solo,
    note: pad.note,
  }));
};

// Rehydrate pads with Tone.js objects
const rehydratePads = (serializedPads: SerializablePad[]): Pad[] => {
  return serializedPads.map(pad => {
    let synth = null;
    let player = null;

    if (pad.sample) {
      if (pad.sample.type === 'synth' && pad.sample.synthType) {
        synth = createSynth(pad.sample.synthType);
        if (synth) synth.volume.value = Tone.gainToDb(pad.volume);
      } else if (pad.sample.type === 'audio' && pad.sample.url) {
        // Only rehydrate non-blob URLs (built-in samples)
        if (!pad.sample.url.startsWith('blob:')) {
          player = new Tone.Player(pad.sample.url).connect(getMasterEffects().getInput());
          player.volume.value = Tone.gainToDb(pad.volume);
        }
      }
    }

    return {
      ...pad,
      synth,
      player,
    };
  });
};

export const useBeatStore = create<BeatStore>()(
  persist(
    (set, get) => ({
  bpm: 120,
  isPlaying: false,
  isArmed: false,
  isRecording: false,
  isCountingIn: false,
  countInStep: 0,
  countInEnabled: true, // Count-in enabled by default
  countInBars: 1, // 1 bar count-in by default
  currentStep: 0,

  // Arrangement playback
  isArrangementPlaying: false,
  arrangementPosition: 0,

  // Metronome
  metronomeEnabled: false,
  metronomeVolume: 0.5,

  // TRACK SYSTEM (new)
  tracks: [],
  selectedTrackId: null,

  // Channel Groups (FL Studio style)
  channelGroups: [],
  selectedGroupId: null,

  // Legacy pads (for backward compatibility)
  pads: createInitialPads(),
  padMode: 'drum',
  selectedPadIndex: null,
  steps: createInitialSteps(16, 16),
  numSteps: 16, // 1 bar * 16 steps per bar (4/4 time)
  numBars: 1, // Default to 1 bar
  patternLength: 16, // Legacy - kept for compatibility
  swing: 0,
  timeSignature: '4/4',
  snapSetting: 'step', // FL Studio default snap

  // Piano Roll (legacy)
  midiNotes: [],

  // Piano Roll Tools & Selection
  pianoRollTool: 'draw' as const,
  selectedNoteIds: [],
  noteClipboard: [],
  mutedNoteIds: [],
  selectedChordType: 'major', // Default chord type for chord stamp tool

  // Snap to Scale (FL Studio style)
  snapToScale: false, // Off by default
  selectedScale: 'Major', // Default to Major scale
  scaleRootNote: 0, // C (0 = C, 1 = C#, ..., 11 = B)

  // Ghost Notes (FL Studio style)
  showGhostNotes: true, // On by default like FL Studio
  ghostNoteChannels: [], // Empty = show all channels

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
    chorus: 0,
    phaser: 0,
    flanger: 0,
    bitcrusher: 0,
    limiterThreshold: -3,
  },

  // Patterns & Arrangement
  patterns: [],
  currentPatternId: null,
  currentPatternIndex: 1,
  arrangementClips: [],

  // FL Studio Features
  playbackMode: 'PAT' as PlaybackMode,
  channelGroups: [],
  currentChannelFilter: 'all',
  globalSwing: 0,
  currentGrooveTemplate: null,
  grooveAmount: 100,
  maxPatterns: 999,

  // MPC Studio Mode States
  noteRepeatEnabled: false,
  noteRepeatRate: '1/16',
  latchEnabled: false,
  fullLevelEnabled: false,
  halfLevelEnabled: false,
  sixteenLevelEnabled: false,
  sixteenLevelPadIndex: null,
  padMuteMode: false,
  trackMuteMode: false,
  eraseMode: false,
  overdubEnabled: false,
  shiftPressed: false,
  activePadBank: 'A' as const,

  // Undo/Redo System
  undoStack: [],
  redoStack: [],
  maxUndoSteps: 50,

  // Quantize Settings
  quantizeEnabled: true,
  quantizeStrength: 100,

  // Zoom Level
  zoomLevel: 1,

  // Current Mode
  currentMode: 'main' as const,

  // FL Studio Recording Mode Settings
  loopRecordingEnabled: true, // Default ON: recording loops at pattern end (FL Studio default)
  blendRecording: true, // Default ON: new notes blend with existing (overdub mode)
  recordingFilter: {
    notes: true, // Record MIDI notes
    automation: true, // Record automation
    audio: true, // Record audio
  },
  recordingStartsPlayback: true, // Pressing record also starts playback
  disarmOnStop: false, // Don't deselect record arm when stopped
  waitForInput: false, // Wait for MIDI input before starting recording

  // Score Logger - 3 minute MIDI buffer
  scoreLogger: {
    enabled: true, // Always on by default (FL Studio behavior)
    notes: [],
    maxDuration: 180000, // 3 minutes in ms
  },

  // Pattern Clipboard
  patternClipboard: null,

  // Tap Tempo
  tapTempoTimes: [],

  // Input Quantize Options
  inputQuantize: {
    noteStartTime: true, // Quantize note start (default)
    noteEndTime: false, // Don't quantize note end by default
    leaveDuration: false, // Don't leave duration by default
    recordToStepSequencer: false, // Record to piano roll by default
  },

  // Recording Session State (for cancel/revert)
  recordingSession: {
    isActive: false,
    preRecordingMidiNotes: [],
    preRecordingSteps: [],
    recordedNoteIds: [],
    recordedStepKeys: [],
  },

  // MIDI Learn Mode
  midiLearnMode: false,
  midiLearnTarget: null,
  midiMappings: [],

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
  setIsArmed: (armed) => set({ isArmed: armed }),
  setIsRecording: (recording) => set({ isRecording: recording }),

  // Toggle playback state
  togglePlayback: () => {
    const state = get();
    if (state.isPlaying) {
      set({ isPlaying: false });
    } else {
      // If armed for recording, start recording when play starts
      if (state.isArmed) {
        set({ isPlaying: true, isRecording: true });
      } else {
        set({ isPlaying: true });
      }
    }
  },

  // Toggle recording armed state
  toggleRecording: () => {
    const state = get();
    if (state.isArmed || state.isRecording) {
      set({ isArmed: false, isRecording: false, isCountingIn: false, countInStep: 0 });
    } else {
      set({ isArmed: true });
    }
  },

  setIsCountingIn: (countingIn) => set({ isCountingIn: countingIn }),
  setCountInStep: (step) => set({ countInStep: step }),
  setCountInEnabled: (enabled) => set({ countInEnabled: enabled }),
  setCountInBars: (bars) => set({ countInBars: bars }),
  setCurrentStep: (step) => set({ currentStep: step }),

  // Set number of bars (1-16) - recalculates numSteps based on time signature
  setNumBars: (bars) => {
    const timeSignature = get().timeSignature;
    const newNumSteps = calculateStepsFromBars(bars, timeSignature);

    set({
      numBars: bars,
      numSteps: newNumSteps,
      patternLength: newNumSteps as 16 | 32 | 64, // Legacy compatibility
      steps: createInitialSteps(16, newNumSteps)
    });
  },

  // Legacy - kept for compatibility
  setPatternLength: (length) => {
    set({ patternLength: length, numSteps: length });
    set({ steps: createInitialSteps(16, length) });
  },

  setSwing: (swing) => set({ swing }),

  // Set time signature - recalculates numSteps based on current numBars
  setTimeSignature: (timeSignature) => {
    const numBars = get().numBars;
    const newNumSteps = calculateStepsFromBars(numBars, timeSignature);

    set({
      timeSignature,
      numSteps: newNumSteps,
      patternLength: newNumSteps as 16 | 32 | 64, // Legacy compatibility
      steps: createInitialSteps(16, newNumSteps)
    });
  },

  setSnapSetting: (snap) => set({ snapSetting: snap }),

  // FL Studio Recording Mode Actions
  setLoopRecordingEnabled: (enabled) => set({ loopRecordingEnabled: enabled }),
  toggleLoopRecording: () => set((state) => ({ loopRecordingEnabled: !state.loopRecordingEnabled })),
  setBlendRecording: (enabled) => set({ blendRecording: enabled }),
  toggleBlendRecording: () => set((state) => ({ blendRecording: !state.blendRecording })),
  setRecordingFilter: (filter) => set((state) => ({
    recordingFilter: { ...state.recordingFilter, ...filter }
  })),
  setRecordingStartsPlayback: (enabled) => set({ recordingStartsPlayback: enabled }),
  setDisarmOnStop: (enabled) => set({ disarmOnStop: enabled }),

  // Extend pattern by 1 bar during recording (FL Studio pattern auto-extension)
  extendPatternForRecording: () => {
    const state = get();
    const newNumBars = state.numBars + 1;
    const newNumSteps = calculateStepsFromBars(newNumBars, state.timeSignature);

    // Preserve existing steps and add new empty ones
    const existingSteps = state.steps;
    const newSteps = createInitialSteps(16, newNumSteps);

    // Copy existing step data to new steps
    existingSteps.forEach(existingStep => {
      const matchingNewStep = newSteps.find(
        s => s.padIndex === existingStep.padIndex && s.stepIndex === existingStep.stepIndex
      );
      if (matchingNewStep) {
        matchingNewStep.active = existingStep.active;
        matchingNewStep.velocity = existingStep.velocity;
      }
    });

    set({
      numBars: newNumBars,
      numSteps: newNumSteps,
      patternLength: newNumSteps as 16 | 32 | 64,
      steps: newSteps,
    });

    console.log(`🎵 Pattern extended to ${newNumBars} bars (${newNumSteps} steps)`);
  },

  // Wait for Input
  setWaitForInput: (enabled) => set({ waitForInput: enabled }),
  toggleWaitForInput: () => set((state) => ({ waitForInput: !state.waitForInput })),

  // Score Logger Actions
  addNoteToScoreLog: (note) => {
    const state = get();
    const now = Date.now();
    const cutoffTime = now - state.scoreLogger.maxDuration;

    // Filter out old notes and add new one
    const filteredNotes = state.scoreLogger.notes.filter(n => n.startTime > cutoffTime);
    filteredNotes.push(note);

    set({
      scoreLogger: {
        ...state.scoreLogger,
        notes: filteredNotes,
      }
    });
  },

  clearScoreLog: () => set((state) => ({
    scoreLogger: { ...state.scoreLogger, notes: [] }
  })),

  dumpScoreLogToPattern: () => {
    const state = get();
    const notes = state.scoreLogger.notes;

    if (notes.length === 0) {
      console.log('📝 Score log is empty');
      return;
    }

    // Convert score log notes to MIDI notes for current pattern
    const bpm = state.bpm;
    const msPerBeat = 60000 / bpm;
    const msPerStep = msPerBeat / 4; // 16th notes

    // Find the earliest note to use as reference
    const earliestTime = Math.min(...notes.map(n => n.startTime));

    const newMidiNotes: MidiNote[] = notes.map((note, index) => ({
      id: `scoreLog_${Date.now()}_${index}`,
      pitch: note.pitch,
      velocity: note.velocity,
      startTime: Math.round((note.startTime - earliestTime) / msPerStep),
      duration: Math.max(1, Math.round(note.duration / msPerStep)),
    }));

    // Add to existing MIDI notes (blend mode)
    set({
      midiNotes: [...state.midiNotes, ...newMidiNotes],
    });

    console.log(`📝 Dumped ${newMidiNotes.length} notes from score log to pattern`);
  },

  // Tap Tempo Actions
  tapTempo: () => {
    const state = get();
    const now = Date.now();
    const taps = [...state.tapTempoTimes, now];

    // Only keep taps from last 3 seconds
    const recentTaps = taps.filter(t => now - t < 3000);

    if (recentTaps.length >= 2) {
      // Calculate average interval between taps
      const intervals: number[] = [];
      for (let i = 1; i < recentTaps.length; i++) {
        intervals.push(recentTaps[i] - recentTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);

      // Clamp BPM to valid range (40-240)
      const clampedBpm = Math.max(40, Math.min(240, newBpm));

      set({ bpm: clampedBpm, tapTempoTimes: recentTaps });
      Tone.getTransport().bpm.value = clampedBpm;
      console.log(`🎵 Tap Tempo: ${clampedBpm} BPM`);
    } else {
      set({ tapTempoTimes: recentTaps });
    }
  },

  resetTapTempo: () => set({ tapTempoTimes: [] }),

  // Input Quantize Actions
  setInputQuantize: (options) => set((state) => ({
    inputQuantize: { ...state.inputQuantize, ...options }
  })),

  // Recording Session Actions (FL Studio style)
  startRecordingSession: () => {
    const state = get();
    // Snapshot current state before recording starts
    set({
      recordingSession: {
        isActive: true,
        preRecordingMidiNotes: [...state.midiNotes],
        preRecordingSteps: [...state.steps],
        recordedNoteIds: [],
        recordedStepKeys: [],
      }
    });
    console.log('🎬 Recording session started - state snapshot saved');
  },

  cancelRecordingSession: () => {
    const state = get();
    if (!state.recordingSession.isActive) return;

    // Revert to pre-recording state
    set({
      midiNotes: state.recordingSession.preRecordingMidiNotes,
      steps: state.recordingSession.preRecordingSteps,
      isRecording: false,
      isPlaying: false,
      recordingSession: {
        isActive: false,
        preRecordingMidiNotes: [],
        preRecordingSteps: [],
        recordedNoteIds: [],
        recordedStepKeys: [],
      }
    });
    console.log('❌ Recording session cancelled - reverted to previous state');
  },

  commitRecordingSession: () => {
    // Finalize recording - clear session data but keep recorded notes
    set({
      recordingSession: {
        isActive: false,
        preRecordingMidiNotes: [],
        preRecordingSteps: [],
        recordedNoteIds: [],
        recordedStepKeys: [],
      }
    });
    console.log('✅ Recording session committed');
  },

  recordNoteWithQuantize: (noteData) => {
    const state = get();
    const { inputQuantize, snapSetting } = state;

    // Calculate quantization grid based on snap setting
    const getQuantizeGrid = (snap: string): number => {
      switch (snap) {
        case 'bar': return 16; // 16 sixteenths per bar
        case 'beat': return 4; // 4 sixteenths per beat
        case 'step': return 1; // 1 sixteenth
        case '1/2': return 8; // Half note
        case '1/4': return 4; // Quarter note
        case '1/8': return 2; // Eighth note
        case '1/16': return 1; // Sixteenth note
        case '1/32': return 0.5; // 32nd note
        case 'none': return 0; // No quantization
        default: return 1; // Default to step
      }
    };

    const grid = getQuantizeGrid(snapSetting);
    let { startTime, duration } = noteData;

    // Apply quantization based on settings
    if (grid > 0) {
      if (inputQuantize.noteStartTime) {
        startTime = Math.round(startTime / grid) * grid;
      }
      if (inputQuantize.noteEndTime) {
        const endTime = startTime + duration;
        const quantizedEnd = Math.round(endTime / grid) * grid;
        duration = inputQuantize.leaveDuration ? duration : Math.max(1, quantizedEnd - startTime);
      }
    }

    // Create the note with quantized values
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const note: MidiNote = {
      id: noteId,
      pitch: noteData.pitch,
      startTime,
      duration: Math.max(1, duration),
      velocity: noteData.velocity,
      sampleId: noteData.sampleId,
    };

    // Add to midiNotes
    set((s) => ({
      midiNotes: [...s.midiNotes, note],
      recordingSession: {
        ...s.recordingSession,
        recordedNoteIds: [...s.recordingSession.recordedNoteIds, noteId],
      }
    }));

    console.log('🎵 Recorded note with quantize:', note);
  },

  recordStepWithQuantize: (trackId, stepIndex, velocity = 0.8) => {
    const state = get();
    const { inputQuantize, snapSetting } = state;

    // Calculate quantization grid
    const getQuantizeGrid = (snap: string): number => {
      switch (snap) {
        case 'bar': return 16;
        case 'beat': return 4;
        case 'step': return 1;
        case '1/2': return 8;
        case '1/4': return 4;
        case '1/8': return 2;
        case '1/16': return 1;
        case 'none': return 0;
        default: return 1;
      }
    };

    const grid = getQuantizeGrid(snapSetting);
    let quantizedStep = stepIndex;

    // Apply quantization to step position
    if (grid > 0 && inputQuantize.noteStartTime) {
      quantizedStep = Math.round(stepIndex / grid) * grid;
    }

    // Find the track and add the step
    const tracks = [...state.tracks];
    const track = tracks.find(t => t.id === trackId);
    if (!track || track.type !== 'drum') return;

    // Check if step already exists
    const existingStep = track.steps.find(s => s.stepIndex === quantizedStep);
    if (existingStep && existingStep.active) return; // Already active

    // Add or update step
    if (existingStep) {
      existingStep.active = true;
      existingStep.velocity = velocity;
    } else {
      track.steps.push({
        padIndex: 0, // Legacy field
        stepIndex: quantizedStep,
        velocity,
        active: true,
      });
    }

    const stepKey = `${trackId}_${quantizedStep}`;
    set({
      tracks,
      recordingSession: {
        ...state.recordingSession,
        recordedStepKeys: [...state.recordingSession.recordedStepKeys, stepKey],
      }
    });

    console.log('🥁 Recorded step with quantize:', { trackId, stepIndex: quantizedStep, velocity });
  },

  // Panic Mode - Stop all sounds immediately
  panicMode: () => {
    // Stop all transport and audio
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    // Release all synths
    const state = get();
    state.pads.forEach(pad => {
      if (pad.synth && typeof pad.synth.releaseAll === 'function') {
        pad.synth.releaseAll();
      }
      if (pad.player && pad.player.state === 'started') {
        pad.player.stop();
      }
    });

    state.tracks.forEach(track => {
      if (track.synth && typeof track.synth.releaseAll === 'function') {
        track.synth.releaseAll();
      }
      if (track.player && track.player.state === 'started') {
        track.player.stop();
      }
      if (track.sampler && typeof track.sampler.releaseAll === 'function') {
        track.sampler.releaseAll();
      }
    });

    set({
      isPlaying: false,
      isRecording: false,
      isCountingIn: false,
      countInStep: 0,
      currentStep: 0
    });

    console.log('🚨 PANIC MODE: All sounds stopped');
  },

  // MIDI Learn Actions
  setMidiLearnMode: (enabled) => {
    set({ midiLearnMode: enabled });
    if (!enabled) {
      set({ midiLearnTarget: null });
    }
    console.log(`🎹 MIDI Learn Mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  },

  setMidiLearnTarget: (target) => {
    set({ midiLearnTarget: target });
    if (target) {
      console.log(`🎹 MIDI Learn Target: ${target.label} (${target.type}:${target.id})`);
    }
  },

  addMidiMapping: (mapping) => {
    const state = get();
    const id = `midi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMapping = { ...mapping, id };

    // Remove existing mapping for same MIDI message
    const filteredMappings = state.midiMappings.filter(
      m => !(m.type === mapping.type && m.channel === mapping.channel && m.value === mapping.value)
    );

    set({
      midiMappings: [...filteredMappings, newMapping],
      midiLearnMode: false,
      midiLearnTarget: null,
    });

    console.log(`🎹 MIDI Mapping added: ${mapping.label} -> ${mapping.type} Ch${mapping.channel} ${mapping.value}`);
    get().saveMidiMappings();
  },

  removeMidiMapping: (id) => {
    const state = get();
    const mapping = state.midiMappings.find(m => m.id === id);
    set({
      midiMappings: state.midiMappings.filter(m => m.id !== id),
    });
    if (mapping) {
      console.log(`🎹 MIDI Mapping removed: ${mapping.label}`);
    }
    get().saveMidiMappings();
  },

  clearMidiMappings: () => {
    set({ midiMappings: [] });
    console.log('🎹 All MIDI mappings cleared');
    get().saveMidiMappings();
  },

  loadMidiMappings: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('midiMappings');
      if (saved) {
        try {
          const mappings = JSON.parse(saved);
          set({ midiMappings: mappings });
          console.log(`🎹 Loaded ${mappings.length} MIDI mappings`);
        } catch (e) {
          console.error('Failed to load MIDI mappings:', e);
        }
      }
    }
  },

  saveMidiMappings: () => {
    if (typeof window !== 'undefined') {
      const mappings = get().midiMappings;
      localStorage.setItem('midiMappings', JSON.stringify(mappings));
      console.log(`🎹 Saved ${mappings.length} MIDI mappings`);
    }
  },

  // Metronome actions
  setMetronomeEnabled: (enabled) => set({ metronomeEnabled: enabled }),
  setMetronomeVolume: (volume) => set({ metronomeVolume: volume }),

  // TRACK ACTIONS (new system)
  addTrack: (type, sample) => {
    const trackId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const numSteps = get().numSteps;

    // Create audio engine based on type
    let player = null;
    let sampler = null;
    let synth = null;

    if (sample) {
      if (type === 'drum' && sample.type === 'audio' && sample.url) {
        // Drum track: one-shot player
        player = new Tone.Player(sample.url).connect(getMasterEffects().getInput());
        player.volume.value = Tone.gainToDb(0.8);
      } else if (type === 'instrument' && sample.type === 'audio' && sample.url) {
        // Instrument track: chromatic sampler
        sampler = new Tone.Sampler({
          urls: { 'C2': sample.url },
          baseUrl: '',
        }).connect(getMasterEffects().getInput());
        sampler.volume.value = Tone.gainToDb(0.8);
      } else if (sample.type === 'synth' && sample.synthType) {
        synth = createSynth(sample.synthType);
        if (synth) synth.volume.value = Tone.gainToDb(0.8);
      }
    }

    const newTrack: Track = {
      id: trackId,
      name: sample?.name || `${type === 'drum' ? 'Drum' : 'Instrument'} Track ${get().tracks.length + 1}`,
      type,
      sample,
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      color: getTrackColor(get().tracks.length),
      player,
      sampler,
      synth,
      steps: type === 'drum' ? Array.from({ length: numSteps }, (_, i) => ({
        padIndex: get().tracks.length, // Use track index
        stepIndex: i,
        velocity: 0.8,
        active: false,
      })) : [],
      midiNotes: type === 'instrument' ? [] : [],
      effects: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.5,
        release: 0.1,
        filterFreq: 20000,
        filterQ: 1,
        pitch: 0,
        reverse: false,
      },
      envelope: null,
      filter: null,
    };

    set({ tracks: [...get().tracks, newTrack] });
    console.log(`✅ Created ${type} track:`, trackId, sample?.name);
    return trackId;
  },

  removeTrack: (trackId) => {
    const tracks = get().tracks;
    const track = tracks.find(t => t.id === trackId);

    // Dispose audio resources
    if (track) {
      if (track.player) track.player.dispose();
      if (track.sampler) track.sampler.dispose();
      if (track.synth) track.synth.dispose();
      if (track.envelope) track.envelope.dispose();
      if (track.filter) track.filter.dispose();
    }

    set({ tracks: tracks.filter(t => t.id !== trackId) });
  },

  updateTrack: (trackId, updates) => {
    set({
      tracks: get().tracks.map(t =>
        t.id === trackId ? { ...t, ...updates } : t
      )
    });
  },

  assignSampleToTrack: (trackId, sample) => {
    const tracks = [...get().tracks];
    const trackIndex = tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) return;

    const track = tracks[trackIndex];

    // Dispose old audio resources
    if (track.player) track.player.dispose();
    if (track.sampler) track.sampler.dispose();
    if (track.synth) track.synth.dispose();

    // Create new audio engine
    let player = null;
    let sampler = null;
    let synth = null;

    if (track.type === 'drum' && sample.type === 'audio' && sample.url) {
      player = new Tone.Player(sample.url).connect(getMasterEffects().getInput());
      player.volume.value = Tone.gainToDb(track.volume);
    } else if (track.type === 'instrument' && sample.type === 'audio' && sample.url) {
      sampler = new Tone.Sampler({
        urls: { 'C2': sample.url },
        baseUrl: '',
      }).connect(getMasterEffects().getInput());
      sampler.volume.value = Tone.gainToDb(track.volume);
    } else if (sample.type === 'synth' && sample.synthType) {
      synth = createSynth(sample.synthType);
      if (synth) synth.volume.value = Tone.gainToDb(track.volume);
    }

    tracks[trackIndex] = {
      ...track,
      sample,
      player,
      sampler,
      synth,
      name: sample.name,
    };

    set({ tracks });
  },

  triggerTrack: (trackId, pitch, velocity = 0.8, scheduledTime) => {
    const track = get().tracks.find(t => t.id === trackId);
    if (!track || track.muted) return;

    const time = scheduledTime || Tone.now();

    if (track.type === 'drum' && track.player && track.player.loaded) {
      // Drum track: trigger one-shot
      track.player.start(time);
    } else if (track.type === 'instrument' && track.sampler && pitch !== undefined) {
      // Instrument track: trigger chromatic note
      const midiNote = Tone.Frequency(pitch, 'midi').toNote();
      track.sampler.triggerAttackRelease(midiNote, '8n', time, velocity);
    } else if (track.synth) {
      // Synth track
      if (pitch !== undefined) {
        const midiNote = Tone.Frequency(pitch, 'midi').toNote();
        track.synth.triggerAttackRelease(midiNote, '8n', time, velocity);
      } else {
        track.synth.triggerAttackRelease('16n', time, velocity);
      }
    }
  },

  setTrackVolume: (trackId, volume) => {
    const tracks = [...get().tracks];
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    track.volume = volume;
    const dbVolume = Tone.gainToDb(volume);

    if (track.player) track.player.volume.value = dbVolume;
    if (track.sampler) track.sampler.volume.value = dbVolume;
    if (track.synth) track.synth.volume.value = dbVolume;

    set({ tracks });
  },

  setTrackPan: (trackId, pan) => {
    set({
      tracks: get().tracks.map(t =>
        t.id === trackId ? { ...t, pan } : t
      )
    });
  },

  toggleTrackMute: (trackId) => {
    set({
      tracks: get().tracks.map(t =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      )
    });
  },

  toggleTrackSolo: (trackId) => {
    set({
      tracks: get().tracks.map(t =>
        t.id === trackId ? { ...t, solo: !t.solo } : t
      )
    });
  },

  setSelectedTrackId: (trackId) => set({ selectedTrackId: trackId }),

  addStepToTrack: (trackId, stepIndex, velocity = 0.8) => {
    const tracks = [...get().tracks];
    const track = tracks.find(t => t.id === trackId);
    if (!track || track.type !== 'drum') return;

    const stepIdx = track.steps.findIndex(s => s.stepIndex === stepIndex);
    if (stepIdx !== -1) {
      track.steps[stepIdx].active = true;
      track.steps[stepIdx].velocity = velocity;
    }

    set({ tracks });
  },

  removeStepFromTrack: (trackId, stepIndex) => {
    const tracks = [...get().tracks];
    const track = tracks.find(t => t.id === trackId);
    if (!track || track.type !== 'drum') return;

    const stepIdx = track.steps.findIndex(s => s.stepIndex === stepIndex);
    if (stepIdx !== -1) {
      track.steps[stepIdx].active = false;
    }

    set({ tracks });
  },

  setStepProbability: (trackId, stepIndex, probability) => {
    const tracks = [...get().tracks];
    const track = tracks.find(t => t.id === trackId);
    if (!track || track.type !== 'drum') return;

    const stepIdx = track.steps.findIndex(s => s.stepIndex === stepIndex);
    if (stepIdx !== -1) {
      track.steps[stepIdx].probability = Math.max(0, Math.min(100, probability));
      console.log(`🎲 Step ${stepIndex + 1} probability set to ${probability}%`);
    }

    set({ tracks });
  },

  setStepMicroTiming: (trackId, stepIndex, microTiming) => {
    const tracks = [...get().tracks];
    const track = tracks.find(t => t.id === trackId);
    if (!track || track.type !== 'drum') return;

    const stepIdx = track.steps.findIndex(s => s.stepIndex === stepIndex);
    if (stepIdx !== -1) {
      track.steps[stepIdx].microTiming = Math.max(-50, Math.min(50, microTiming));
      console.log(`⏱️ Step ${stepIndex + 1} microtiming set to ${microTiming}ms`);
    }

    set({ tracks });
  },

  addMidiNoteToTrack: (trackId, note) => {
    const tracks = [...get().tracks];
    const track = tracks.find(t => t.id === trackId);
    if (!track || track.type !== 'instrument') return;

    const newNote: MidiNote = {
      ...note,
      id: `note_${Date.now()}_${Math.random()}`,
    };

    track.midiNotes.push(newNote);
    set({ tracks });
  },

  removeMidiNoteFromTrack: (trackId, noteId) => {
    const tracks = [...get().tracks];
    const track = tracks.find(t => t.id === trackId);
    if (!track || track.type !== 'instrument') return;

    track.midiNotes = track.midiNotes.filter(n => n.id !== noteId);
    set({ tracks });
  },

  clearTrack: (trackId) => {
    const tracks = [...get().tracks];
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    if (track.type === 'drum') {
      track.steps.forEach(s => s.active = false);
    } else {
      track.midiNotes = [];
    }

    set({ tracks });
  },

  // Channel Group actions (FL Studio style)
  createChannelGroup: (name, color = '#6b7280') => {
    const groupId = `group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newGroup: ChannelGroup = {
      id: groupId,
      name,
      color,
      collapsed: false,
      muted: false,
      solo: false,
    };
    set({ channelGroups: [...get().channelGroups, newGroup] });
    console.log(`📁 Created channel group: ${name}`);
    return groupId;
  },

  deleteChannelGroup: (groupId) => {
    // Remove group assignment from all tracks in this group
    const tracks = get().tracks.map(t =>
      t.groupId === groupId ? { ...t, groupId: undefined } : t
    );
    const channelGroups = get().channelGroups.filter(g => g.id !== groupId);
    set({ channelGroups, tracks });
    console.log(`🗑️ Deleted channel group: ${groupId}`);
  },

  updateChannelGroup: (groupId, updates) => {
    set({
      channelGroups: get().channelGroups.map(g =>
        g.id === groupId ? { ...g, ...updates } : g
      )
    });
    console.log(`📁 Updated channel group: ${groupId}`, updates);
  },

  addTrackToGroup: (trackId, groupId) => {
    set({
      tracks: get().tracks.map(t =>
        t.id === trackId ? { ...t, groupId } : t
      )
    });
    const track = get().tracks.find(t => t.id === trackId);
    const group = get().channelGroups.find(g => g.id === groupId);
    console.log(`📁 Added track "${track?.name}" to group "${group?.name}"`);
  },

  removeTrackFromGroup: (trackId) => {
    const track = get().tracks.find(t => t.id === trackId);
    set({
      tracks: get().tracks.map(t =>
        t.id === trackId ? { ...t, groupId: undefined } : t
      )
    });
    console.log(`📁 Removed track "${track?.name}" from group`);
  },

  toggleGroupCollapsed: (groupId) => {
    const group = get().channelGroups.find(g => g.id === groupId);
    set({
      channelGroups: get().channelGroups.map(g =>
        g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
      )
    });
    console.log(`📁 Group "${group?.name}" ${group?.collapsed ? 'expanded' : 'collapsed'}`);
  },

  toggleGroupMute: (groupId) => {
    const group = get().channelGroups.find(g => g.id === groupId);
    const newMuted = !group?.muted;

    // Toggle mute on the group
    set({
      channelGroups: get().channelGroups.map(g =>
        g.id === groupId ? { ...g, muted: newMuted } : g
      )
    });

    // Also mute/unmute all tracks in this group
    set({
      tracks: get().tracks.map(t =>
        t.groupId === groupId ? { ...t, muted: newMuted } : t
      )
    });
    console.log(`${newMuted ? '🔇' : '🔊'} Group "${group?.name}" ${newMuted ? 'muted' : 'unmuted'} (${get().tracks.filter(t => t.groupId === groupId).length} tracks)`);
  },

  toggleGroupSolo: (groupId) => {
    const group = get().channelGroups.find(g => g.id === groupId);
    const newSolo = !group?.solo;

    // Toggle solo on the group
    set({
      channelGroups: get().channelGroups.map(g =>
        g.id === groupId ? { ...g, solo: newSolo } : g
      )
    });

    // Also solo/unsolo all tracks in this group
    set({
      tracks: get().tracks.map(t =>
        t.groupId === groupId ? { ...t, solo: newSolo } : t
      )
    });
    console.log(`${newSolo ? '🎯' : '⬜'} Group "${group?.name}" ${newSolo ? 'soloed' : 'unsoloed'} (${get().tracks.filter(t => t.groupId === groupId).length} tracks)`);
  },

  setSelectedGroupId: (groupId) => {
    set({ selectedGroupId: groupId });
    if (groupId) {
      const group = get().channelGroups.find(g => g.id === groupId);
      console.log(`📁 Selected group: ${group?.name}`);
    }
  },

  getTracksInGroup: (groupId) => {
    return get().tracks.filter(t => t.groupId === groupId);
  },

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
          player = new Tone.Player(sample.url).connect(getMasterEffects().getInput());
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
        player = new Tone.Player(sample.url).connect(getMasterEffects().getInput());
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
  
  triggerPad: async (padIndex, velocity = 0.8, scheduledTime?: number) => {
    const pads = get().pads;
    const pad = pads[padIndex];

    // Check mute state
    if (pad.muted || !pad.sample) return;

    // Check solo state - if any pad is soloed, only play soloed pads
    const hasSolo = pads.some(p => p.solo);
    if (hasSolo && !pad.solo) return;

    // For immediate playback (no scheduled time), ensure audio context is started
    // This handles browser autoplay policy on first user interaction
    if (scheduledTime === undefined && Tone.getContext().state !== 'running') {
      await Tone.start();
    }

    // Use scheduled time if provided (from sequencer), otherwise use current time
    // This ensures precise timing when triggered from the transport
    const time = scheduledTime !== undefined ? scheduledTime : Tone.now();
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
  },
  
  setPadVolume: (padIndex, volume) => {
    const pads = [...get().pads];
    pads[padIndex].volume = volume;
    // Update synth volume
    if (pads[padIndex].synth) {
      pads[padIndex].synth!.volume.value = Tone.gainToDb(volume);
    }
    // Update player volume
    if (pads[padIndex].player) {
      pads[padIndex].player!.volume.value = Tone.gainToDb(volume);
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

  setSelectedPadIndex: (padIndex) => {
    set({ selectedPadIndex: padIndex });
  },

  setPadEffects: (padIndex, effects) => {
    const pads = [...get().pads];
    pads[padIndex].effects = { ...pads[padIndex].effects, ...effects };

    // Apply effects to the player if it exists
    const pad = pads[padIndex];
    if (pad.player) {
      // Apply pitch shift
      if (effects.pitch !== undefined) {
        const pitchRatio = getPitchRatio(effects.pitch);
        pad.player.playbackRate = pitchRatio;
      }

      // Apply reverse
      if (effects.reverse !== undefined) {
        pad.player.reverse = effects.reverse;
      }
    }

    set({ pads });
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

  // Per-step probability (FL Studio style - for legacy steps)
  setLegacyStepProbability: (padIndex, stepIndex, probability) => {
    const steps = [...get().steps];
    const stepIdx = steps.findIndex(
      s => s.padIndex === padIndex && s.stepIndex === stepIndex
    );
    if (stepIdx !== -1) {
      steps[stepIdx].probability = Math.max(0, Math.min(100, probability));
      set({ steps });
      console.log(`🎲 Pad ${padIndex + 1} Step ${stepIndex + 1} probability set to ${probability}%`);
    }
  },

  // Per-step microtiming (FL Studio style - for legacy steps)
  setLegacyStepMicroTiming: (padIndex, stepIndex, microTiming) => {
    const steps = [...get().steps];
    const stepIdx = steps.findIndex(
      s => s.padIndex === padIndex && s.stepIndex === stepIndex
    );
    if (stepIdx !== -1) {
      steps[stepIdx].microTiming = Math.max(-50, Math.min(50, microTiming));
      set({ steps });
      console.log(`⏱️ Pad ${padIndex + 1} Step ${stepIndex + 1} microtiming set to ${microTiming}ms`);
    }
  },

  clearPattern: () => {
    const { patternLength } = get();
    set({ steps: createInitialSteps(16, patternLength) });
  },

  // Fill Steps & Rotate Steps (FL Studio style)
  fillSteps: (padIndex, interval, offset = 0) => {
    get().pushUndoState();
    const steps = [...get().steps];
    const numSteps = get().numSteps;

    for (let i = 0; i < numSteps; i++) {
      const stepIdx = steps.findIndex(
        s => s.padIndex === padIndex && s.stepIndex === i
      );
      if (stepIdx !== -1) {
        // Fill every Nth step starting from offset
        steps[stepIdx].active = (i - offset) % interval === 0 && i >= offset;
        if (steps[stepIdx].active) {
          steps[stepIdx].velocity = 0.8;
        }
      }
    }
    set({ steps });
  },

  fillAllSteps: (padIndex) => {
    get().pushUndoState();
    const steps = [...get().steps];
    const numSteps = get().numSteps;

    for (let i = 0; i < numSteps; i++) {
      const stepIdx = steps.findIndex(
        s => s.padIndex === padIndex && s.stepIndex === i
      );
      if (stepIdx !== -1) {
        steps[stepIdx].active = true;
        steps[stepIdx].velocity = 0.8;
      }
    }
    set({ steps });
  },

  clearPadSteps: (padIndex) => {
    get().pushUndoState();
    const steps = [...get().steps];

    steps.forEach((step, idx) => {
      if (step.padIndex === padIndex) {
        steps[idx].active = false;
      }
    });
    set({ steps });
  },

  rotateSteps: (padIndex, amount) => {
    get().pushUndoState();
    const steps = [...get().steps];
    const numSteps = get().numSteps;

    // Get current pad's step states
    const padSteps = steps
      .filter(s => s.padIndex === padIndex)
      .sort((a, b) => a.stepIndex - b.stepIndex);

    // Extract active states and velocities
    const states = padSteps.map(s => ({ active: s.active, velocity: s.velocity }));

    // Rotate the states array
    const rotatedStates = [...states];
    for (let i = 0; i < numSteps; i++) {
      // Calculate new position with wrap-around
      let newPos = (i + amount) % numSteps;
      if (newPos < 0) newPos += numSteps;
      rotatedStates[newPos] = states[i];
    }

    // Apply rotated states back to steps
    padSteps.forEach((step, i) => {
      const stepIdx = steps.findIndex(
        s => s.padIndex === padIndex && s.stepIndex === step.stepIndex
      );
      if (stepIdx !== -1) {
        steps[stepIdx].active = rotatedStates[i].active;
        steps[stepIdx].velocity = rotatedStates[i].velocity;
      }
    });

    set({ steps });
  },

  rotateAllSteps: (amount) => {
    get().pushUndoState();
    const pads = get().pads;

    // Rotate each pad's steps
    pads.forEach((_, padIndex) => {
      // Call rotateSteps without pushing undo (already pushed above)
      const steps = [...get().steps];
      const numSteps = get().numSteps;

      const padSteps = steps
        .filter(s => s.padIndex === padIndex)
        .sort((a, b) => a.stepIndex - b.stepIndex);

      const states = padSteps.map(s => ({ active: s.active, velocity: s.velocity }));
      const rotatedStates = [...states];

      for (let i = 0; i < numSteps; i++) {
        let newPos = (i + amount) % numSteps;
        if (newPos < 0) newPos += numSteps;
        rotatedStates[newPos] = states[i];
      }

      padSteps.forEach((step, i) => {
        const stepIdx = steps.findIndex(
          s => s.padIndex === padIndex && s.stepIndex === step.stepIndex
        );
        if (stepIdx !== -1) {
          steps[stepIdx].active = rotatedStates[i].active;
          steps[stepIdx].velocity = rotatedStates[i].velocity;
        }
      });

      set({ steps });
    });
  },

  reverseSteps: (padIndex) => {
    get().pushUndoState();
    const steps = [...get().steps];
    const numSteps = get().numSteps;

    const padSteps = steps
      .filter(s => s.padIndex === padIndex)
      .sort((a, b) => a.stepIndex - b.stepIndex);

    const states = padSteps.map(s => ({ active: s.active, velocity: s.velocity }));
    const reversedStates = [...states].reverse();

    padSteps.forEach((step, i) => {
      const stepIdx = steps.findIndex(
        s => s.padIndex === padIndex && s.stepIndex === step.stepIndex
      );
      if (stepIdx !== -1) {
        steps[stepIdx].active = reversedStates[i].active;
        steps[stepIdx].velocity = reversedStates[i].velocity;
      }
    });

    set({ steps });
  },

  randomizeSteps: (padIndex, density = 0.5) => {
    get().pushUndoState();
    const steps = [...get().steps];
    const numSteps = get().numSteps;

    for (let i = 0; i < numSteps; i++) {
      const stepIdx = steps.findIndex(
        s => s.padIndex === padIndex && s.stepIndex === i
      );
      if (stepIdx !== -1) {
        steps[stepIdx].active = Math.random() < density;
        if (steps[stepIdx].active) {
          // Random velocity between 0.5 and 1.0
          steps[stepIdx].velocity = 0.5 + Math.random() * 0.5;
        }
      }
    }
    set({ steps });
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

  // Piano Roll Tool & Selection actions
  setPianoRollTool: (tool) => set({ pianoRollTool: tool }),

  setSelectedChordType: (chordType) => {
    set({ selectedChordType: chordType });
    console.log(`🎹 Chord type changed to: ${chordType}`);
  },

  selectNote: (noteId, addToSelection = false) => {
    set((state) => ({
      selectedNoteIds: addToSelection
        ? [...state.selectedNoteIds, noteId]
        : [noteId],
    }));
    console.log(`🎹 Note selected: ${noteId}`, { addToSelection });
  },

  selectNotes: (noteIds) => {
    set({ selectedNoteIds: noteIds });
    console.log(`🎹 Selected ${noteIds.length} notes`);
  },

  selectAllNotes: () => {
    const notes = get().midiNotes;
    set({ selectedNoteIds: notes.map((n) => n.id) });
    console.log(`🎹 Selected ALL notes (${notes.length} total)`);
  },

  deselectAllNotes: () => {
    set({ selectedNoteIds: [] });
    console.log('🎹 Deselected all notes');
  },

  selectNotesInRange: (startTime, endTime, startPitch, endPitch) => {
    const minTime = Math.min(startTime, endTime);
    const maxTime = Math.max(startTime, endTime);
    const minPitch = Math.min(startPitch, endPitch);
    const maxPitch = Math.max(startPitch, endPitch);

    const state = get();
    const selectedIds = state.midiNotes
      .filter((note) =>
        note.startTime >= minTime &&
        note.startTime + note.duration <= maxTime + 1 &&
        note.pitch >= minPitch &&
        note.pitch <= maxPitch
      )
      .map((n) => n.id);

    set({ selectedNoteIds: selectedIds });
    console.log(`🎹 Selected ${selectedIds.length} notes in range`, { startTime: minTime, endTime: maxTime, startPitch: minPitch, endPitch: maxPitch });
  },

  toggleNoteSelection: (noteId) => {
    const state = get();
    const wasSelected = state.selectedNoteIds.includes(noteId);
    set({
      selectedNoteIds: wasSelected
        ? state.selectedNoteIds.filter((id) => id !== noteId)
        : [...state.selectedNoteIds, noteId],
    });
    console.log(`🎹 Note ${wasSelected ? 'deselected' : 'added to selection'}: ${noteId}`);
  },

  copySelectedNotes: () => {
    const state = get();
    const selectedNotes = state.midiNotes.filter((n) =>
      state.selectedNoteIds.includes(n.id)
    );
    if (selectedNotes.length === 0) {
      console.log('📋 Copy failed - no notes selected');
      return;
    }

    // Find the earliest start time to normalize positions
    const minStartTime = Math.min(...selectedNotes.map((n) => n.startTime));
    const normalizedNotes = selectedNotes.map((n) => ({
      ...n,
      startTime: n.startTime - minStartTime,
    }));

    set({ noteClipboard: normalizedNotes });
    console.log(`📋 Copied ${normalizedNotes.length} notes to clipboard`);
  },

  pasteNotes: (offsetTime = 0) => {
    const state = get();
    if (state.noteClipboard.length === 0) {
      console.log('📋 Paste failed - clipboard empty');
      return;
    }

    // Paste at current step position or specified offset
    const pastePosition = offsetTime || state.currentStep;
    const newNotes = state.noteClipboard.map((note) => ({
      ...note,
      id: `note-${Date.now()}-${Math.random()}`,
      startTime: note.startTime + pastePosition,
    }));

    set((s) => ({
      midiNotes: [...s.midiNotes, ...newNotes],
      selectedNoteIds: newNotes.map((n) => n.id),
    }));
    console.log(`📋 Pasted ${newNotes.length} notes at position ${pastePosition}`);
  },

  deleteSelectedNotes: () => {
    const state = get();
    if (state.selectedNoteIds.length === 0) {
      console.log('🗑️ Delete failed - no notes selected');
      return;
    }
    get().pushUndoState();
    const deleteCount = state.selectedNoteIds.length;
    set((s) => ({
      midiNotes: s.midiNotes.filter(
        (n) => !s.selectedNoteIds.includes(n.id)
      ),
      selectedNoteIds: [],
    }));
    console.log(`🗑️ Deleted ${deleteCount} selected notes`);
  },

  toggleNoteMute: (noteId) => {
    const state = get();
    const wasMuted = state.mutedNoteIds.includes(noteId);
    set({
      mutedNoteIds: wasMuted
        ? state.mutedNoteIds.filter((id) => id !== noteId)
        : [...state.mutedNoteIds, noteId],
    });
    console.log(`🔇 Note ${wasMuted ? 'unmuted' : 'muted'}: ${noteId}`);
  },

  muteSelectedNotes: () => {
    const state = get();
    const newMutedIds = [...new Set([...state.mutedNoteIds, ...state.selectedNoteIds])];
    set({ mutedNoteIds: newMutedIds });
    console.log(`🔇 Muted ${state.selectedNoteIds.length} selected notes`);
  },

  unmuteSelectedNotes: () => {
    const state = get();
    set({
      mutedNoteIds: state.mutedNoteIds.filter(
        (id) => !state.selectedNoteIds.includes(id)
      ),
    });
    console.log(`🔊 Unmuted ${state.selectedNoteIds.length} selected notes`);
  },

  quantizeSelectedNotes: (snapValue = 4) => {
    const state = get();
    const noteIds = state.selectedNoteIds.length > 0
      ? state.selectedNoteIds
      : state.midiNotes.map((n) => n.id);

    get().pushUndoState();
    set((s) => ({
      midiNotes: s.midiNotes.map((note) => {
        if (!noteIds.includes(note.id)) return note;
        // Quantize to nearest snap value (e.g., 4 = quarter note, 1 = 16th note)
        const quantizedStart = Math.round(note.startTime / snapValue) * snapValue;
        return { ...note, startTime: quantizedStart };
      }),
    }));
    console.log(`⚡ Quantized ${noteIds.length} notes to grid (snap: ${snapValue})`);
  },

  duplicateSelectedNotes: (offsetTime = 4) => {
    const state = get();
    if (state.selectedNoteIds.length === 0) {
      console.log('📋 Duplicate failed - no notes selected');
      return;
    }

    const selectedNotes = state.midiNotes.filter((n) =>
      state.selectedNoteIds.includes(n.id)
    );

    const newNotes = selectedNotes.map((note) => ({
      ...note,
      id: `note-${Date.now()}-${Math.random()}`,
      startTime: note.startTime + offsetTime,
    }));

    set((s) => ({
      midiNotes: [...s.midiNotes, ...newNotes],
      selectedNoteIds: newNotes.map((n) => n.id),
    }));
    console.log(`📋 Duplicated ${newNotes.length} notes (offset: ${offsetTime} steps)`);
  },

  moveSelectedNotes: (deltaTime, deltaPitch) => {
    const state = get();
    if (state.selectedNoteIds.length === 0) return;

    set((s) => ({
      midiNotes: s.midiNotes.map((note) => {
        if (!s.selectedNoteIds.includes(note.id)) return note;
        return {
          ...note,
          startTime: Math.max(0, note.startTime + deltaTime),
          pitch: Math.max(0, Math.min(127, note.pitch + deltaPitch)),
        };
      }),
    }));
    console.log(`↔️ Moved ${state.selectedNoteIds.length} notes`, { deltaTime, deltaPitch });
  },

  // Ghost Notes actions (FL Studio style)
  toggleGhostNotes: () => {
    const newState = !get().showGhostNotes;
    set({ showGhostNotes: newState });
    console.log(`👻 Ghost notes ${newState ? 'ENABLED' : 'DISABLED'}`);
  },

  setShowGhostNotes: (show) => {
    set({ showGhostNotes: show });
  },

  setGhostNoteChannels: (channelIds) => {
    set({ ghostNoteChannels: channelIds });
  },

  getGhostNotes: () => {
    const state = get();
    const selectedTrackId = state.selectedTrackId;

    // Collect notes from all other tracks
    const ghostNotes: MidiNote[] = [];

    state.tracks.forEach((track) => {
      // Skip the currently selected track (we show those as regular notes)
      if (track.id === selectedTrackId) return;

      // If ghostNoteChannels is specified, only show those channels
      if (state.ghostNoteChannels.length > 0 && !state.ghostNoteChannels.includes(track.id)) {
        return;
      }

      // Add all MIDI notes from this track (with track color info attached)
      track.midiNotes.forEach((note) => {
        ghostNotes.push({
          ...note,
          id: `ghost_${track.id}_${note.id}`, // Prefix ID to avoid conflicts
        });
      });
    });

    return ghostNotes;
  },

  // Snap to Scale actions (FL Studio style)
  toggleSnapToScale: () => {
    const newState = !get().snapToScale;
    set({ snapToScale: newState });
    console.log(`🎼 Snap to Scale ${newState ? 'ENABLED' : 'DISABLED'}: ${get().selectedScale} (root: ${get().scaleRootNote})`);
  },

  setSnapToScale: (enabled) => {
    set({ snapToScale: enabled });
  },

  setSelectedScale: (scale) => {
    set({ selectedScale: scale });
    console.log(`🎼 Scale changed to: ${scale}`);
  },

  setScaleRootNote: (rootNote) => {
    set({ scaleRootNote: rootNote % 12 });
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    console.log(`🎼 Scale root changed to: ${noteNames[rootNote % 12]}`);
  },

  isNoteInScale: (pitch) => {
    const state = get();
    const scaleNotes = get().getScaleNotes();
    const noteInOctave = pitch % 12;
    return scaleNotes.includes(noteInOctave);
  },

  getScaleNotes: () => {
    const state = get();
    const { selectedScale, scaleRootNote } = state;

    // Scale intervals (semitones from root)
    const scaleIntervals: Record<string, number[]> = {
      'Major': [0, 2, 4, 5, 7, 9, 11],
      'Minor': [0, 2, 3, 5, 7, 8, 10],
      'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
      'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
      'Pentatonic Major': [0, 2, 4, 7, 9],
      'Pentatonic Minor': [0, 3, 5, 7, 10],
      'Blues': [0, 3, 5, 6, 7, 10],
      'Dorian': [0, 2, 3, 5, 7, 9, 10],
      'Phrygian': [0, 1, 3, 5, 7, 8, 10],
      'Lydian': [0, 2, 4, 6, 7, 9, 11],
      'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
      'Locrian': [0, 1, 3, 5, 6, 8, 10],
      'Chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      'Whole Tone': [0, 2, 4, 6, 8, 10],
      'Diminished': [0, 2, 3, 5, 6, 8, 9, 11],
    };

    const intervals = scaleIntervals[selectedScale] || scaleIntervals['Major'];

    // Apply root note offset to get actual scale notes
    return intervals.map((interval) => (interval + scaleRootNote) % 12);
  },

  snapPitchToScale: (pitch) => {
    const state = get();
    if (!state.snapToScale) return pitch;

    const scaleNotes = get().getScaleNotes();
    const noteInOctave = pitch % 12;
    const octave = Math.floor(pitch / 12);

    // If already in scale, return as-is
    if (scaleNotes.includes(noteInOctave)) return pitch;

    // Find nearest scale note
    let minDistance = 12;
    let nearestNote = noteInOctave;

    for (const scaleNote of scaleNotes) {
      const distance = Math.min(
        Math.abs(noteInOctave - scaleNote),
        Math.abs(noteInOctave - scaleNote + 12),
        Math.abs(noteInOctave - scaleNote - 12)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestNote = scaleNote;
      }
    }

    return octave * 12 + nearestNote;
  },

  // Master Effects actions
  setMasterVolume: (volume) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, volume },
    }));
    // Apply to actual audio chain
    getMasterEffects().setMasterVolume(volume);
  },

  setCompressorThreshold: (threshold) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, compressorThreshold: threshold },
    }));
    // Apply to actual audio chain
    getMasterEffects().setCompressorThreshold(threshold);
  },

  setCompressorRatio: (ratio) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, compressorRatio: ratio },
    }));
    // Apply to actual audio chain
    getMasterEffects().setCompressorRatio(ratio);
  },

  setCompressorAttack: (attack) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, compressorAttack: attack },
    }));
    // Apply to actual audio chain
    getMasterEffects().setCompressorAttack(attack);
  },

  setCompressorRelease: (release) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, compressorRelease: release },
    }));
    // Apply to actual audio chain
    getMasterEffects().setCompressorRelease(release);
  },

  setEqLow: (gain) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, eqLow: gain },
    }));
    // Apply to actual audio chain
    getMasterEffects().setEqLow(gain);
  },

  setEqMid: (gain) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, eqMid: gain },
    }));
    // Apply to actual audio chain
    getMasterEffects().setEqMid(gain);
  },

  setEqHigh: (gain) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, eqHigh: gain },
    }));
    // Apply to actual audio chain
    getMasterEffects().setEqHigh(gain);
  },

  setDistortion: (amount) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, distortion: amount },
    }));
    // Apply to actual audio chain
    getMasterEffects().setDistortion(amount);
  },

  setMasterReverb: (amount) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, reverb: amount },
    }));
    // Apply to actual audio chain
    getMasterEffects().setReverbWet(amount);
  },

  setMasterDelay: (amount) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, delay: amount },
    }));
    // Apply to actual audio chain
    getMasterEffects().setDelayWet(amount);
  },

  setStereoWidth: (width) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, stereoWidth: width },
    }));
    // Apply to actual audio chain
    getMasterEffects().setStereoWidth(width);
  },

  setLimiterThreshold: (threshold) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, limiterThreshold: threshold },
    }));
    // Apply to actual audio chain
    getMasterEffects().setLimiterThreshold(threshold);
  },

  setChorus: (amount) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, chorus: amount },
    }));
    getMasterEffects().setChorus(amount);
  },

  setPhaser: (amount) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, phaser: amount },
    }));
    getMasterEffects().setPhaser(amount);
  },

  setFlanger: (amount) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, flanger: amount },
    }));
    getMasterEffects().setFlanger(amount);
  },

  setBitcrusher: (amount) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, bitcrusher: amount },
    }));
    getMasterEffects().setBitcrusher(amount);
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
    const nextIndex = state.patterns.length + 1;
    const pattern: Pattern = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      createdAt: Date.now(),
      bpm: state.bpm,
      timeSignature: state.timeSignature,
      patternLength: state.patternLength,
      numBars: state.numBars,
      color: PATTERN_COLORS[(nextIndex - 1) % PATTERN_COLORS.length],
      index: nextIndex,
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
      currentPatternIndex: nextIndex,
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
          ? new Tone.Player(pad.sample.url).connect(getMasterEffects().getInput())
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

    const nextIndex = state.patterns.length + 1;
    const duplicate: Pattern = {
      ...JSON.parse(JSON.stringify(pattern)),
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${pattern.name} (Copy)`,
      createdAt: Date.now(),
      index: nextIndex,
    };

    set((state) => ({
      patterns: [...state.patterns, duplicate],
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem('beatshop_patterns', JSON.stringify(get().patterns));
    }
    console.log(`🎹 Pattern duplicated: "${pattern.name}" → "${duplicate.name}"`);
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

  // FL Studio Pattern Color
  setPatternColor: (patternId, color) => {
    set((state) => ({
      patterns: state.patterns.map(p =>
        p.id === patternId ? { ...p, color } : p
      ),
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem('beatshop_patterns', JSON.stringify(get().patterns));
    }
  },

  // Clone pattern (same as duplicate but returns ID)
  clonePattern: (patternId) => {
    const state = get();
    const pattern = state.patterns.find(p => p.id === patternId);
    if (!pattern) return '';

    const nextIndex = state.patterns.length + 1;
    const newId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clone: Pattern = {
      ...JSON.parse(JSON.stringify(pattern)),
      id: newId,
      name: `${pattern.name} (Clone)`,
      createdAt: Date.now(),
      index: nextIndex,
    };

    set((state) => ({
      patterns: [...state.patterns, clone],
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem('beatshop_patterns', JSON.stringify(get().patterns));
    }

    console.log(`🎹 Pattern cloned: "${pattern.name}" → "${clone.name}" (ID: ${newId})`);
    return newId;
  },

  // Move pattern to new index
  movePattern: (patternId, newIndex) => {
    set((state) => {
      const patterns = [...state.patterns];
      const patternIndex = patterns.findIndex(p => p.id === patternId);
      if (patternIndex === -1) return state;

      const [pattern] = patterns.splice(patternIndex, 1);
      patterns.splice(newIndex - 1, 0, pattern);

      // Reindex all patterns
      const reindexedPatterns = patterns.map((p, i) => ({ ...p, index: i + 1 }));

      return { patterns: reindexedPatterns };
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('beatshop_patterns', JSON.stringify(get().patterns));
    }
  },

  // Select pattern by index number (1-999)
  selectPattern: (patternIndex) => {
    const state = get();
    const pattern = state.patterns.find(p => p.index === patternIndex);
    if (pattern) {
      get().loadPattern(pattern.id);
      set({ currentPatternIndex: patternIndex });
    }
  },

  // Create new empty pattern
  createNewPattern: (name) => {
    const state = get();
    const nextIndex = state.patterns.length + 1;

    if (nextIndex > state.maxPatterns) {
      console.warn(`Maximum patterns (${state.maxPatterns}) reached`);
      return '';
    }

    const patternName = name || `Pattern ${nextIndex}`;
    const newId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pattern: Pattern = {
      id: newId,
      name: patternName,
      type: 'drum',
      createdAt: Date.now(),
      bpm: state.bpm,
      timeSignature: state.timeSignature,
      patternLength: state.patternLength,
      numBars: state.numBars,
      color: PATTERN_COLORS[(nextIndex - 1) % PATTERN_COLORS.length],
      index: nextIndex,
      pads: [],
      steps: createInitialSteps(16, state.numSteps),
    };

    set((state) => ({
      patterns: [...state.patterns, pattern],
      currentPatternId: newId,
      currentPatternIndex: nextIndex,
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem('beatshop_patterns', JSON.stringify(get().patterns));
    }

    return newId;
  },

  // Get pattern by index
  getPatternByIndex: (index) => {
    return get().patterns.find(p => p.index === index);
  },

  // FL Studio Playback Mode
  setPlaybackMode: (mode) => set({ playbackMode: mode }),

  togglePlaybackMode: () => {
    set((state) => ({
      playbackMode: state.playbackMode === 'PAT' ? 'SONG' : 'PAT',
    }));
  },

  // Channel Group Management
  createChannelGroup: (name, color) => {
    const newId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const groupColor = color || PATTERN_COLORS[get().channelGroups.length % PATTERN_COLORS.length];

    set((state) => ({
      channelGroups: [
        ...state.channelGroups,
        {
          id: newId,
          name,
          color: groupColor,
          collapsed: false,
          channelIds: [],
        },
      ],
    }));

    return newId;
  },

  deleteChannelGroup: (groupId) => {
    set((state) => ({
      channelGroups: state.channelGroups.filter(g => g.id !== groupId),
      currentChannelFilter: state.currentChannelFilter === groupId ? 'all' : state.currentChannelFilter,
    }));
  },

  renameChannelGroup: (groupId, newName) => {
    set((state) => ({
      channelGroups: state.channelGroups.map(g =>
        g.id === groupId ? { ...g, name: newName } : g
      ),
    }));
  },

  setChannelGroupColor: (groupId, color) => {
    set((state) => ({
      channelGroups: state.channelGroups.map(g =>
        g.id === groupId ? { ...g, color } : g
      ),
    }));
  },

  assignChannelToGroup: (padIndex, groupId) => {
    set((state) => ({
      channelGroups: state.channelGroups.map(g => {
        if (g.id === groupId) {
          // Add channel to this group if not already present
          if (!g.channelIds.includes(padIndex)) {
            return { ...g, channelIds: [...g.channelIds, padIndex] };
          }
        } else {
          // Remove channel from other groups
          return { ...g, channelIds: g.channelIds.filter(id => id !== padIndex) };
        }
        return g;
      }),
    }));
  },

  removeChannelFromGroup: (padIndex, groupId) => {
    set((state) => ({
      channelGroups: state.channelGroups.map(g =>
        g.id === groupId
          ? { ...g, channelIds: g.channelIds.filter(id => id !== padIndex) }
          : g
      ),
    }));
  },

  setChannelFilter: (filter) => set({ currentChannelFilter: filter }),

  toggleChannelGroupCollapsed: (groupId) => {
    set((state) => ({
      channelGroups: state.channelGroups.map(g =>
        g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
      ),
    }));
  },

  getFilteredChannels: () => {
    const state = get();
    const filter = state.currentChannelFilter;

    if (filter === 'all') {
      return state.pads.map((_, i) => i);
    }

    if (filter === 'unsorted') {
      // Return channels not in any group
      const assignedChannels = new Set(
        state.channelGroups.flatMap(g => g.channelIds)
      );
      return state.pads.map((_, i) => i).filter(i => !assignedChannels.has(i));
    }

    // Return channels in the specified group
    const group = state.channelGroups.find(g => g.id === filter);
    return group ? group.channelIds : [];
  },

  // Global swing and groove templates
  setGlobalSwing: (swing) => set({ globalSwing: swing }),

  setGrooveTemplate: (templateId) => {
    set({ currentGrooveTemplate: templateId });
    if (templateId) {
      console.log(`🎵 Groove template set to: ${templateId}`);
    } else {
      console.log('🎵 Groove template cleared');
    }
  },

  setGrooveAmount: (amount) => {
    set({ grooveAmount: Math.max(0, Math.min(100, amount)) });
    console.log(`🎵 Groove amount set to ${amount}%`);
  },

  applyGrooveToPattern: () => {
    const state = get();
    if (!state.currentGrooveTemplate) {
      console.log('⚠️ No groove template selected');
      return;
    }

    // Dynamic import to avoid circular dependencies
    import('@/lib/audio/grooveTemplates').then(({ GROOVE_TEMPLATES, calculateGrooveOffset, calculateGrooveVelocity }) => {
      const template = GROOVE_TEMPLATES.find(t => t.id === state.currentGrooveTemplate);
      if (!template) return;

      const updatedSteps = state.steps.map(step => {
        if (!step.active) return step;
        const newMicroTiming = calculateGrooveOffset(template, step.stepIndex, state.grooveAmount);
        const newVelocity = calculateGrooveVelocity(template, step.stepIndex, step.velocity, state.grooveAmount);
        return { ...step, microTiming: newMicroTiming, velocity: newVelocity };
      });

      set({ steps: updatedSteps });
      console.log(`✅ Applied ${template.name} groove template to ${updatedSteps.filter(s => s.active).length} steps`);
    });
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

  // Project restore action - restores full project state
  restoreProject: (projectData) => {
    const updates: Partial<BeatState> = {};

    if (projectData.bpm !== undefined) {
      updates.bpm = projectData.bpm;
      Tone.getTransport().bpm.value = projectData.bpm;
    }
    if (projectData.timeSignature !== undefined) {
      updates.timeSignature = projectData.timeSignature;
    }
    if (projectData.patterns !== undefined) {
      updates.patterns = projectData.patterns;
    }
    if (projectData.arrangementClips !== undefined) {
      updates.arrangementClips = projectData.arrangementClips;
    }
    if (projectData.steps !== undefined) {
      updates.steps = projectData.steps;
    }
    if (projectData.tracks !== undefined) {
      updates.tracks = projectData.tracks;
    }
    if (projectData.midiNotes !== undefined) {
      updates.midiNotes = projectData.midiNotes;
    }
    if (projectData.pads !== undefined) {
      // Rehydrate pads with Tone.js objects
      updates.pads = rehydratePads(projectData.pads as SerializablePad[]);
    }
    if (projectData.masterSettings) {
      const ms = projectData.masterSettings;
      updates.masterVolume = ms.masterVolume;
      updates.compressorThreshold = ms.compressorThreshold;
      updates.compressorRatio = ms.compressorRatio;
      updates.compressorAttack = ms.compressorAttack;
      updates.compressorRelease = ms.compressorRelease;
      updates.limiterThreshold = ms.limiterThreshold;
      updates.eqLow = ms.eqLow;
      updates.eqMid = ms.eqMid;
      updates.eqHigh = ms.eqHigh;
      updates.distortion = ms.distortion;
      updates.reverb = ms.reverb;
      updates.delay = ms.delay;
      updates.stereoWidth = ms.stereoWidth;
      updates.swing = ms.swing;
      updates.patternLength = ms.patternLength;

      // Apply master effects to Tone.js
      const masterEffects = getMasterEffects();
      if (ms.masterVolume !== undefined) masterEffects.setMasterVolume(ms.masterVolume);
      if (ms.compressorThreshold !== undefined) masterEffects.setCompressorThreshold(ms.compressorThreshold);
      if (ms.compressorRatio !== undefined) masterEffects.setCompressorRatio(ms.compressorRatio);
      if (ms.compressorAttack !== undefined) masterEffects.setCompressorAttack(ms.compressorAttack);
      if (ms.compressorRelease !== undefined) masterEffects.setCompressorRelease(ms.compressorRelease);
      if (ms.limiterThreshold !== undefined) masterEffects.setLimiterThreshold(ms.limiterThreshold);
      if (ms.eqLow !== undefined) masterEffects.setEqLow(ms.eqLow);
      if (ms.eqMid !== undefined) masterEffects.setEqMid(ms.eqMid);
      if (ms.eqHigh !== undefined) masterEffects.setEqHigh(ms.eqHigh);
      if (ms.distortion !== undefined) masterEffects.setDistortion(ms.distortion);
      if (ms.reverb !== undefined) masterEffects.setReverb(ms.reverb);
      if (ms.delay !== undefined) masterEffects.setDelay(ms.delay);
      if (ms.stereoWidth !== undefined) masterEffects.setStereoWidth(ms.stereoWidth);
    }

    set(updates);
  },

  // =====================================================
  // MPC STUDIO BUTTON ACTION IMPLEMENTATIONS
  // =====================================================

  // Note Repeat Actions
  setNoteRepeatEnabled: (enabled) => set({ noteRepeatEnabled: enabled }),
  setNoteRepeatRate: (rate) => set({ noteRepeatRate: rate }),
  toggleNoteRepeat: () => set((state) => ({ noteRepeatEnabled: !state.noteRepeatEnabled })),

  // Latch Actions
  setLatchEnabled: (enabled) => set({ latchEnabled: enabled }),
  toggleLatch: () => set((state) => ({ latchEnabled: !state.latchEnabled })),

  // Full Level Actions
  setFullLevelEnabled: (enabled) => set({
    fullLevelEnabled: enabled,
    halfLevelEnabled: enabled ? false : get().halfLevelEnabled, // Disable half if enabling full
    sixteenLevelEnabled: enabled ? false : get().sixteenLevelEnabled // Disable 16 level if enabling full
  }),
  toggleFullLevel: () => {
    const current = get().fullLevelEnabled;
    set({
      fullLevelEnabled: !current,
      halfLevelEnabled: !current ? false : get().halfLevelEnabled,
      sixteenLevelEnabled: !current ? false : get().sixteenLevelEnabled
    });
  },

  // Half Level Actions
  setHalfLevelEnabled: (enabled) => set({
    halfLevelEnabled: enabled,
    fullLevelEnabled: enabled ? false : get().fullLevelEnabled, // Disable full if enabling half
    sixteenLevelEnabled: enabled ? false : get().sixteenLevelEnabled
  }),
  toggleHalfLevel: () => {
    const current = get().halfLevelEnabled;
    set({
      halfLevelEnabled: !current,
      fullLevelEnabled: !current ? false : get().fullLevelEnabled,
      sixteenLevelEnabled: !current ? false : get().sixteenLevelEnabled
    });
  },

  // 16 Level Actions
  set16LevelEnabled: (enabled) => set({
    sixteenLevelEnabled: enabled,
    fullLevelEnabled: enabled ? false : get().fullLevelEnabled,
    halfLevelEnabled: enabled ? false : get().halfLevelEnabled
  }),
  toggle16Level: (padIndex) => {
    const current = get().sixteenLevelEnabled;
    set({
      sixteenLevelEnabled: !current,
      sixteenLevelPadIndex: !current ? (padIndex ?? null) : null,
      fullLevelEnabled: !current ? false : get().fullLevelEnabled,
      halfLevelEnabled: !current ? false : get().halfLevelEnabled
    });
  },

  // Pad Mute Mode Actions
  setPadMuteMode: (enabled) => set({ padMuteMode: enabled, trackMuteMode: enabled ? false : get().trackMuteMode }),
  togglePadMuteMode: () => {
    const current = get().padMuteMode;
    set({ padMuteMode: !current, trackMuteMode: !current ? false : get().trackMuteMode });
  },

  // Track Mute Mode Actions
  setTrackMuteMode: (enabled) => set({ trackMuteMode: enabled, padMuteMode: enabled ? false : get().padMuteMode }),
  toggleTrackMuteMode: () => {
    const current = get().trackMuteMode;
    set({ trackMuteMode: !current, padMuteMode: !current ? false : get().padMuteMode });
  },

  // Erase Mode Actions
  setEraseMode: (enabled) => set({ eraseMode: enabled }),
  toggleEraseMode: () => set((state) => ({ eraseMode: !state.eraseMode })),

  // Overdub Actions
  setOverdubEnabled: (enabled) => set({ overdubEnabled: enabled }),
  toggleOverdub: () => set((state) => ({ overdubEnabled: !state.overdubEnabled })),

  // Shift Key Actions
  setShiftPressed: (pressed) => set({ shiftPressed: pressed }),

  // Pad Bank Actions
  setActivePadBank: (bank) => set({ activePadBank: bank }),

  // Undo/Redo Actions
  pushUndoState: () => {
    const state = get();
    const newUndoStack = [...state.undoStack, {
      steps: JSON.parse(JSON.stringify(state.steps)),
      midiNotes: JSON.parse(JSON.stringify(state.midiNotes))
    }];
    // Limit undo stack size
    if (newUndoStack.length > state.maxUndoSteps) {
      newUndoStack.shift();
    }
    set({ undoStack: newUndoStack, redoStack: [] }); // Clear redo on new action
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;

    const lastState = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, -1);
    const newRedoStack = [...state.redoStack, {
      steps: JSON.parse(JSON.stringify(state.steps)),
      midiNotes: JSON.parse(JSON.stringify(state.midiNotes))
    }];

    set({
      steps: lastState.steps,
      midiNotes: lastState.midiNotes,
      undoStack: newUndoStack,
      redoStack: newRedoStack
    });
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;

    const nextState = state.redoStack[state.redoStack.length - 1];
    const newRedoStack = state.redoStack.slice(0, -1);
    const newUndoStack = [...state.undoStack, {
      steps: JSON.parse(JSON.stringify(state.steps)),
      midiNotes: JSON.parse(JSON.stringify(state.midiNotes))
    }];

    set({
      steps: nextState.steps,
      midiNotes: nextState.midiNotes,
      undoStack: newUndoStack,
      redoStack: newRedoStack
    });
  },

  clearUndoHistory: () => set({ undoStack: [], redoStack: [] }),

  // Quantize Actions
  setQuantizeEnabled: (enabled) => set({ quantizeEnabled: enabled }),
  toggleQuantize: () => set((state) => ({ quantizeEnabled: !state.quantizeEnabled })),
  setQuantizeStrength: (strength) => set({ quantizeStrength: Math.max(0, Math.min(100, strength)) }),

  quantizeCurrentPattern: () => {
    const state = get();
    const { midiNotes, quantizeStrength } = state;
    const stepsPerBeat = 4; // 16th notes per beat
    const stepSize = 1; // Each step is 1 unit

    const quantizedNotes = midiNotes.map(note => {
      const nearestStep = Math.round(note.startTime / stepSize) * stepSize;
      const strength = quantizeStrength / 100;
      const newStartTime = note.startTime + (nearestStep - note.startTime) * strength;
      return { ...note, startTime: newStartTime };
    });

    set({ midiNotes: quantizedNotes });
  },

  // Zoom Actions
  setZoomLevel: (level) => set({ zoomLevel: Math.max(1, Math.min(4, level)) }),
  zoomIn: () => set((state) => ({ zoomLevel: Math.min(4, state.zoomLevel + 1) })),
  zoomOut: () => set((state) => ({ zoomLevel: Math.max(1, state.zoomLevel - 1) })),

  // Mode Actions
  setCurrentMode: (mode) => set({ currentMode: mode }),

  // MPC Transport Actions
  playFromStart: () => {
    set({ currentStep: 0 });
    Tone.getTransport().position = 0;
    set({ isPlaying: true });
  },

  copyPattern: () => {
    const state = get();
    // Deep copy current steps and midi notes
    const copiedSteps = JSON.parse(JSON.stringify(state.steps));
    const copiedMidiNotes = JSON.parse(JSON.stringify(state.midiNotes));
    // Save to a new pattern with "(Copy)" suffix
    const newPatternName = `Pattern ${state.currentPatternIndex} (Copy)`;
    state.savePattern(newPatternName, 'drum');
    console.log(`📋 Pattern copied: ${newPatternName}`);
  },

  // Copy current pattern data to clipboard (for paste to another pattern)
  copyPatternToClipboard: () => {
    const state = get();
    set({
      patternClipboard: {
        steps: JSON.parse(JSON.stringify(state.steps)),
        midiNotes: JSON.parse(JSON.stringify(state.midiNotes)),
        numSteps: state.numSteps,
        numBars: state.numBars,
        timeSignature: state.timeSignature,
      }
    });
    console.log(`📋 Pattern ${state.currentPatternIndex} copied to clipboard (${state.steps.filter(s => s.active).length} active steps, ${state.midiNotes.length} MIDI notes)`);
  },

  // Paste clipboard data to current pattern
  pastePatternFromClipboard: () => {
    const state = get();
    if (!state.patternClipboard) {
      console.log('📋 Paste failed - clipboard empty');
      return;
    }

    // Push undo state before pasting
    state.pushUndoState();

    set({
      steps: JSON.parse(JSON.stringify(state.patternClipboard.steps)),
      midiNotes: JSON.parse(JSON.stringify(state.patternClipboard.midiNotes)),
      numSteps: state.patternClipboard.numSteps,
      numBars: state.patternClipboard.numBars,
      timeSignature: state.patternClipboard.timeSignature,
    });
    console.log(`📋 Pattern pasted from clipboard (${state.patternClipboard.steps.filter(s => s.active).length} active steps, ${state.patternClipboard.midiNotes.length} MIDI notes)`);
  },

  deleteSelectedNotes: () => {
    // Delete all notes that are selected (future: implement selection state)
    // For now, clear all MIDI notes
    get().pushUndoState();
    set({ midiNotes: [] });
  },

  // Get effective velocity based on level modes
  getEffectiveVelocity: (padIndex, inputVelocity = 100) => {
    const state = get();

    // Full level mode - always max velocity
    if (state.fullLevelEnabled) {
      return 127;
    }

    // Half level mode - always 50% velocity
    if (state.halfLevelEnabled) {
      return 64;
    }

    // 16 level mode - map pad index to velocity
    if (state.sixteenLevelEnabled) {
      // Pad 0 = velocity 8, Pad 1 = velocity 16, ..., Pad 15 = velocity 127
      const velocityStep = 127 / 16;
      return Math.round((padIndex + 1) * velocityStep);
    }

    // Default: return input velocity
    return inputVelocity;
  },
    }),
    {
      name: 'beatshop-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),

      // Only persist these fields (exclude runtime state like isPlaying, synth, player)
      partialize: (state) => ({
        bpm: state.bpm,
        pads: serializePads(state.pads),
        padMode: state.padMode,
        steps: state.steps,
        numSteps: state.numSteps,
        patternLength: state.patternLength,
        swing: state.swing,
        timeSignature: state.timeSignature,
        midiNotes: state.midiNotes,
        masterEffects: state.masterEffects,
        patterns: state.patterns,
        currentPatternId: state.currentPatternId,
        arrangementClips: state.arrangementClips,
        preferences: state.preferences,
        metronomeEnabled: state.metronomeEnabled,
        metronomeVolume: state.metronomeVolume,
      }),

      // Rehydrate Tone.js objects when loading from storage
      onRehydrateStorage: () => (state) => {
        if (state && state.pads) {
          // Rehydrate pads with Tone.js synths/players
          const rehydratedPads = rehydratePads(state.pads as unknown as SerializablePad[]);
          // We need to set this after hydration
          setTimeout(() => {
            useBeatStore.setState({ pads: rehydratedPads });
            // Also set BPM on Tone transport
            Tone.getTransport().bpm.value = state.bpm;
          }, 0);
        }
      },
    }
  )
);

