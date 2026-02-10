/**
 * AudioEngine - Singleton that manages the global AudioContext
 * 
 * Adapted from butterDAWg's globals.audiocontext pattern.
 * In butterDAWg, a single AudioContext lives on the globals object.
 * Here we wrap it in a proper singleton that:
 * - Lazily creates the AudioContext (browser requires user gesture)
 * - Interoperates with Tone.js (shares the same context)
 * - Provides the raw AudioContext for Web Audio API operations
 *   (Channel, Plugin, Sample all need raw AudioContext)
 */

import * as Tone from 'tone';

class AudioEngineImpl {
  private _context: AudioContext | null = null;
  private _sampleRate: number = 44100;

  /**
   * Get the shared AudioContext.
   * Uses Tone.js's context to ensure compatibility.
   * Tone.js creates its own AudioContext — we reuse it
   * so all audio (Tone.js synths + raw Web Audio nodes) share one graph.
   */
  get context(): AudioContext {
    if (!this._context) {
      // Tone.js wraps its own AudioContext. Get the raw one.
      this._context = Tone.getContext().rawContext as unknown as AudioContext;
      this._sampleRate = this._context.sampleRate;
    }
    return this._context;
  }

  get sampleRate(): number {
    return this._sampleRate;
  }

  /**
   * Ensure the AudioContext is running (must be called after user gesture).
   * This resumes both Tone.js and the raw AudioContext.
   */
  async resume(): Promise<void> {
    await Tone.start();
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  /**
   * Suspend audio processing (pause everything).
   */
  async suspend(): Promise<void> {
    if (this.context.state === 'running') {
      await this.context.suspend();
    }
  }

  /**
   * Get the AudioContext's destination node.
   * This is the final output (speakers).
   */
  get destination(): AudioDestinationNode {
    return this.context.destination;
  }

  /**
   * Get current audio time (for scheduling).
   */
  get currentTime(): number {
    return this.context.currentTime;
  }

  /**
   * Register an AudioWorklet module from a URL.
   * Used by the Plugin system to load custom DSP processors.
   */
  async addWorkletModule(url: string): Promise<void> {
    await this.context.audioWorklet.addModule(url);
  }

  /**
   * Create an AudioBuffer (for sample loading).
   */
  createBuffer(numberOfChannels: number, length: number, sampleRate?: number): AudioBuffer {
    return this.context.createBuffer(
      numberOfChannels,
      length,
      sampleRate || this._sampleRate
    );
  }

  /**
   * Decode audio data from an ArrayBuffer (for loading audio files in browser).
   */
  async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    return this.context.decodeAudioData(arrayBuffer);
  }
}

/**
 * Singleton AudioEngine instance.
 * Import this wherever you need the AudioContext.
 *
 * IMPORTANT: Tone.js wraps the native AudioContext with standardized-audio-context.
 * Always use factory methods (ctx.createGain(), ctx.createAnalyser(), etc.)
 * instead of constructor syntax (new GainNode(ctx)) — constructors fail
 * because the wrapper is not a native BaseAudioContext.
 *
 * Usage:
 *   import { audioEngine } from '@/lib/audio/core/AudioEngine';
 *   const ctx = audioEngine.context;
 *   const gain = ctx.createGain();
 */
export const audioEngine = new AudioEngineImpl();

