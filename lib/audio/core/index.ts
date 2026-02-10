/**
 * Audio Core - barrel export
 * 
 * All the core audio routing classes adapted from butterDAWg,
 * integrated with Tone.js and browser-compatible APIs.
 */

// Foundation
export { audioEngine } from './AudioEngine';
export type { Connectable, AudioRoutable, PluginSlot, ChannelConfig, MixerConfig } from './types';
export { MAX_PLUGIN_SLOTS } from './types';

// Routing
export { Channel } from './Channel';
export { Mixer, getMixer, ToneNodeAdapter } from './Mixer';

// Plugin system
export { AudioPlugin } from './Plugin';

// Audio data
export { AudioSample } from './AudioSample';

// Playlist / arrangement
export { PlaylistTrack } from './PlaylistTrack';
export { Playlist } from './Playlist';

