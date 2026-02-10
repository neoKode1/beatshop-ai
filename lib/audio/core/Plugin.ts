/**
 * AudioPlugin - AudioWorklet-based plugin system
 * 
 * Adapted from butterDAWg's Plugin class.
 * Key differences from butterDAWg:
 * - Browser-compatible: uses fetch + blob URLs instead of fs.readFileSync
 * - Uses audioEngine singleton instead of globals.audiocontext
 * - Implements Connectable interface
 * - Async initialization (AudioWorklet loading is async)
 */

import { audioEngine } from './AudioEngine';
import { Connectable } from './types';

export class AudioPlugin implements Connectable {
  public name: string;
  private _audioNode: AudioWorkletNode | null = null;
  private _ready: boolean = false;
  private _readyPromise: Promise<void>;

  /**
   * Create a plugin from an AudioWorklet processor.
   * 
   * @param processorName - The registered processor name (used in AudioWorkletNode constructor)
   * @param moduleUrl - URL to the AudioWorklet processor JS file (e.g. '/plugins/gain/processor.js')
   */
  constructor(processorName: string, moduleUrl?: string) {
    this.name = processorName;
    this._readyPromise = this.initialize(processorName, moduleUrl);
  }

  /**
   * Initialize the AudioWorklet node.
   * First tries to create the node directly (processor may already be registered).
   * If that fails, loads the module from the URL and retries.
   */
  private async initialize(processorName: string, moduleUrl?: string): Promise<void> {
    const ctx = audioEngine.context;

    try {
      // Optimistically try creating the node (processor may already be loaded)
      this._audioNode = new AudioWorkletNode(ctx, processorName);
      this._ready = true;
    } catch {
      // Processor not yet registered — load the module
      if (!moduleUrl) {
        throw new Error(
          `AudioWorklet processor "${processorName}" not registered and no moduleUrl provided`
        );
      }

      try {
        // Try loading directly from URL first
        await ctx.audioWorklet.addModule(moduleUrl);
      } catch {
        // If direct URL fails, try fetching and creating a blob URL
        // This handles CORS issues and local file paths
        const response = await fetch(moduleUrl);
        const code = await response.text();
        const blob = new Blob([code], { type: 'application/javascript; charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        await ctx.audioWorklet.addModule(blobUrl);
        URL.revokeObjectURL(blobUrl);
      }

      this._audioNode = new AudioWorkletNode(ctx, processorName);
      this._ready = true;
    }
  }

  /**
   * Wait for the plugin to be ready (AudioWorklet loaded).
   */
  async whenReady(): Promise<void> {
    return this._readyPromise;
  }

  get ready(): boolean {
    return this._ready;
  }

  // ===== Connectable interface =====

  getAudioNode(): AudioNode {
    if (!this._audioNode) {
      throw new Error(`Plugin "${this.name}" is not ready yet. Await whenReady() first.`);
    }
    return this._audioNode;
  }

  // ===== Parameter Access =====

  /**
   * Get a parameter from the AudioWorklet processor.
   */
  getParam(name: string): AudioParam | undefined {
    return this._audioNode?.parameters.get(name);
  }

  /**
   * Set a parameter value on the AudioWorklet processor.
   */
  setParam(name: string, value: number): void {
    const param = this._audioNode?.parameters.get(name);
    if (param) {
      param.value = value;
    }
  }

  // ===== Cleanup =====

  dispose(): void {
    if (this._audioNode) {
      try { this._audioNode.disconnect(); } catch { /* ok */ }
      this._audioNode = null;
    }
    this._ready = false;
  }
}

