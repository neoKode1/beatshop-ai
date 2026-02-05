/**
 * AI Generation Types for Phase/ACE-Step Integration
 */

// Generation task types supported by ACE-Step
export type GenerationTaskType = 
  | 'text2music'    // Generate music from text prompt
  | 'cover'         // Audio cover/transformation
  | 'repaint'       // Regenerate specific sections
  | 'lego'          // Combine/remix elements
  | 'extract'       // Extract stems
  | 'complete';     // Complete partial audio

// Audio output formats
export type AudioFormat = 'mp3' | 'wav' | 'flac';

// Musical keys
export type MusicalKey = 
  | 'C Major' | 'C Minor' | 'C# Major' | 'C# Minor'
  | 'D Major' | 'D Minor' | 'D# Major' | 'D# Minor'
  | 'E Major' | 'E Minor' | 'F Major' | 'F Minor'
  | 'F# Major' | 'F# Minor' | 'G Major' | 'G Minor'
  | 'G# Major' | 'G# Minor' | 'A Major' | 'A Minor'
  | 'A# Major' | 'A# Minor' | 'B Major' | 'B Minor' | '';

// Generation parameters matching ACE-Step API
export interface GenerationParams {
  // Basic parameters
  prompt: string;
  lyrics?: string;
  instrumental: boolean;
  duration: number; // seconds (0 for auto, max 240+)
  
  // Music parameters
  bpm?: number; // 0 for auto
  keyScale?: MusicalKey;
  timeSignature?: '2' | '3' | '4' | '6' | '';
  vocalLanguage?: string; // 'auto', 'en', 'zh', etc.
  
  // Generation quality parameters
  inferSteps?: number; // 8-32, higher = better quality
  guidanceScale?: number; // 1-15, higher = more adherence to prompt
  batchSize?: number; // 1-4, number of variations
  seed?: number; // -1 for random
  audioFormat?: AudioFormat;
  shift?: number; // timestep shift factor
  
  // Task-specific parameters
  taskType?: GenerationTaskType;
  referenceAudioUrl?: string; // For style transfer
  sourceAudioUrl?: string; // For audio-to-audio
  repaintingStart?: number; // seconds
  repaintingEnd?: number; // seconds (-1 for end)
  audioCoverStrength?: number; // 0-1
  
  // LM/CoT parameters (advanced)
  thinking?: boolean;
  lmTemperature?: number;
  lmCfgScale?: number;
  lmTopK?: number;
  lmTopP?: number;
}

// Default generation parameters
export const DEFAULT_GENERATION_PARAMS: Partial<GenerationParams> = {
  instrumental: false,
  duration: 30,
  bpm: 0, // auto
  keyScale: '',
  timeSignature: '4',
  inferSteps: 8,
  guidanceScale: 10.0,
  batchSize: 1,
  seed: -1,
  audioFormat: 'mp3',
  taskType: 'text2music',
  thinking: false,
};

// Job status types
export type JobStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

// Generation job response
export interface GenerationJob {
  id: string;
  status: JobStatus;
  progress?: number; // 0-100
  message?: string;
  createdAt: string;
  completedAt?: string;
  
  // Results (when completed)
  audioUrls?: string[];
  error?: string;
}

// Generated audio item
export interface GeneratedAudio {
  id: string;
  jobId: string;
  url: string;
  filename: string;
  duration: number;
  format: AudioFormat;
  createdAt: string;
  
  // Generation metadata
  prompt: string;
  params: GenerationParams;
}

// Stem separation result
export interface StemSeparationResult {
  vocals?: string;
  drums?: string;
  bass?: string;
  other?: string;
  original: string;
}

// LLM format response (for prompt enhancement)
export interface FormatResponse {
  title: string;
  lyrics: string;
  tags: string[];
  enhancedPrompt?: string;
}

// Quick generation presets for Beatmaker
export interface GenerationPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  params: Partial<GenerationParams>;
}

// Beatmaker-specific presets
export const BEATMAKER_PRESETS: GenerationPreset[] = [
  {
    id: 'drum-loop',
    name: 'Drum Loop',
    description: 'Generate a drum pattern loop',
    icon: '🥁',
    params: {
      instrumental: true,
      duration: 8,
      prompt: 'percussion drum loop, clean hits, no melody',
    },
  },
  {
    id: 'bass-loop',
    name: 'Bass Loop',
    description: 'Generate a bass line',
    icon: '🎸',
    params: {
      instrumental: true,
      duration: 8,
      prompt: 'bass line loop, groovy, rhythmic',
    },
  },
  {
    id: 'melody-loop',
    name: 'Melody Loop',
    description: 'Generate a melodic phrase',
    icon: '🎹',
    params: {
      instrumental: true,
      duration: 8,
      prompt: 'melodic synth loop, catchy hook',
    },
  },
  {
    id: 'full-beat',
    name: 'Full Beat',
    description: 'Generate a complete instrumental',
    icon: '🎵',
    params: {
      instrumental: true,
      duration: 30,
      prompt: 'full instrumental beat, drums bass melody',
    },
  },
];

