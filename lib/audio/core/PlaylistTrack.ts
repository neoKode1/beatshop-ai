/**
 * PlaylistTrack - A track in the playlist that holds audio samples with timestamps
 * 
 * Adapted from butterDAWg's Track class.
 * Key differences:
 * - Uses audioEngine singleton instead of globals.audiocontext
 * - Uses Connectable interface
 * - Integrates with Tone.Transport for scheduling
 * - No UI-specific code (color is just a string, not a Color class)
 */

import { audioEngine } from './AudioEngine';
import { Connectable } from './types';
import { AudioSample } from './AudioSample';

export class PlaylistTrack implements Connectable {
  private gainNode: GainNode;
  private _samples: AudioSample[];
  private _enabled: boolean;

  public title: string;
  public color: string;

  constructor(title?: string, color?: string) {
    this._enabled = true;
    this._samples = [];
    this.title = title || '';
    this.color = color || '#646e73';

    // GainNode serves as the track's audio bus
    // Use factory method — Tone.js rawContext is a standardized-audio-context wrapper
    this.gainNode = audioEngine.context.createGain();
  }

  // ===== Connectable interface =====

  getAudioNode(): AudioNode {
    return this.gainNode;
  }

  /**
   * Connect this track's output to a destination (typically a Channel).
   */
  connect(destination: Connectable): void {
    this.gainNode.connect(destination.getAudioNode());
  }

  disconnect(destination?: Connectable): void {
    if (destination) {
      try { this.gainNode.disconnect(destination.getAudioNode()); } catch { /* ok */ }
    } else {
      try { this.gainNode.disconnect(); } catch { /* ok */ }
    }
  }

  // ===== Sample Management =====

  getSamples(): AudioSample[] {
    return [...this._samples];
  }

  addSample(sample: AudioSample): void {
    sample.connect(this);
    this._samples.push(sample);
  }

  removeSample(sample: AudioSample): void {
    sample.disconnect(this);
    const idx = this._samples.indexOf(sample);
    if (idx !== -1) this._samples.splice(idx, 1);
  }

  // ===== Playback =====

  /**
   * Play all samples on this track, scheduled relative to current audio time.
   * Adapted from butterDAWg Track.play() with time offset calculation.
   * 
   * @param playbackStartTime - The AudioContext time when playback started
   * @param cursorTimeOffset - The cursor position in seconds (for mid-song playback)
   */
  play(playbackStartTime?: number, cursorTimeOffset: number = 0): void {
    if (!this._enabled) return;

    const now = audioEngine.currentTime;
    const startTime = playbackStartTime || now;

    for (const sample of this._samples) {
      // Calculate when this sample should start in AudioContext time
      const sampleStartTime = startTime + (sample.timestamp - cursorTimeOffset);

      if (sampleStartTime >= now) {
        // Sample starts in the future — schedule it
        sample.play(sampleStartTime);
      } else if (sampleStartTime + sample.duration >= now) {
        // Sample already started but hasn't ended — play from offset
        const offset = now - sampleStartTime;
        sample.play(now, offset);
      }
      // If sample has already ended, skip it
    }
  }

  stop(): void {
    for (const sample of this._samples) {
      sample.stop();
    }
  }

  // ===== State =====

  get enabled(): boolean { return this._enabled; }
  set enabled(v: boolean) { this._enabled = v; }

  get active(): boolean { return this._enabled; }
  set active(v: boolean) { this._enabled = v; }

  // ===== Cleanup =====

  dispose(): void {
    this.stop();
    for (const sample of this._samples) {
      sample.disconnect(this);
    }
    this._samples = [];
    try { this.gainNode.disconnect(); } catch { /* ok */ }
  }
}

