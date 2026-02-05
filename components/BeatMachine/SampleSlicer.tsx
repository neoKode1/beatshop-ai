'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { useToast } from '@/components/Toast/Toast';
import {
  Scissors, Grid3X3, Wand2, Play, Square, ChevronDown,
  Zap, RotateCcw, Check, X, Sliders
} from 'lucide-react';
import {
  detectTransients,
  createGridSlices,
  slicePointsToRegions,
  extractSlice,
  applySliceFades,
  SlicePoint,
  SliceRegion,
  SlicerSettings,
} from '@/lib/audio/sampleSlicer';
import {
  decodeAudioUrl,
  extractChannelData,
  createAudioBuffer,
  audioBufferToUrl,
} from '@/lib/audio/audioProcessing';

interface SampleSlicerProps {
  onClose: () => void;
}

const SampleSlicer: React.FC<SampleSlicerProps> = ({ onClose }) => {
  const { pads, selectedPadIndex, assignSampleToPad } = useBeatStore();
  const { showToast } = useToast();
  
  const [slicePoints, setSlicePoints] = useState<SlicePoint[]>([]);
  const [sliceRegions, setSliceRegions] = useState<SliceRegion[]>([]);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [channelData, setChannelData] = useState<Float32Array[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null);
  const [playingSlice, setPlayingSlice] = useState<number | null>(null);
  
  // Settings
  const [mode, setMode] = useState<'transient' | 'grid'>('transient');
  const [sensitivity, setSensitivity] = useState(50);
  const [gridDivision, setGridDivision] = useState(16);
  const [minSliceLength, setMinSliceLength] = useState(50);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const selectedPad = selectedPadIndex !== null ? pads[selectedPadIndex] : null;
  const sampleUrl = selectedPad?.sample?.url;
  const sampleName = selectedPad?.sample?.name || 'Sample';

  // Load audio when component mounts
  useEffect(() => {
    if (!sampleUrl) return;
    
    const loadAudio = async () => {
      setIsProcessing(true);
      try {
        const buffer = await decodeAudioUrl(sampleUrl);
        const data = extractChannelData(buffer);
        setAudioBuffer(buffer);
        setChannelData(data);
        console.log(`🔪 Loaded sample for slicing: ${buffer.duration.toFixed(2)}s, ${buffer.sampleRate}Hz`);
      } catch (error) {
        console.error('Failed to load audio for slicing:', error);
        showToast('Failed to load audio', 'error');
      } finally {
        setIsProcessing(false);
      }
    };
    
    loadAudio();
  }, [sampleUrl, showToast]);

  // Auto-detect slices when audio loads or settings change
  useEffect(() => {
    if (!channelData || !audioBuffer) return;
    
    let points: SlicePoint[];
    
    if (mode === 'transient') {
      points = detectTransients(channelData, audioBuffer.sampleRate, {
        sensitivity,
        minSliceLength,
      });
    } else {
      points = createGridSlices(
        channelData[0].length,
        audioBuffer.sampleRate,
        gridDivision
      );
    }
    
    setSlicePoints(points);
    setSliceRegions(slicePointsToRegions(points, channelData[0].length, audioBuffer.sampleRate));
  }, [channelData, audioBuffer, mode, sensitivity, gridDivision, minSliceLength]);

  // Draw waveform with slice markers
  useEffect(() => {
    if (!canvasRef.current || !channelData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const mono = channelData[0];
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw waveform
    ctx.strokeStyle = '#ff6b00';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    const step = Math.ceil(mono.length / width);
    for (let x = 0; x < width; x++) {
      const start = x * step;
      let min = 1, max = -1;
      for (let i = 0; i < step && start + i < mono.length; i++) {
        const val = mono[start + i];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      const yMin = ((1 - min) / 2) * height;
      const yMax = ((1 - max) / 2) * height;
      ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMax);
    }
    ctx.stroke();
    
    // Draw slice markers
    slicePoints.forEach((point, index) => {
      const x = (point.index / mono.length) * width;
      ctx.strokeStyle = selectedSlice === index ? '#00ff88' : '#ff3366';
      ctx.lineWidth = selectedSlice === index ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Draw slice number
      ctx.fillStyle = selectedSlice === index ? '#00ff88' : '#ff3366';
      ctx.font = '10px monospace';
      ctx.fillText(`${index + 1}`, x + 2, 12);
    });
  }, [channelData, slicePoints, selectedSlice]);

  // Play a slice
  const playSlice = useCallback(async (index: number) => {
    if (!channelData || !audioBuffer || !sliceRegions[index]) return;
    
    const region = sliceRegions[index];
    const sliceData = extractSlice(channelData, region.startIndex, region.endIndex);
    const fadedData = applySliceFades(sliceData);
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    
    const buffer = ctx.createBuffer(fadedData.length, fadedData[0].length, audioBuffer.sampleRate);
    fadedData.forEach((ch, i) => buffer.copyToChannel(ch, i));
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    setPlayingSlice(index);
    source.onended = () => setPlayingSlice(null);
    source.start();
  }, [channelData, audioBuffer, sliceRegions]);

  // Assign slices to pads
  const assignSlicesToPads = useCallback(async () => {
    if (!channelData || !audioBuffer || sliceRegions.length === 0) return;

    setIsProcessing(true);
    const maxSlices = Math.min(sliceRegions.length, 16);

    try {
      for (let i = 0; i < maxSlices; i++) {
        const region = sliceRegions[i];
        const sliceData = extractSlice(channelData, region.startIndex, region.endIndex);
        const fadedData = applySliceFades(sliceData);

        const buffer = createAudioBuffer(fadedData, audioBuffer.sampleRate);
        const url = await audioBufferToUrl(buffer);

        assignSampleToPad(i, {
          name: `${sampleName} [${i + 1}]`,
          url,
          type: 'audio',
          category: 'sliced',
        });
      }

      showToast(`Assigned ${maxSlices} slices to pads`, 'success');
      console.log(`✅ Assigned ${maxSlices} slices to pads`);
      onClose();
    } catch (error) {
      console.error('Failed to assign slices:', error);
      showToast('Failed to assign slices', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [channelData, audioBuffer, sliceRegions, sampleName, assignSampleToPad, showToast, onClose]);

  if (!selectedPad?.sample?.url || selectedPad.sample.type !== 'audio') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-2">
            <Scissors size={18} className="text-orange-500" />
            <h2 className="text-sm font-bold text-white">Sample Slicer</h2>
            <span className="text-xs text-gray-400">- {sampleName}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Waveform Display */}
        <div className="p-4 border-b border-gray-700">
          <canvas
            ref={canvasRef}
            width={800}
            height={120}
            className="w-full h-[120px] rounded bg-gray-950 cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              const clickedIndex = slicePoints.findIndex((p, i) => {
                const nextP = slicePoints[i + 1];
                const pX = p.index / (channelData?.[0]?.length || 1);
                const nextX = nextP ? nextP.index / (channelData?.[0]?.length || 1) : 1;
                return x >= pX && x < nextX;
              });
              setSelectedSlice(clickedIndex >= 0 ? clickedIndex : null);
            }}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{slicePoints.length} slices detected</span>
            <span>{audioBuffer?.duration.toFixed(2)}s</span>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 flex flex-wrap gap-4">
          {/* Mode Selection */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('transient')}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 ${
                mode === 'transient'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Wand2 size={12} /> Auto
            </button>
            <button
              onClick={() => setMode('grid')}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 ${
                mode === 'grid'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Grid3X3 size={12} /> Grid
            </button>
          </div>

          {/* Mode-specific controls */}
          {mode === 'transient' ? (
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400">Sensitivity</label>
              <input
                type="range"
                min="10"
                max="90"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseInt(e.target.value))}
                className="w-24 h-1 bg-gray-700 rounded accent-orange-500"
              />
              <span className="text-xs text-gray-300 w-8">{sensitivity}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Divisions</label>
              <select
                value={gridDivision}
                onChange={(e) => setGridDivision(parseInt(e.target.value))}
                className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
              >
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={16}>16</option>
                <option value={32}>32</option>
              </select>
            </div>
          )}

          {/* Preview selected slice */}
          {selectedSlice !== null && (
            <button
              onClick={() => playSlice(selectedSlice)}
              disabled={playingSlice !== null}
              className="px-3 py-1.5 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5"
            >
              {playingSlice === selectedSlice ? <Square size={12} /> : <Play size={12} />}
              Preview Slice {selectedSlice + 1}
            </button>
          )}
        </div>

        {/* Slice List */}
        <div className="flex-1 overflow-auto p-4 pt-0">
          <div className="grid grid-cols-4 gap-2">
            {sliceRegions.slice(0, 16).map((region, index) => (
              <button
                key={region.id}
                onClick={() => {
                  setSelectedSlice(index);
                  playSlice(index);
                }}
                className={`p-2 rounded text-left transition-all ${
                  selectedSlice === index
                    ? 'bg-orange-500/30 border-orange-500'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                } border`}
              >
                <div className="text-xs font-bold text-white">Pad {index + 1}</div>
                <div className="text-[10px] text-gray-400">{region.duration.toFixed(3)}s</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={assignSlicesToPads}
            disabled={isProcessing || sliceRegions.length === 0}
            className="px-4 py-2 rounded text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <Zap size={14} />
                Slice to Pads ({Math.min(sliceRegions.length, 16)})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SampleSlicer;

