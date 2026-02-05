import * as Tone from 'tone';
import { getMasterEffects } from './effects';

/**
 * Tone.js Synthesizer Library for BeatShop AI
 * Creates drum sounds and instruments using synthesis
 */

export class DrumSynthesizer {
  // 808-style Kick Drum
  static createKick808(): Tone.MembraneSynth {
    return new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4,
        attackCurve: 'exponential',
      },
    }).connect(getMasterEffects().getInput());
  }

  // Acoustic Kick
  static createKickAcoustic(): Tone.MembraneSynth {
    return new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.2,
      },
    }).connect(getMasterEffects().getInput());
  }

  // Snare Drum
  static createSnare(): Tone.NoiseSynth {
    return new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.1,
      },
    }).connect(getMasterEffects().getInput());
  }

  // Clap
  static createClap(): Tone.NoiseSynth {
    return new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: {
        attack: 0.001,
        decay: 0.15,
        sustain: 0,
        release: 0.1,
      },
    }).connect(getMasterEffects().getInput());
  }

  // Hi-Hat Closed
  static createHiHatClosed(): Tone.MetalSynth {
    return new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.05,
        release: 0.01,
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).connect(getMasterEffects().getInput());
  }

  // Hi-Hat Open
  static createHiHatOpen(): Tone.MetalSynth {
    return new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.3,
        release: 0.3,
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).connect(getMasterEffects().getInput());
  }

  // Rim Shot
  static createRimShot(): Tone.MembraneSynth {
    return new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.1,
      },
    }).connect(getMasterEffects().getInput());
  }

  // Tom
  static createTom(): Tone.MembraneSynth {
    return new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0.1,
        release: 0.2,
      },
    }).connect(getMasterEffects().getInput());
  }

  // Shaker
  static createShaker(): Tone.NoiseSynth {
    return new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.05,
      },
    }).connect(getMasterEffects().getInput());
  }

  // Cowbell
  static createCowbell(): Tone.MetalSynth {
    return new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.1,
        release: 0.05,
      },
      harmonicity: 2.1,
      modulationIndex: 20,
      resonance: 3000,
      octaves: 1,
    }).connect(getMasterEffects().getInput());
  }
}

export class BassSynthesizer {
  // Sub Bass
  static createSubBass(): Tone.MonoSynth {
    return new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.4,
        release: 0.5,
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.2,
        baseFrequency: 200,
        octaves: 2.6,
      },
    }).connect(getMasterEffects().getInput());
  }
}

// ============================================
// UNIFIED SYNTH FACTORY
// ============================================

export type SynthType =
  | 'kick808' | 'kickAcoustic' | 'snare' | 'clap'
  | 'hihatClosed' | 'hihatOpen' | 'rimShot' | 'tom'
  | 'shaker' | 'cowbell' | 'subBass';

type SynthInstance = Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth | Tone.MonoSynth;

/**
 * Unified synth factory - single source of truth for synth creation
 * Use this instead of switch statements throughout the codebase
 */
const SYNTH_FACTORIES: Record<SynthType, () => SynthInstance> = {
  kick808: () => DrumSynthesizer.createKick808(),
  kickAcoustic: () => DrumSynthesizer.createKickAcoustic(),
  snare: () => DrumSynthesizer.createSnare(),
  clap: () => DrumSynthesizer.createClap(),
  hihatClosed: () => DrumSynthesizer.createHiHatClosed(),
  hihatOpen: () => DrumSynthesizer.createHiHatOpen(),
  rimShot: () => DrumSynthesizer.createRimShot(),
  tom: () => DrumSynthesizer.createTom(),
  shaker: () => DrumSynthesizer.createShaker(),
  cowbell: () => DrumSynthesizer.createCowbell(),
  subBass: () => BassSynthesizer.createSubBass(),
};

/**
 * Create a synth by type - replaces all switch statements
 */
export function createSynth(type: SynthType): SynthInstance {
  const factory = SYNTH_FACTORIES[type];
  if (!factory) {
    console.warn(`Unknown synth type: ${type}, falling back to kick808`);
    return SYNTH_FACTORIES.kick808();
  }
  return factory();
}

/**
 * Check if a synth requires a note parameter for triggering
 */
export function synthRequiresNote(synth: SynthInstance): boolean {
  return synth instanceof Tone.MembraneSynth || synth instanceof Tone.MonoSynth;
}

/**
 * Unified synth trigger - handles all synth types correctly
 */
export function triggerSynth(
  synth: SynthInstance,
  options: {
    note?: string;
    duration?: string;
    velocity?: number;
    time?: number;
  } = {}
): void {
  const {
    note = 'C2',
    duration = '16n',
    velocity = 0.8,
    time = Tone.now(),
  } = options;

  if (synth instanceof Tone.NoiseSynth || synth instanceof Tone.MetalSynth) {
    // Noise and Metal synths don't take a note parameter
    synth.triggerAttackRelease(duration, time, velocity);
  } else if (synth instanceof Tone.MembraneSynth || synth instanceof Tone.MonoSynth) {
    // Membrane and Mono synths require a note
    synth.triggerAttackRelease(note, duration, time, velocity);
  }
}

/**
 * Preview a synth sound (one-shot with auto-dispose)
 */
export async function previewSynth(
  type: SynthType,
  note = 'C2',
  velocity = 0.8
): Promise<void> {
  await Tone.start();

  const synth = createSynth(type);
  triggerSynth(synth, { note, velocity });

  // Dispose after playing
  setTimeout(() => synth.dispose(), 1000);
}

/**
 * Get all available synth types
 */
export function getSynthTypes(): SynthType[] {
  return Object.keys(SYNTH_FACTORIES) as SynthType[];
}

/**
 * Get synth category for UI grouping
 */
export function getSynthCategory(type: SynthType): 'kick' | 'snare' | 'hihat' | 'perc' | 'bass' {
  const categories: Record<SynthType, 'kick' | 'snare' | 'hihat' | 'perc' | 'bass'> = {
    kick808: 'kick',
    kickAcoustic: 'kick',
    snare: 'snare',
    clap: 'snare',
    hihatClosed: 'hihat',
    hihatOpen: 'hihat',
    rimShot: 'perc',
    tom: 'perc',
    shaker: 'perc',
    cowbell: 'perc',
    subBass: 'bass',
  };
  return categories[type];
}

