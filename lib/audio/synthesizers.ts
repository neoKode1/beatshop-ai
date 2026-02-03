import * as Tone from 'tone';
import { getMasterEffects } from './effects';

/**
 * Tone.js Synthesizer Library for Beat Shop AI
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

