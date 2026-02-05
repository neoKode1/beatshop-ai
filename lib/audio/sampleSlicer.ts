/**
 * Sample Slicer - Transient detection and auto-chop functionality
 * MPC/FL Studio style sample slicing for drum breaks and loops
 */

export interface SlicePoint {
  index: number;        // Sample index where slice starts
  time: number;         // Time in seconds
  strength: number;     // Transient strength (0-1)
  label?: string;       // Optional label (e.g., "Kick", "Snare")
}

export interface SliceRegion {
  id: string;
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  padIndex?: number;    // Which pad this slice is assigned to
}

export interface SlicerSettings {
  sensitivity: number;    // 0-100, higher = more slices detected
  minSliceLength: number; // Minimum slice length in ms
  mode: 'transient' | 'grid' | 'manual';
  gridDivision?: number;  // For grid mode: 4, 8, 16, 32
}

const DEFAULT_SETTINGS: SlicerSettings = {
  sensitivity: 50,
  minSliceLength: 50,
  mode: 'transient',
  gridDivision: 16,
};

/**
 * Detect transients in audio using onset detection
 * Uses a combination of spectral flux and amplitude envelope
 */
export function detectTransients(
  channelData: Float32Array[],
  sampleRate: number,
  settings: Partial<SlicerSettings> = {}
): SlicePoint[] {
  const { sensitivity, minSliceLength } = { ...DEFAULT_SETTINGS, ...settings };
  
  // Mix down to mono for analysis
  const mono = mixToMono(channelData);
  
  // Parameters based on sensitivity
  const windowSize = 1024;
  const hopSize = 256;
  const threshold = 1.0 - (sensitivity / 100) * 0.8; // Higher sensitivity = lower threshold
  const minSamples = Math.floor((minSliceLength / 1000) * sampleRate);
  
  // Calculate onset detection function using spectral flux
  const onsetFunction = calculateOnsetFunction(mono, windowSize, hopSize);
  
  // Peak picking to find transients
  const peaks = pickPeaks(onsetFunction, threshold, hopSize);
  
  // Filter peaks by minimum distance
  const filteredPeaks = filterByMinDistance(peaks, minSamples);
  
  // Convert to SlicePoints
  const slicePoints: SlicePoint[] = filteredPeaks.map((peak, index) => ({
    index: peak.sampleIndex,
    time: peak.sampleIndex / sampleRate,
    strength: peak.strength,
    label: `Slice ${index + 1}`,
  }));
  
  // Always include start point if not already there
  if (slicePoints.length === 0 || slicePoints[0].index > minSamples) {
    slicePoints.unshift({
      index: 0,
      time: 0,
      strength: 1,
      label: 'Start',
    });
  }
  
  console.log(`🔪 Detected ${slicePoints.length} transients (sensitivity: ${sensitivity}%)`);
  return slicePoints;
}

/**
 * Mix multi-channel audio to mono
 */
function mixToMono(channelData: Float32Array[]): Float32Array {
  if (channelData.length === 1) return channelData[0];
  
  const length = channelData[0].length;
  const mono = new Float32Array(length);
  const numChannels = channelData.length;
  
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      sum += channelData[ch][i];
    }
    mono[i] = sum / numChannels;
  }
  
  return mono;
}

/**
 * Calculate onset detection function using energy-based approach
 */
function calculateOnsetFunction(
  samples: Float32Array,
  windowSize: number,
  hopSize: number
): number[] {
  const numFrames = Math.floor((samples.length - windowSize) / hopSize);
  const onsetFunction: number[] = [];
  
  let prevEnergy = 0;
  
  for (let frame = 0; frame < numFrames; frame++) {
    const start = frame * hopSize;
    
    // Calculate frame energy (RMS)
    let energy = 0;
    for (let i = 0; i < windowSize; i++) {
      energy += samples[start + i] * samples[start + i];
    }
    energy = Math.sqrt(energy / windowSize);
    
    // Onset function is the positive difference in energy
    const onset = Math.max(0, energy - prevEnergy);
    onsetFunction.push(onset);
    
    prevEnergy = energy;
  }
  
  // Normalize onset function
  const maxOnset = Math.max(...onsetFunction);
  if (maxOnset > 0) {
    for (let i = 0; i < onsetFunction.length; i++) {
      onsetFunction[i] /= maxOnset;
    }
  }
  
  return onsetFunction;
}

/**
 * Pick peaks from onset function
 */
function pickPeaks(
  onsetFunction: number[],
  threshold: number,
  hopSize: number
): { sampleIndex: number; strength: number }[] {
  const peaks: { sampleIndex: number; strength: number }[] = [];

  for (let i = 1; i < onsetFunction.length - 1; i++) {
    const current = onsetFunction[i];
    const prev = onsetFunction[i - 1];
    const next = onsetFunction[i + 1];

    // Is this a local maximum above threshold?
    if (current > prev && current > next && current > threshold) {
      peaks.push({
        sampleIndex: i * hopSize,
        strength: current,
      });
    }
  }

  return peaks;
}

/**
 * Filter peaks by minimum distance
 */
function filterByMinDistance(
  peaks: { sampleIndex: number; strength: number }[],
  minDistance: number
): { sampleIndex: number; strength: number }[] {
  if (peaks.length === 0) return [];

  const filtered: { sampleIndex: number; strength: number }[] = [peaks[0]];

  for (let i = 1; i < peaks.length; i++) {
    const lastPeak = filtered[filtered.length - 1];
    if (peaks[i].sampleIndex - lastPeak.sampleIndex >= minDistance) {
      filtered.push(peaks[i]);
    } else if (peaks[i].strength > lastPeak.strength) {
      // Replace with stronger peak if too close
      filtered[filtered.length - 1] = peaks[i];
    }
  }

  return filtered;
}

/**
 * Create grid-based slice points (equal divisions)
 */
export function createGridSlices(
  totalSamples: number,
  sampleRate: number,
  divisions: number,
  bpm?: number
): SlicePoint[] {
  const slicePoints: SlicePoint[] = [];

  // If BPM provided, calculate beat-aligned slices
  if (bpm) {
    const samplesPerBeat = (60 / bpm) * sampleRate;
    const samplesPerSlice = samplesPerBeat / (divisions / 4); // divisions per bar

    let index = 0;
    let sliceNum = 0;
    while (index < totalSamples) {
      slicePoints.push({
        index: Math.floor(index),
        time: index / sampleRate,
        strength: 1,
        label: `Beat ${sliceNum + 1}`,
      });
      index += samplesPerSlice;
      sliceNum++;
    }
  } else {
    // Equal divisions of the sample
    const samplesPerSlice = totalSamples / divisions;

    for (let i = 0; i < divisions; i++) {
      const index = Math.floor(i * samplesPerSlice);
      slicePoints.push({
        index,
        time: index / sampleRate,
        strength: 1,
        label: `Slice ${i + 1}`,
      });
    }
  }

  console.log(`📐 Created ${slicePoints.length} grid slices (${divisions} divisions)`);
  return slicePoints;
}

/**
 * Convert slice points to slice regions
 */
export function slicePointsToRegions(
  slicePoints: SlicePoint[],
  totalSamples: number,
  sampleRate: number
): SliceRegion[] {
  const regions: SliceRegion[] = [];

  for (let i = 0; i < slicePoints.length; i++) {
    const start = slicePoints[i];
    const endIndex = i < slicePoints.length - 1
      ? slicePoints[i + 1].index
      : totalSamples;

    regions.push({
      id: `slice_${i}_${Date.now()}`,
      startIndex: start.index,
      endIndex,
      startTime: start.time,
      endTime: endIndex / sampleRate,
      duration: (endIndex - start.index) / sampleRate,
      padIndex: i < 16 ? i : undefined, // Auto-assign to first 16 pads
    });
  }

  return regions;
}

/**
 * Extract a slice from audio data
 */
export function extractSlice(
  channelData: Float32Array[],
  startIndex: number,
  endIndex: number
): Float32Array[] {
  const sliceLength = endIndex - startIndex;
  const result: Float32Array[] = [];

  for (const channel of channelData) {
    const slice = new Float32Array(sliceLength);
    for (let i = 0; i < sliceLength; i++) {
      slice[i] = channel[startIndex + i] || 0;
    }
    result.push(slice);
  }

  return result;
}

/**
 * Extract all slices and return as separate audio regions
 */
export function extractAllSlices(
  channelData: Float32Array[],
  regions: SliceRegion[]
): { region: SliceRegion; data: Float32Array[] }[] {
  return regions.map(region => ({
    region,
    data: extractSlice(channelData, region.startIndex, region.endIndex),
  }));
}

/**
 * Apply fade to slice edges to prevent clicks
 */
export function applySliceFades(
  channelData: Float32Array[],
  fadeInSamples: number = 64,
  fadeOutSamples: number = 64
): Float32Array[] {
  const result: Float32Array[] = [];

  for (const channel of channelData) {
    const faded = new Float32Array(channel.length);

    for (let i = 0; i < channel.length; i++) {
      let gain = 1;

      // Fade in
      if (i < fadeInSamples) {
        gain = i / fadeInSamples;
      }
      // Fade out
      else if (i >= channel.length - fadeOutSamples) {
        gain = (channel.length - i) / fadeOutSamples;
      }

      faded[i] = channel[i] * gain;
    }

    result.push(faded);
  }

  return result;
}

