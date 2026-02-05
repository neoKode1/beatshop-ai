/**
 * MIDI Service - Web MIDI API integration for external MIDI controllers
 * 
 * Features:
 * - MIDI device detection and connection
 * - MIDI Learn mode for mapping controls
 * - Note and CC message handling
 */

export interface MidiMapping {
  id: string;
  type: 'note' | 'cc';
  channel: number;
  value: number; // Note number or CC number
  target: MidiMappingTarget;
  label: string;
}

export interface MidiMappingTarget {
  type: 'pad' | 'knob' | 'button' | 'slider' | 'transport';
  id: string | number; // Pad index, control ID, etc.
  action?: string; // For buttons: play, stop, record, etc.
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  connected: boolean;
}

type MidiMessageCallback = (message: {
  type: 'noteOn' | 'noteOff' | 'cc';
  channel: number;
  value: number;
  velocity: number;
}) => void;

class MidiService {
  private midiAccess: MIDIAccess | null = null;
  private inputs: Map<string, MIDIInput> = new Map();
  private mappings: Map<string, MidiMapping> = new Map();
  private messageCallbacks: Set<MidiMessageCallback> = new Set();
  private learnCallback: MidiMessageCallback | null = null;
  private isLearning: boolean = false;

  async initialize(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      console.log('🎹 Web MIDI API not supported in this browser');
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      console.log('🎹 MIDI Access granted');

      // Set up input listeners
      this.midiAccess.inputs.forEach((input) => {
        this.connectInput(input);
      });

      // Listen for connection changes
      this.midiAccess.onstatechange = (e) => {
        const port = e.port;
        if (port.type === 'input') {
          if (port.state === 'connected') {
            this.connectInput(port as MIDIInput);
          } else {
            this.disconnectInput(port.id);
          }
        }
      };

      return true;
    } catch (error) {
      console.error('🎹 MIDI Access denied:', error);
      return false;
    }
  }

  private connectInput(input: MIDIInput): void {
    if (this.inputs.has(input.id)) return;

    input.onmidimessage = (event) => this.handleMidiMessage(event);
    this.inputs.set(input.id, input);
    console.log(`🎹 MIDI Input connected: ${input.name || input.id}`);
  }

  private disconnectInput(id: string): void {
    const input = this.inputs.get(id);
    if (input) {
      input.onmidimessage = null;
      this.inputs.delete(id);
      console.log(`🎹 MIDI Input disconnected: ${input.name || id}`);
    }
  }

  private handleMidiMessage(event: MIDIMessageEvent): void {
    const [status, data1, data2] = event.data || [];
    if (status === undefined) return;

    const channel = (status & 0x0f) + 1;
    const messageType = status & 0xf0;

    let message: Parameters<MidiMessageCallback>[0] | null = null;

    switch (messageType) {
      case 0x90: // Note On
        if (data2 > 0) {
          message = { type: 'noteOn', channel, value: data1, velocity: data2 };
          console.log(`🎹 Note ON: Ch${channel} Note${data1} Vel${data2}`);
        } else {
          message = { type: 'noteOff', channel, value: data1, velocity: 0 };
        }
        break;
      case 0x80: // Note Off
        message = { type: 'noteOff', channel, value: data1, velocity: 0 };
        console.log(`🎹 Note OFF: Ch${channel} Note${data1}`);
        break;
      case 0xb0: // Control Change
        message = { type: 'cc', channel, value: data1, velocity: data2 };
        console.log(`🎹 CC: Ch${channel} CC${data1} Val${data2}`);
        break;
    }

    if (message) {
      // If in learn mode, send to learn callback
      if (this.isLearning && this.learnCallback) {
        this.learnCallback(message);
      } else {
        // Normal mode: notify all callbacks
        this.messageCallbacks.forEach((cb) => cb(message!));
      }
    }
  }

  // Get connected devices
  getDevices(): MidiDevice[] {
    const devices: MidiDevice[] = [];
    this.inputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
        connected: input.state === 'connected',
      });
    });
    return devices;
  }

  // Subscribe to MIDI messages
  onMessage(callback: MidiMessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  // Start MIDI Learn mode
  startLearn(callback: MidiMessageCallback): void {
    this.isLearning = true;
    this.learnCallback = callback;
    console.log('🎹 MIDI Learn mode STARTED - press a key or move a control');
  }

  // Stop MIDI Learn mode
  stopLearn(): void {
    this.isLearning = false;
    this.learnCallback = null;
    console.log('🎹 MIDI Learn mode STOPPED');
  }

  // Add a mapping
  addMapping(mapping: MidiMapping): void {
    const key = `${mapping.type}_${mapping.channel}_${mapping.value}`;
    this.mappings.set(key, mapping);
    console.log(`🎹 MIDI Mapping added: ${mapping.label} -> ${mapping.type} Ch${mapping.channel} ${mapping.value}`);
  }

  // Remove a mapping
  removeMapping(id: string): void {
    for (const [key, mapping] of this.mappings) {
      if (mapping.id === id) {
        this.mappings.delete(key);
        console.log(`🎹 MIDI Mapping removed: ${mapping.label}`);
        break;
      }
    }
  }

  // Get all mappings
  getMappings(): MidiMapping[] {
    return Array.from(this.mappings.values());
  }

  // Load mappings from storage
  loadMappings(mappings: MidiMapping[]): void {
    this.mappings.clear();
    mappings.forEach((mapping) => {
      const key = `${mapping.type}_${mapping.channel}_${mapping.value}`;
      this.mappings.set(key, mapping);
    });
    console.log(`🎹 Loaded ${mappings.length} MIDI mappings`);
  }

  // Get mapping for a MIDI message
  getMappingForMessage(type: 'note' | 'cc', channel: number, value: number): MidiMapping | undefined {
    const key = `${type}_${channel}_${value}`;
    return this.mappings.get(key);
  }

  // Check if MIDI is supported
  isSupported(): boolean {
    return 'requestMIDIAccess' in navigator;
  }

  // Check if initialized
  isInitialized(): boolean {
    return this.midiAccess !== null;
  }
}

export const midiService = new MidiService();

