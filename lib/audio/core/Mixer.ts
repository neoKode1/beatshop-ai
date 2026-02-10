/**
 * Mixer - Manages audio channels and master output
 *
 * Adapted from butterDAWg's Mixer class.
 * In FL Studio: all channels route to the Mixer, which has a master channel.
 * The master channel routes to the MasterEffects chain.
 *
 * Signal flow:
 *   Track sources → Channel → Mixer master → MasterEffects → destination
 */

import { Channel } from './Channel';
import { Connectable, MixerConfig } from './types';

export class Mixer {
  private static _instance: Mixer | null = null;
  private channels: Channel[];
  private _master: Channel;
  private _defaultChannel: Channel | null = null;

  constructor() {
    this.channels = [];

    // Master channel — all other channels route here
    this._master = new Channel('Master');
  }

  /**
   * Get or create the singleton Mixer instance.
   */
  static getInstance(): Mixer {
    if (!Mixer._instance) {
      Mixer._instance = new Mixer();
    }
    return Mixer._instance;
  }

  /**
   * Get (or create) a default channel for general audio routing.
   * This is used when audio sources don't have a specific channel assignment.
   */
  getDefaultChannel(): Channel {
    if (!this._defaultChannel) {
      this._defaultChannel = this.addChannel('Default');
    }
    return this._defaultChannel;
  }

  // ===== Channel Management =====

  get master(): Channel {
    return this._master;
  }

  getChannels(): Channel[] {
    return [...this.channels];
  }

  getChannel(index: number): Channel | null {
    return this.channels[index] ?? null;
  }

  getChannelById(id: string): Channel | null {
    return this.channels.find(ch => ch.id === id) ?? null;
  }

  /**
   * Create a new channel and route it to the master.
   * Adapted from butterDAWg Mixer.newChannel()
   */
  addChannel(name?: string): Channel {
    const channel = new Channel(name || `Channel ${this.channels.length + 1}`);
    // Route channel output → master input
    channel.connect(this._master);
    this.channels.push(channel);
    console.log(`🎚️ Mixer: added channel "${channel.name}" (${this.channels.length} total)`);
    return channel;
  }

  /**
   * Remove a channel by index. Disposes the channel.
   */
  removeChannel(index: number): void {
    if (index < 0 || index >= this.channels.length) return;
    const channel = this.channels[index];
    channel.dispose();
    this.channels.splice(index, 1);
    console.log(`🎚️ Mixer: removed channel at index ${index}`);
  }

  /**
   * Remove a channel by ID.
   */
  removeChannelById(id: string): void {
    const index = this.channels.findIndex(ch => ch.id === id);
    if (index !== -1) this.removeChannel(index);
  }

  /**
   * Route the mixer master output to a downstream destination.
   * Typically called once to connect master → MasterEffects chain.
   */
  connectMasterTo(destination: Connectable): void {
    this._master.connect(destination);
  }

  /**
   * Handle solo logic: when any channel is soloed, mute all non-soloed channels.
   * Call this whenever solo state changes on any channel.
   */
  updateSoloState(): void {
    const anySoloed = this.channels.some(ch => ch.solo);

    if (anySoloed) {
      // Mute all non-soloed channels
      for (const ch of this.channels) {
        if (!ch.solo && !ch.muted) {
          ch.muted = true;
        }
      }
    }
    // Note: un-soloing should be handled by the caller restoring mute states
  }

  // ===== Serialization =====

  toConfig(): MixerConfig {
    return {
      channels: this.channels.map(ch => ch.toConfig()),
      masterVolume: this._master.volume,
    };
  }

  // ===== Cleanup =====

  dispose(): void {
    for (const channel of this.channels) {
      channel.dispose();
    }
    this._master.dispose();
    this.channels = [];
    this._defaultChannel = null;
    Mixer._instance = null;
    console.log('🎚️ Mixer disposed');
  }
}

/**
 * Connectable adapter for Tone.js ToneAudioNode.
 * Bridges our raw Web Audio Connectable interface with Tone.js's getInput().
 *
 * Tone.js wraps raw AudioNodes in multiple layers of ToneAudioNode classes.
 * For example: Tone.Reverb.input → Tone.Gain → raw GainNode.
 * We recursively unwrap until we reach the actual raw Web Audio node that
 * standardized-audio-context recognizes (detected by absence of .dispose()).
 */
export class ToneNodeAdapter implements Connectable {
  private _node: AudioNode;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(toneNode: any) {
    let node = toneNode;
    // Tone.js ToneAudioNode objects have .dispose() — raw AudioNodes don't.
    // Keep unwrapping .input until we hit the raw Web Audio node.
    while (node && typeof node.dispose === 'function' && node.input != null) {
      node = node.input;
    }
    this._node = node as AudioNode;
  }

  getAudioNode(): AudioNode {
    return this._node;
  }
}

/**
 * Get the singleton Mixer instance.
 * Convenience function, similar to getMasterEffects().
 */
export const getMixer = () => Mixer.getInstance();
