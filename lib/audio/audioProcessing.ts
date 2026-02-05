/**
 * Audio Processing Utilities for FL Studio-style sample manipulation
 * These functions process raw audio data (Float32Array) for effects like
 * normalize, reverse, DC offset removal, etc.
 */

export interface ProcessedAudio {
  buffer: AudioBuffer;
  url: string;
}

/**
 * Normalize audio to peak at 0dB (maximum amplitude)
 */
export function normalizeAudio(channelData: Float32Array[]): Float32Array[] {
  // Find the maximum absolute value across all channels
  let maxAbs = 0;
  for (const channel of channelData) {
    for (let i = 0; i < channel.length; i++) {
      const abs = Math.abs(channel[i]);
      if (abs > maxAbs) maxAbs = abs;
    }
  }

  // If already normalized or silent, return as-is
  if (maxAbs === 0 || maxAbs >= 0.99) {
    return channelData;
  }

  // Scale all samples
  const scale = 1.0 / maxAbs;
  const result: Float32Array[] = [];
  for (const channel of channelData) {
    const normalized = new Float32Array(channel.length);
    for (let i = 0; i < channel.length; i++) {
      normalized[i] = channel[i] * scale;
    }
    result.push(normalized);
  }

  console.log(`🔊 Normalize: Peak was ${(maxAbs * 100).toFixed(1)}%, scaled by ${scale.toFixed(2)}x`);
  return result;
}

/**
 * Remove DC offset (center the waveform around zero)
 */
export function removeDCOffset(channelData: Float32Array[]): Float32Array[] {
  const result: Float32Array[] = [];
  
  for (const channel of channelData) {
    // Calculate the average (DC offset)
    let sum = 0;
    for (let i = 0; i < channel.length; i++) {
      sum += channel[i];
    }
    const dcOffset = sum / channel.length;

    // Subtract the DC offset from all samples
    const corrected = new Float32Array(channel.length);
    for (let i = 0; i < channel.length; i++) {
      corrected[i] = channel[i] - dcOffset;
    }
    result.push(corrected);
    
    console.log(`🔧 DC Offset removed: ${(dcOffset * 1000).toFixed(3)}ms`);
  }

  return result;
}

/**
 * Reverse the audio
 */
export function reverseAudio(channelData: Float32Array[]): Float32Array[] {
  const result: Float32Array[] = [];
  
  for (const channel of channelData) {
    const reversed = new Float32Array(channel.length);
    for (let i = 0; i < channel.length; i++) {
      reversed[i] = channel[channel.length - 1 - i];
    }
    result.push(reversed);
  }

  console.log('⏪ Audio reversed');
  return result;
}

/**
 * Flip polarity (invert the waveform)
 */
export function flipPolarity(channelData: Float32Array[]): Float32Array[] {
  const result: Float32Array[] = [];
  
  for (const channel of channelData) {
    const flipped = new Float32Array(channel.length);
    for (let i = 0; i < channel.length; i++) {
      flipped[i] = -channel[i];
    }
    result.push(flipped);
  }

  console.log('🔄 Polarity flipped');
  return result;
}

/**
 * Swap stereo channels (left becomes right, right becomes left)
 */
export function swapStereo(channelData: Float32Array[]): Float32Array[] {
  if (channelData.length < 2) {
    console.log('⚠️ Swap Stereo: Audio is mono, no swap needed');
    return channelData;
  }

  console.log('↔️ Stereo channels swapped');
  return [channelData[1], channelData[0]];
}

/**
 * Fade stereo - apply a stereo fade effect
 * Creates a gradual pan from left to right (or vice versa)
 */
export function fadeStereo(channelData: Float32Array[], direction: 'left-to-right' | 'right-to-left' = 'left-to-right'): Float32Array[] {
  if (channelData.length < 2) {
    console.log('⚠️ Fade Stereo: Audio is mono, converting to stereo fade');
    // Create stereo from mono with fade
    const mono = channelData[0];
    const left = new Float32Array(mono.length);
    const right = new Float32Array(mono.length);
    
    for (let i = 0; i < mono.length; i++) {
      const position = i / mono.length;
      const leftGain = direction === 'left-to-right' ? 1 - position : position;
      const rightGain = direction === 'left-to-right' ? position : 1 - position;
      left[i] = mono[i] * leftGain;
      right[i] = mono[i] * rightGain;
    }
    
    return [left, right];
  }

  const left = new Float32Array(channelData[0].length);
  const right = new Float32Array(channelData[1].length);

  for (let i = 0; i < channelData[0].length; i++) {
    const position = i / channelData[0].length;
    const leftGain = direction === 'left-to-right' ? 1 - position * 0.5 : 0.5 + position * 0.5;
    const rightGain = direction === 'left-to-right' ? 0.5 + position * 0.5 : 1 - position * 0.5;
    left[i] = channelData[0][i] * leftGain;
    right[i] = channelData[1][i] * rightGain;
  }

  console.log(`🎚️ Fade Stereo applied (${direction})`);
  return [left, right];
}

/**
 * Create a crossfade loop - smoothly blend the end into the beginning
 * @param crossfadeLength - Length of crossfade in samples (default: 10% of audio)
 */
export function createCrossfadeLoop(channelData: Float32Array[], crossfadeLength?: number): Float32Array[] {
  const result: Float32Array[] = [];
  const fadeLength = crossfadeLength || Math.floor(channelData[0].length * 0.1);

  for (const channel of channelData) {
    const looped = new Float32Array(channel.length);

    // Copy the main body
    for (let i = 0; i < channel.length; i++) {
      looped[i] = channel[i];
    }

    // Apply crossfade at the end
    for (let i = 0; i < fadeLength; i++) {
      const fadeOut = 1 - (i / fadeLength); // Fade out the end
      const fadeIn = i / fadeLength; // Fade in the beginning
      const endIndex = channel.length - fadeLength + i;
      const startIndex = i;

      // Blend end with beginning
      looped[endIndex] = channel[endIndex] * fadeOut + channel[startIndex] * fadeIn;
    }

    result.push(looped);
  }

  console.log(`🔁 Crossfade loop created (${fadeLength} samples)`);
  return result;
}

/**
 * Apply fade in to the audio
 * @param fadeLength - Length of fade in samples
 */
export function fadeIn(channelData: Float32Array[], fadeLength: number): Float32Array[] {
  const result: Float32Array[] = [];

  for (const channel of channelData) {
    const faded = new Float32Array(channel.length);

    for (let i = 0; i < channel.length; i++) {
      if (i < fadeLength) {
        const gain = i / fadeLength;
        faded[i] = channel[i] * gain;
      } else {
        faded[i] = channel[i];
      }
    }

    result.push(faded);
  }

  console.log(`📈 Fade in applied (${fadeLength} samples)`);
  return result;
}

/**
 * Apply fade out to the audio
 * @param fadeLength - Length of fade in samples
 */
export function fadeOut(channelData: Float32Array[], fadeLength: number): Float32Array[] {
  const result: Float32Array[] = [];

  for (const channel of channelData) {
    const faded = new Float32Array(channel.length);
    const startFade = channel.length - fadeLength;

    for (let i = 0; i < channel.length; i++) {
      if (i >= startFade) {
        const gain = 1 - ((i - startFade) / fadeLength);
        faded[i] = channel[i] * gain;
      } else {
        faded[i] = channel[i];
      }
    }

    result.push(faded);
  }

  console.log(`📉 Fade out applied (${fadeLength} samples)`);
  return result;
}

/**
 * Decode an audio URL to AudioBuffer
 */
export async function decodeAudioUrl(url: string): Promise<AudioBuffer> {
  const audioContext = new AudioContext();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  await audioContext.close();
  return audioBuffer;
}

/**
 * Extract channel data from AudioBuffer
 */
export function extractChannelData(audioBuffer: AudioBuffer): Float32Array[] {
  const channels: Float32Array[] = [];
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }
  return channels;
}

/**
 * Create a new AudioBuffer from processed channel data
 */
export function createAudioBuffer(
  channelData: Float32Array[],
  sampleRate: number
): AudioBuffer {
  const audioContext = new AudioContext();
  const buffer = audioContext.createBuffer(
    channelData.length,
    channelData[0].length,
    sampleRate
  );

  for (let i = 0; i < channelData.length; i++) {
    buffer.copyToChannel(channelData[i], i);
  }

  return buffer;
}

/**
 * Convert AudioBuffer to a blob URL for playback
 */
export async function audioBufferToUrl(audioBuffer: AudioBuffer): Promise<string> {
  // Create offline context to render
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();

  const renderedBuffer = await offlineContext.startRendering();

  // Convert to WAV blob
  const wavBlob = audioBufferToWav(renderedBuffer);
  return URL.createObjectURL(wavBlob);
}

/**
 * Convert AudioBuffer to WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Interleave channels and write samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

