/**
 * Core audio types for BeashopAI
 * Adapted from butterDAWg's Connectable interface pattern
 * 
 * The Connectable interface is the universal audio routing contract:
 * any audio source can connect to any Connectable destination.
 * This enables flexible routing: Track → Channel → Master, or
 * Track → Channel → Channel (sub-mixing), etc.
 */

/**
 * Any object that can receive audio connections.
 * Implementors expose their input AudioNode so upstream
 * sources can connect to them.
 */
export interface Connectable {
  /** Return the AudioNode that upstream sources should connect TO */
  getAudioNode(): AudioNode;
}

/**
 * Extended interface for objects that can both receive and send audio.
 * Used by Channel, Plugin, etc.
 */
export interface AudioRoutable extends Connectable {
  /** Connect this object's output to a downstream Connectable */
  connect(destination: Connectable): void;
  /** Disconnect from a specific destination or all destinations */
  disconnect(destination?: Connectable): void;
}

/**
 * Plugin slot state — null means empty slot
 */
export type PluginSlot = import('./Plugin').AudioPlugin | null;

/**
 * Maximum number of plugin insert slots per channel (FL Studio standard)
 */
export const MAX_PLUGIN_SLOTS = 10;

/**
 * Channel configuration for serialization
 */
export interface ChannelConfig {
  id: string;
  name: string;
  volume: number;    // 0-1 gain
  panning: number;   // -1 (left) to 1 (right)
  muted: boolean;
  solo: boolean;
}

/**
 * Mixer configuration for serialization
 */
export interface MixerConfig {
  channels: ChannelConfig[];
  masterVolume: number;
}

