/**
 * Playlist - Manages playlist tracks for arrangement view
 * 
 * Adapted from butterDAWg's Playlist class.
 * Key differences:
 * - Uses audioEngine singleton
 * - Integrates with Tone.Transport for BPM-synced playback
 * - Tracks connect to Mixer channels for routing
 */

import { audioEngine } from './AudioEngine';
import { PlaylistTrack } from './PlaylistTrack';
import { Connectable } from './types';

export class Playlist {
  private _tracks: PlaylistTrack[];
  private _playing: boolean;

  constructor() {
    this._tracks = [];
    this._playing = false;
  }

  // ===== Track Management =====

  get tracks(): PlaylistTrack[] {
    return [...this._tracks];
  }

  get trackCount(): number {
    return this._tracks.length;
  }

  getTrack(index: number): PlaylistTrack | null {
    return this._tracks[index] ?? null;
  }

  /**
   * Create a new track and add it to the playlist.
   */
  addTrack(title?: string, color?: string): PlaylistTrack {
    const track = new PlaylistTrack(
      title || `Track ${this._tracks.length + 1}`,
      color
    );
    this._tracks.push(track);
    return track;
  }

  /**
   * Remove a track from the playlist.
   */
  removeTrack(track: PlaylistTrack): void {
    const idx = this._tracks.indexOf(track);
    if (idx !== -1) {
      track.dispose();
      this._tracks.splice(idx, 1);
    }
  }

  removeTrackAt(index: number): void {
    if (index >= 0 && index < this._tracks.length) {
      this._tracks[index].dispose();
      this._tracks.splice(index, 1);
    }
  }

  /**
   * Connect a track to a destination (typically a Mixer Channel).
   */
  connectTrackTo(trackIndex: number, destination: Connectable): void {
    const track = this._tracks[trackIndex];
    if (track) {
      track.connect(destination);
    }
  }

  getTrackIndex(track: PlaylistTrack): number {
    return this._tracks.indexOf(track);
  }

  // ===== Playback =====

  /**
   * Play all tracks. Resumes the audio context if suspended.
   * Adapted from butterDAWg Playlist.play()
   */
  async play(cursorTimeOffset: number = 0): Promise<void> {
    await audioEngine.resume();
    const startTime = audioEngine.currentTime;

    for (const track of this._tracks) {
      track.play(startTime, cursorTimeOffset);
    }
    this._playing = true;
  }

  /**
   * Stop all tracks.
   */
  stop(): void {
    for (const track of this._tracks) {
      track.stop();
    }
    this._playing = false;
  }

  get playing(): boolean {
    return this._playing;
  }

  // ===== Cleanup =====

  dispose(): void {
    this.stop();
    for (const track of this._tracks) {
      track.dispose();
    }
    this._tracks = [];
  }
}

