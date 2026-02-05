import * as Tone from 'tone';
import { getMasterEffects } from './effects';

/**
 * AudioPlayerService - Centralized audio playback with player pooling
 * 
 * Eliminates redundant Tone.Player creation across:
 * - SampleBrowser (preview)
 * - ArrangementPlayback (scheduled playback)
 * - AudioExport (export rendering)
 * - PianoKeyboard (chromatic playback)
 * - useBeatStore (pad/track playback)
 */

interface PooledPlayer {
  player: Tone.Player;
  url: string;
  inUse: boolean;
  lastUsed: number;
}

interface PlayOptions {
  volume?: number; // 0-1
  playbackRate?: number; // For pitch shifting
  startTime?: number; // Tone.js time
  onEnded?: () => void;
  connectToMaster?: boolean; // Default true
}

class AudioPlayerService {
  private static instance: AudioPlayerService | null = null;
  private playerPool: Map<string, PooledPlayer[]> = new Map();
  private maxPoolSize = 8; // Max players per URL
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start cleanup interval (every 30 seconds)
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
  }

  public static getInstance(): AudioPlayerService {
    if (!AudioPlayerService.instance) {
      AudioPlayerService.instance = new AudioPlayerService();
    }
    return AudioPlayerService.instance;
  }

  /**
   * Play an audio file with optional settings
   * Returns the player instance for control (stop, etc.)
   */
  public async play(url: string, options: PlayOptions = {}): Promise<Tone.Player | null> {
    // Validate URL before attempting to play
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.error('AudioPlayerService: Invalid URL provided:', url);
      return null;
    }

    const {
      volume = 0.8,
      playbackRate = 1,
      startTime,
      onEnded,
      connectToMaster = true,
    } = options;

    try {
      await Tone.start();

      // Try to get a pooled player
      let player = this.getFromPool(url);

      if (!player) {
        // Create new player
        player = new Tone.Player(url);
        
        if (connectToMaster) {
          player.connect(getMasterEffects().getInput());
        } else {
          player.toDestination();
        }

        await player.load(url);
        this.addToPool(url, player);
      }

      // Configure player
      player.volume.value = Tone.gainToDb(volume);
      player.playbackRate = playbackRate;

      // Handle ended callback
      if (onEnded) {
        player.onstop = () => {
          this.releaseToPool(url, player!);
          onEnded();
        };
      } else {
        player.onstop = () => this.releaseToPool(url, player!);
      }

      // Start playback
      if (startTime !== undefined) {
        player.start(startTime);
      } else {
        player.start();
      }

      return player;
    } catch (error) {
      // Provide helpful error message for common issues
      const isBlobUrl = url.startsWith('blob:');
      if (isBlobUrl) {
        console.error(
          'AudioPlayerService: Failed to play blob URL (may have expired after page refresh):',
          url,
          error
        );
      } else {
        console.error('AudioPlayerService: Failed to play', url, error);
      }
      return null;
    }
  }

  /**
   * Preview a sample (one-shot, auto-cleanup)
   */
  public async preview(url: string, volume = 0.8): Promise<void> {
    await this.play(url, { volume, connectToMaster: true });
  }

  /**
   * Play with pitch shifting (for chromatic playback)
   */
  public async playPitched(
    url: string,
    semitones: number,
    volume = 0.8
  ): Promise<Tone.Player | null> {
    const playbackRate = Math.pow(2, semitones / 12);
    return this.play(url, { volume, playbackRate });
  }

  /**
   * Schedule playback at a specific time (for arrangement/export)
   */
  public async schedulePlay(
    url: string,
    time: number | string,
    volume = 0.8
  ): Promise<Tone.Player | null> {
    const startTime = typeof time === 'string' 
      ? Tone.Time(time).toSeconds() 
      : time;
    return this.play(url, { volume, startTime });
  }

  private getFromPool(url: string): Tone.Player | null {
    const pool = this.playerPool.get(url);
    if (!pool) return null;

    const available = pool.find(p => !p.inUse && p.player.loaded);
    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();
      return available.player;
    }
    return null;
  }

  private addToPool(url: string, player: Tone.Player): void {
    if (!this.playerPool.has(url)) {
      this.playerPool.set(url, []);
    }

    const pool = this.playerPool.get(url)!;

    // Limit pool size
    if (pool.length >= this.maxPoolSize) {
      const oldest = pool.reduce((a, b) => a.lastUsed < b.lastUsed ? a : b);
      oldest.player.dispose();
      pool.splice(pool.indexOf(oldest), 1);
    }

    pool.push({
      player,
      url,
      inUse: true,
      lastUsed: Date.now(),
    });
  }

  private releaseToPool(url: string, player: Tone.Player): void {
    const pool = this.playerPool.get(url);
    if (!pool) return;

    const pooled = pool.find(p => p.player === player);
    if (pooled) {
      pooled.inUse = false;
      pooled.lastUsed = Date.now();
    }
  }

  /**
   * Cleanup old unused players (called periodically)
   */
  private cleanup(): void {
    const maxAge = 60000; // 1 minute
    const now = Date.now();

    this.playerPool.forEach((pool, url) => {
      const toRemove = pool.filter(p => !p.inUse && now - p.lastUsed > maxAge);
      toRemove.forEach(p => {
        p.player.dispose();
        pool.splice(pool.indexOf(p), 1);
      });

      if (pool.length === 0) {
        this.playerPool.delete(url);
      }
    });
  }

  /**
   * Stop all players for a URL
   */
  public stopAll(url: string): void {
    const pool = this.playerPool.get(url);
    if (!pool) return;

    pool.forEach(p => {
      if (p.inUse) {
        p.player.stop();
      }
    });
  }

  /**
   * Dispose all players and cleanup
   */
  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.playerPool.forEach(pool => {
      pool.forEach(p => p.player.dispose());
    });
    this.playerPool.clear();
    AudioPlayerService.instance = null;
  }
}

// Singleton accessor
export const getAudioPlayerService = () => AudioPlayerService.getInstance();

// Convenience functions for common use cases
export const previewAudio = (url: string, volume?: number) =>
  getAudioPlayerService().preview(url, volume);

export const playAudioPitched = (url: string, semitones: number, volume?: number) =>
  getAudioPlayerService().playPitched(url, semitones, volume);

export const scheduleAudio = (url: string, time: number | string, volume?: number) =>
  getAudioPlayerService().schedulePlay(url, time, volume);

