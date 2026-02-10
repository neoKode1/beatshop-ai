/**
 * Channel - Audio routing channel with plugin insert chain
 * 
 * Adapted from butterDAWg's Channel class.
 * Audio signal flow:
 *   input (AnalyserNode) → [plugin slots 0-9] → panner → gain → output (AnalyserNode) → destination
 * 
 * When no plugins are inserted, input connects directly to panner.
 * Adding/removing plugins dynamically reconnects the chain.
 * 
 * Implements Connectable so other objects can route audio INTO this channel.
 */

import { audioEngine } from './AudioEngine';
import { Connectable, AudioRoutable, PluginSlot, MAX_PLUGIN_SLOTS, ChannelConfig } from './types';
import type { AudioPlugin } from './Plugin';

let channelIdCounter = 0;

export class Channel implements AudioRoutable {
  readonly id: string;
  private _name: string;

  // Audio nodes — raw Web Audio API for maximum control
  private input: AnalyserNode;
  private plugins: PluginSlot[];
  private pannerNode: StereoPannerNode;
  private gainNode: GainNode;
  private output: AnalyserNode;

  // State
  private _volume: number;
  private _panning: number;
  private _muted: boolean;
  private _solo: boolean;

  // Where this channel's output goes (another Channel, or destination)
  private _destination: AudioNode | null = null;

  constructor(name?: string) {
    this.id = `ch-${++channelIdCounter}-${Date.now()}`;
    this._name = name || '';

    const ctx = audioEngine.context;

    // Input: AnalyserNode allows any number of sources to connect
    // Use factory methods instead of constructors because Tone.js rawContext
    // is a standardized-audio-context wrapper, not a native AudioContext.
    // Constructor syntax (new AnalyserNode(ctx)) fails the instanceof check,
    // but factory methods (ctx.createAnalyser()) work correctly.
    this.input = ctx.createAnalyser();
    this.input.fftSize = 256;

    // Plugin slots: 10 insert slots, all empty initially
    this.plugins = Array.from({ length: MAX_PLUGIN_SLOTS }, () => null);

    // StereoPannerNode is simpler and more appropriate than PannerNode for stereo panning
    // butterDAWg used PannerNode with positionX, but StereoPannerNode is the correct choice
    this.pannerNode = ctx.createStereoPanner();

    // Gain for volume control
    this.gainNode = ctx.createGain();

    // Output analyser for metering
    this.output = ctx.createAnalyser();
    this.output.fftSize = 256;

    // Default chain: input → panner → gain → output
    this.input.connect(this.pannerNode);
    this.pannerNode.connect(this.gainNode);
    this.gainNode.connect(this.output);

    // Default: connect to audio destination
    this.output.connect(audioEngine.destination);
    this._destination = audioEngine.destination;

    this._volume = 1;
    this._panning = 0;
    this._muted = false;
    this._solo = false;
  }

  // ===== Connectable interface =====

  /** Upstream sources connect TO this node */
  getAudioNode(): AudioNode {
    return this.input;
  }

  /** Route this channel's output to a downstream destination */
  connect(destination: Connectable): void {
    if (this._destination) {
      this.output.disconnect(this._destination);
    }
    this._destination = destination.getAudioNode();
    this.output.connect(this._destination);
  }

  /** Disconnect from destination */
  disconnect(): void {
    if (this._destination) {
      try { this.output.disconnect(this._destination); } catch { /* already disconnected */ }
      this._destination = null;
    }
  }

  // ===== Volume & Pan =====

  get volume(): number { return this._volume; }
  set volume(v: number) {
    this._volume = Math.max(0, Math.min(2, v)); // Allow up to +6dB (2x gain)
    this.gainNode.gain.value = this._muted ? 0 : this._volume;
  }

  get panning(): number { return this._panning; }
  set panning(p: number) {
    this._panning = Math.max(-1, Math.min(1, p));
    this.pannerNode.pan.value = this._panning;
  }

  get muted(): boolean { return this._muted; }
  set muted(m: boolean) {
    this._muted = m;
    this.gainNode.gain.value = m ? 0 : this._volume;
  }

  get solo(): boolean { return this._solo; }
  set solo(s: boolean) { this._solo = s; }

  get name(): string { return this._name; }
  set name(n: string) { this._name = n; }

  // ===== Plugin Management =====

  getPlugins(): PluginSlot[] {
    return [...this.plugins];
  }

  /**
   * Insert a plugin into a slot, dynamically reconnecting the audio chain.
   * Adapted from butterDAWg Channel.addPlugin().
   *
   * Chain logic:
   *   - Find the preceding occupied slot (or input if none)
   *   - Find the succeeding occupied slot (or pannerNode if none)
   *   - Disconnect preceding → old_next, connect preceding → plugin → succeeding
   */
  addPlugin(plugin: AudioPlugin, index?: number): boolean {
    // Find first empty slot if index not specified
    if (index === undefined) {
      index = this.plugins.findIndex((v) => v === null);
    }

    // No empty slots
    if (index === -1 || index >= MAX_PLUGIN_SLOTS) {
      console.warn('⚠️ All plugin slots are full');
      return false;
    }

    // Slot already occupied
    if (this.plugins[index] !== null) {
      console.warn(`⚠️ Plugin slot ${index} is already occupied`);
      return false;
    }

    this.plugins[index] = plugin;

    // Find the last occupied slot BEFORE this one (search backwards)
    let precedingIdx = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (this.plugins[i] !== null) { precedingIdx = i; break; }
    }

    // Find the first occupied slot AFTER this one
    let succeedingIdx = -1;
    for (let i = index + 1; i < MAX_PLUGIN_SLOTS; i++) {
      if (this.plugins[i] !== null) { succeedingIdx = i; break; }
    }

    // Reconnect: preceding node → new plugin
    if (precedingIdx === -1) {
      // No preceding plugin: disconnect input → panner, connect input → plugin
      this.input.disconnect(this.pannerNode);
      this.input.connect(plugin.getAudioNode());
    } else {
      // Disconnect preceding plugin → its old downstream
      const prev = this.plugins[precedingIdx]!;
      try { prev.getAudioNode().disconnect(); } catch { /* ok */ }
      prev.getAudioNode().connect(plugin.getAudioNode());
    }

    // Reconnect: new plugin → succeeding node
    if (succeedingIdx === -1) {
      // No succeeding plugin: connect plugin → panner
      plugin.getAudioNode().connect(this.pannerNode);
    } else {
      plugin.getAudioNode().connect(this.plugins[succeedingIdx]!.getAudioNode());
    }

    console.log(`🔌 Added plugin "${plugin.name}" to channel "${this._name}" at slot ${index}`);
    return true;
  }

  /**
   * Remove a plugin from a slot and reconnect the chain.
   */
  removePlugin(index: number): AudioPlugin | null {
    if (index < 0 || index >= MAX_PLUGIN_SLOTS) return null;

    const plugin = this.plugins[index];
    if (!plugin) return null;

    // Find neighbors
    let precedingIdx = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (this.plugins[i] !== null) { precedingIdx = i; break; }
    }
    let succeedingIdx = -1;
    for (let i = index + 1; i < MAX_PLUGIN_SLOTS; i++) {
      if (this.plugins[i] !== null) { succeedingIdx = i; break; }
    }

    // Disconnect this plugin from both sides
    try { plugin.getAudioNode().disconnect(); } catch { /* ok */ }

    // Reconnect: preceding → succeeding (or panner)
    if (precedingIdx === -1) {
      // Reconnect input to next plugin or panner
      if (succeedingIdx === -1) {
        this.input.connect(this.pannerNode);
      } else {
        this.input.connect(this.plugins[succeedingIdx]!.getAudioNode());
      }
    } else {
      const prev = this.plugins[precedingIdx]!;
      try { prev.getAudioNode().disconnect(); } catch { /* ok */ }
      if (succeedingIdx === -1) {
        prev.getAudioNode().connect(this.pannerNode);
      } else {
        prev.getAudioNode().connect(this.plugins[succeedingIdx]!.getAudioNode());
      }
    }

    this.plugins[index] = null;
    console.log(`🔌 Removed plugin "${plugin.name}" from channel "${this._name}" slot ${index}`);
    return plugin;
  }

  // ===== Metering =====

  /**
   * Get float time-domain data from the output analyser (for waveform/level metering).
   * Adapted from butterDAWg Channel.getFloatTimeDomainData()
   */
  getFloatTimeDomainData(): Float32Array {
    const buffer = new Float32Array(this.output.frequencyBinCount);
    this.output.getFloatTimeDomainData(buffer);
    return buffer;
  }

  /**
   * Get peak level (0-1) from output analyser for simple VU metering.
   */
  getPeakLevel(): number {
    const data = this.getFloatTimeDomainData();
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
    return peak;
  }

  // ===== Serialization =====

  toConfig(): ChannelConfig {
    return {
      id: this.id,
      name: this._name,
      volume: this._volume,
      panning: this._panning,
      muted: this._muted,
      solo: this._solo,
    };
  }

  applyConfig(config: Partial<ChannelConfig>): void {
    if (config.name !== undefined) this._name = config.name;
    if (config.volume !== undefined) this.volume = config.volume;
    if (config.panning !== undefined) this.panning = config.panning;
    if (config.muted !== undefined) this.muted = config.muted;
    if (config.solo !== undefined) this._solo = config.solo;
  }

  // ===== Cleanup =====

  dispose(): void {
    // Disconnect everything
    try { this.input.disconnect(); } catch { /* ok */ }
    try { this.pannerNode.disconnect(); } catch { /* ok */ }
    try { this.gainNode.disconnect(); } catch { /* ok */ }
    try { this.output.disconnect(); } catch { /* ok */ }

    // Disconnect all plugins
    for (const plugin of this.plugins) {
      if (plugin) {
        try { plugin.getAudioNode().disconnect(); } catch { /* ok */ }
      }
    }
    this.plugins.fill(null);
  }
}
