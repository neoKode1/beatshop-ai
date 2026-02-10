/**
 * AudioSample - Wraps an AudioBuffer with connection management
 * 
 * Adapted from butterDAWg's Sample class.
 * Key differences:
 * - Browser-compatible: loads audio via fetch + decodeAudioData (no fs)
 * - Uses Connectable interface for routing
 * - Handles AudioBufferSourceNode one-time-use pattern:
 *   AudioBufferSourceNodes can only be started once, so we recreate
 *   them each time play() is called.
 */

import { audioEngine } from './AudioEngine';
import { Connectable } from './types';

export class AudioSample implements Connectable {
  private _name: string;
  private _buffer: AudioBuffer | null = null;
  private _source: AudioBufferSourceNode | null = null;
  private _duration: number = 0;
  private _timestamp: number = 0; // Position in playlist (seconds)
  private _connections: Connectable[] = [];
  private _loaded: boolean = false;
  private _gainNode: GainNode;

  constructor(name: string) {
    this._name = name;
    // GainNode acts as a persistent output that connections can attach to
    // Use factory method — Tone.js rawContext is a standardized-audio-context wrapper
    this._gainNode = audioEngine.context.createGain();
  }

  // ===== Loading =====

  /**
   * Load audio from a URL (browser-compatible).
   * Replaces butterDAWg's fs.readFileSync approach.
   */
  async loadFromUrl(url: string): Promise<void> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._buffer = await audioEngine.decodeAudioData(arrayBuffer);
    this._duration = this._buffer.duration;
    this._loaded = true;
    console.log(`🔊 Sample "${this._name}" loaded (${this._duration.toFixed(2)}s)`);
  }

  /**
   * Load from an existing AudioBuffer (e.g., from Tone.js Player or recorded audio).
   */
  loadFromBuffer(buffer: AudioBuffer): void {
    this._buffer = buffer;
    this._duration = buffer.duration;
    this._loaded = true;
  }

  /**
   * Load from raw Float32Array data (like butterDAWg's Sample constructor).
   */
  loadFromFloat32(data: Float32Array, sampleRate?: number): void {
    const rate = sampleRate || audioEngine.sampleRate;
    this._buffer = audioEngine.createBuffer(2, data.length, rate);
    // Use new Float32Array(data) to ensure ArrayBuffer (not SharedArrayBuffer) type
    const channelData = new Float32Array(data);
    this._buffer.copyToChannel(channelData, 0);
    this._buffer.copyToChannel(channelData, 1);
    this._duration = this._buffer.duration;
    this._loaded = true;
  }

  // ===== Connectable interface =====

  /**
   * Returns a NEW AudioBufferSourceNode each time (one-time-use pattern).
   * This matches butterDAWg's Sample.getAudioNode() behavior.
   * The source is connected to all registered destinations.
   */
  getAudioNode(): AudioNode {
    return this._gainNode;
  }

  connect(destination: Connectable): void {
    this._connections.push(destination);
    this._gainNode.connect(destination.getAudioNode());
  }

  disconnect(destination?: Connectable): void {
    if (destination) {
      this._connections = this._connections.filter(c => c !== destination);
      try { this._gainNode.disconnect(destination.getAudioNode()); } catch { /* ok */ }
    } else {
      this._connections = [];
      try { this._gainNode.disconnect(); } catch { /* ok */ }
    }
  }

  // ===== Playback =====

  /**
   * Play the sample. Creates a new AudioBufferSourceNode each time.
   * @param when - AudioContext time to start playback
   * @param offset - Offset into the buffer to start from (seconds)
   */
  play(when?: number, offset?: number): AudioBufferSourceNode | null {
    if (!this._buffer || !this._loaded) return null;

    // Create fresh source (one-time-use)
    // Use factory method — Tone.js rawContext is a standardized-audio-context wrapper
    this._source = audioEngine.context.createBufferSource();
    this._source.buffer = this._buffer;
    this._source.connect(this._gainNode);
    this._source.start(when || 0, offset || 0);
    return this._source;
  }

  stop(): void {
    if (this._source) {
      try { this._source.stop(); } catch { /* already stopped */ }
      this._source = null;
    }
  }

  // ===== Properties =====

  get name(): string { return this._name; }
  get duration(): number { return this._duration; }
  get loaded(): boolean { return this._loaded; }
  get buffer(): AudioBuffer | null { return this._buffer; }

  get timestamp(): number { return this._timestamp; }
  set timestamp(t: number) { this._timestamp = t; }

  // ===== Cleanup =====

  dispose(): void {
    this.stop();
    try { this._gainNode.disconnect(); } catch { /* ok */ }
    this._connections = [];
    this._buffer = null;
    this._loaded = false;
  }
}

