'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import WaveSurfer from 'wavesurfer.js';
import {
  X, Play, RotateCcw, Volume2, Sliders, Wand2,
  ArrowLeftRight, Waves, Loader, Scissors, Music, Trash2
} from 'lucide-react';
import SampleSlicer from './SampleSlicer';
import {
  normalizeAudio,
  removeDCOffset,
  reverseAudio,
  flipPolarity,
  swapStereo,
  fadeStereo,
  decodeAudioUrl,
  extractChannelData,
  createAudioBuffer,
  audioBufferToUrl,
} from '@/lib/audio/audioProcessing';
import { useToast } from '@/components/Toast/Toast';

// FL Studio color scheme
const FL_COLORS = {
  bg: '#1a1a1a',
  bgDark: '#0d0d0d',
  bgPanel: '#252525',
  border: '#3a3a3a',
  text: '#b0b0b0',
  textBright: '#e0e0e0',
  accent: '#ff6b00',
  accentDim: '#ff6b0040',
  green: '#00c853',
  blue: '#2196f3',
  knobBg: '#2a2a2a',
  knobFg: '#4a4a4a',
};

// Rotary Knob Component
const RotaryKnob: React.FC<{
  value: number;
  min: number;
  max: number;
  label: string;
  unit?: string;
  onChange: (value: number) => void;
  size?: number;
  color?: string;
}> = ({ value, min, max, label, unit = '', onChange, size = 48, color = FL_COLORS.accent }) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const normalizedValue = (value - min) / (max - min);
  const rotation = -135 + normalizedValue * 270;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = (startY.current - e.clientY) / 100;
      const range = max - min;
      const newValue = Math.max(min, Math.min(max, startValue.current + delta * range));
      onChange(newValue);
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, onChange]);

  const displayValue = unit === '%' ? Math.round(normalizedValue * 100) : 
                       unit === 's' ? value.toFixed(2) :
                       unit === 'Hz' ? Math.round(value) :
                       unit === 'st' ? (value > 0 ? `+${value}` : value) :
                       value.toFixed(1);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={knobRef}
        className="relative cursor-pointer select-none"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
      >
        {/* Knob Track */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 225deg, ${color}40 0deg, ${color}40 ${normalizedValue * 270}deg, #333 ${normalizedValue * 270}deg, #333 270deg)`,
            border: '2px solid #1a1a1a',
          }}
        />
        {/* Knob Body */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 4,
            background: `radial-gradient(circle at 35% 35%, #4a4a4a, #2a2a2a)`,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {/* Indicator */}
          <div
            className="absolute w-0.5 bg-white rounded-full"
            style={{
              height: '35%',
              left: '50%',
              top: '12%',
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              transformOrigin: 'center 125%',
              boxShadow: `0 0 4px ${color}`,
            }}
          />
        </div>
      </div>
      <span className="text-[9px] uppercase tracking-wider text-gray-500 font-medium">{label}</span>
      <span className="text-[10px] text-gray-400 font-mono">{displayValue}{unit}</span>
    </div>
  );
};

// Toggle Button Component
const ToggleButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}> = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 rounded text-[9px] font-semibold uppercase tracking-wide flex items-center gap-1 transition-all ${
      active
        ? 'bg-orange-500/30 text-orange-400 border border-orange-500/50'
        : 'bg-gray-700/40 text-gray-500 border border-gray-600/30 hover:bg-gray-700/60'
    }`}
  >
    {icon}
    {label}
  </button>
);

// Section Header Component
const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-700/50">
    {icon && <span className="text-gray-500">{icon}</span>}
    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{title}</span>
  </div>
);

// Main FLSampler Component
const FLSampler: React.FC = () => {
  const { pads, selectedPadIndex, setSelectedPadIndex, triggerPad, setPadEffects, assignSampleToPad, clearPadSample, padMode, setPadMode } = useBeatStore();
  const { showToast } = useToast();
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [waveformError, setWaveformError] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'effects'>('tools');
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // Track which effect is processing
  const [showSlicer, setShowSlicer] = useState(false);

  const selectedPad = selectedPadIndex !== null ? pads[selectedPadIndex] : null;

  // Get effects from the selected pad
  const effects = selectedPad?.effects || {
    attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3,
    filterFreq: 5000, filterQ: 1, pitch: 0, reverse: false,
    normalized: false, dcRemoved: false, polarityFlipped: false,
    stereoSwapped: false, stereoFaded: false,
  };

  // Update effect handlers
  const updateEffect = useCallback((key: keyof typeof effects, value: number | boolean) => {
    if (selectedPadIndex !== null) {
      setPadEffects(selectedPadIndex, { [key]: value });
    }
  }, [selectedPadIndex, setPadEffects]);

  // Apply audio processing effect
  const applyAudioEffect = useCallback(async (
    effectName: string,
    processFn: (channelData: Float32Array[]) => Float32Array[],
    effectKey: string
  ) => {
    if (!selectedPad?.sample?.url || selectedPad.sample.type !== 'audio' || selectedPadIndex === null) {
      console.log(`⚠️ ${effectName}: No audio sample loaded`);
      showToast(`No audio sample loaded`, 'warning');
      return;
    }

    setIsProcessing(effectName);
    console.log(`🎛️ Applying ${effectName}...`);

    try {
      // Decode the audio
      const audioBuffer = await decodeAudioUrl(selectedPad.sample.url);
      const channelData = extractChannelData(audioBuffer);

      // Apply the processing function
      const processedData = processFn(channelData);

      // Create new buffer and URL
      const newBuffer = createAudioBuffer(processedData, audioBuffer.sampleRate);
      const newUrl = await audioBufferToUrl(newBuffer);

      // Update the pad with the new sample
      assignSampleToPad(selectedPadIndex, {
        ...selectedPad.sample,
        url: newUrl,
        name: `${selectedPad.sample.name} (${effectName})`,
      });

      // Mark effect as applied
      setPadEffects(selectedPadIndex, { [effectKey]: true });

      console.log(`✅ ${effectName} applied successfully`);
      showToast(`${effectName} applied successfully`, 'success');
    } catch (error) {
      console.error(`❌ ${effectName} failed:`, error);
      showToast(`${effectName} failed`, 'error');
    } finally {
      setIsProcessing(null);
    }
  }, [selectedPad, selectedPadIndex, assignSampleToPad, setPadEffects, showToast]);

  // Effect handlers
  const handleNormalize = () => applyAudioEffect('Normalize', normalizeAudio, 'normalized');
  const handleRemoveDC = () => applyAudioEffect('Remove DC', removeDCOffset, 'dcRemoved');
  const handleReverse = () => applyAudioEffect('Reverse', reverseAudio, 'reverse');
  const handleFlipPolarity = () => applyAudioEffect('Flip Polarity', flipPolarity, 'polarityFlipped');
  const handleSwapStereo = () => applyAudioEffect('Swap Stereo', swapStereo, 'stereoSwapped');
  const handleFadeStereo = () => applyAudioEffect('Fade Stereo', (data) => fadeStereo(data, 'left-to-right'), 'stereoFaded');

  // Initialize WaveSurfer
  useEffect(() => {
    if (!selectedPad?.sample?.url || selectedPad.sample.type !== 'audio' || !waveformRef.current) return;

    let isCleanedUp = false;
    setWaveformError(false);

    if (wavesurferRef.current) {
      try { wavesurferRef.current.destroy(); } catch {}
      wavesurferRef.current = null;
    }

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#ff6b00',
      progressColor: '#ff8533',
      cursorColor: '#ffffff',
      barWidth: 1,
      barRadius: 0,
      cursorWidth: 1,
      height: 120,
      barGap: 0,
      normalize: true,
    });

    wavesurfer.load(selectedPad.sample.url).catch((error) => {
      if (!isCleanedUp && error.name !== 'AbortError') setWaveformError(true);
    });

    wavesurferRef.current = wavesurfer;

    return () => {
      isCleanedUp = true;
      if (wavesurferRef.current) {
        try { wavesurferRef.current.destroy(); } catch {}
        wavesurferRef.current = null;
      }
    };
  }, [selectedPad?.sample?.url, selectedPad?.sample?.type]);

  if (selectedPadIndex === null || !selectedPad) return null;

  const handleClose = () => setSelectedPadIndex(null);
  const handlePreview = () => { if (selectedPadIndex !== null) triggerPad(selectedPadIndex); };
  const handleReset = () => {
    if (selectedPadIndex !== null) {
      setPadEffects(selectedPadIndex, {
        attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3,
        filterFreq: 5000, filterQ: 1, pitch: 0, reverse: false,
      });
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: FL_COLORS.bgDark }}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50" style={{ background: FL_COLORS.bgPanel }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-3 py-1.5 text-[10px] font-semibold rounded-l transition-all ${
                activeTab === 'tools' ? 'bg-orange-500 text-white' : 'bg-gray-700/50 text-gray-400 hover:text-white'
              }`}
            >
              ⚙ SMP
            </button>
            <button
              onClick={() => setActiveTab('effects')}
              className={`px-3 py-1.5 text-[10px] font-semibold rounded-r transition-all ${
                activeTab === 'effects' ? 'bg-orange-500 text-white' : 'bg-gray-700/50 text-gray-400 hover:text-white'
              }`}
            >
              ♪ INS
            </button>
          </div>
          {/* Chromatic Mode Toggle - MPC style */}
          <button
            onClick={() => setPadMode(padMode === 'chromatic' ? 'drum' : 'chromatic')}
            className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded transition-all flex items-center gap-1.5 ${
              padMode === 'chromatic'
                ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-gray-700/50 text-gray-500 border border-gray-600/30 hover:bg-gray-700 hover:text-gray-300'
            }`}
            title={padMode === 'chromatic'
              ? 'CHROMATIC: All 16 pads play one sample at different pitches (C2-D#3)'
              : 'DRUM: Each pad plays its own sample (one-shot mode)'}
          >
            <Music size={11} />
            {padMode === 'chromatic' ? 'CHROM' : 'DRUM'}
          </button>
          <span className="text-xs text-gray-300 font-medium">
            Pad {selectedPadIndex + 1} • {selectedPad.sample?.name || 'Empty'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handlePreview} className="p-1.5 bg-green-600/30 hover:bg-green-600/50 rounded text-green-400 border border-green-600/50" title="Preview sample">
            <Play size={12} />
          </button>
          <button onClick={handleReset} className="p-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded text-gray-400" title="Reset effects">
            <RotateCcw size={12} />
          </button>
          <button
            onClick={() => {
              if (selectedPadIndex !== null) {
                clearPadSample(selectedPadIndex);
                setSelectedPadIndex(null);
              }
            }}
            className="p-1.5 bg-gray-700/50 hover:bg-red-600/50 rounded text-gray-400 hover:text-red-400"
            title="Remove sample from pad"
          >
            <Trash2 size={12} />
          </button>
          <button onClick={handleClose} className="p-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded text-gray-400" title="Close panel">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Waveform Display */}
      <div className="px-3 py-2">
        <div
          className="rounded border overflow-hidden"
          style={{ background: '#0a0a0a', borderColor: FL_COLORS.border }}
        >
          {selectedPad.sample?.type === 'audio' ? (
            waveformError ? (
              <div className="h-[120px] flex items-center justify-center text-gray-500 text-xs">
                ⚠️ Waveform unavailable
              </div>
            ) : (
              <div ref={waveformRef} />
            )
          ) : (
            <div className="h-[120px] flex items-center justify-center text-gray-500 text-xs">
              <Waves className="mr-2" size={16} />
              Synth - No waveform
            </div>
          )}
        </div>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <Loader size={16} className="animate-spin text-orange-500" />
            <span className="text-sm text-gray-300">{isProcessing}...</span>
          </div>
        </div>
      )}

      {/* Controls Area */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {activeTab === 'tools' ? (
          <div className="space-y-4">
            {/* Precomputed Effects */}
            <div className="p-3 rounded" style={{ background: FL_COLORS.bgPanel }}>
              <SectionHeader title="Precomputed Effects" icon={<Wand2 size={12} />} />
              <div className="grid grid-cols-3 gap-2">
                <ToggleButton
                  active={!!effects.dcRemoved}
                  onClick={handleRemoveDC}
                  label="Remove DC"
                />
                <ToggleButton
                  active={!!effects.normalized}
                  onClick={handleNormalize}
                  label="Normalize"
                />
                <ToggleButton
                  active={!!effects.reverse}
                  onClick={handleReverse}
                  label="Reverse"
                />
                <ToggleButton
                  active={!!effects.polarityFlipped}
                  onClick={handleFlipPolarity}
                  label="Rev Polarity"
                />
                <ToggleButton
                  active={!!effects.stereoFaded}
                  onClick={handleFadeStereo}
                  label="Fade Stereo"
                />
                <ToggleButton
                  active={!!effects.stereoSwapped}
                  onClick={handleSwapStereo}
                  label="Swap Stereo"
                />
              </div>
              {/* Slice Button */}
              {selectedPad?.sample?.type === 'audio' && (
                <button
                  onClick={() => setShowSlicer(true)}
                  className="mt-3 w-full py-2 rounded text-xs font-medium bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 border border-orange-500/50 flex items-center justify-center gap-2 transition-all"
                >
                  <Scissors size={14} />
                  Slice Sample
                </button>
              )}
            </div>

            {/* Time Stretching */}
            <div className="p-3 rounded" style={{ background: FL_COLORS.bgPanel }}>
              <SectionHeader title="Time Stretching" icon={<ArrowLeftRight size={12} />} />
              <div className="flex justify-around">
                <RotaryKnob value={effects.pitch} min={-24} max={24} label="Pitch" unit="st" onChange={(v) => updateEffect('pitch', Math.round(v))} size={44} />
                <RotaryKnob value={1} min={0.5} max={2} label="Mul" onChange={() => {}} size={44} />
                <RotaryKnob value={1} min={0.5} max={2} label="Time" onChange={() => {}} size={44} />
              </div>
            </div>

            {/* Playback */}
            <div className="p-3 rounded" style={{ background: FL_COLORS.bgPanel }}>
              <SectionHeader title="Playback" icon={<Play size={12} />} />
              <div className="flex gap-2 mb-3">
                <ToggleButton active={false} onClick={() => {}} label="Use Loop Points" />
                <ToggleButton active={false} onClick={() => {}} label="Ping Pong" />
              </div>
              <div className="flex justify-around">
                <RotaryKnob value={0} min={0} max={1} label="Start" unit="%" onChange={() => {}} size={44} />
                <RotaryKnob value={1} min={0} max={1} label="Length" unit="%" onChange={() => {}} size={44} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ADSR */}
            <div className="p-3 rounded" style={{ background: FL_COLORS.bgPanel }}>
              <SectionHeader title="Envelope (ADSR)" icon={<Volume2 size={12} />} />
              <div className="flex justify-around">
                <RotaryKnob value={effects.attack} min={0.001} max={2} label="Attack" unit="s" onChange={(v) => updateEffect('attack', v)} size={44} />
                <RotaryKnob value={effects.decay} min={0.001} max={2} label="Decay" unit="s" onChange={(v) => updateEffect('decay', v)} size={44} />
                <RotaryKnob value={effects.sustain} min={0} max={1} label="Sustain" unit="%" onChange={(v) => updateEffect('sustain', v)} size={44} />
                <RotaryKnob value={effects.release} min={0.001} max={5} label="Release" unit="s" onChange={(v) => updateEffect('release', v)} size={44} />
              </div>
            </div>

            {/* Filter */}
            <div className="p-3 rounded" style={{ background: FL_COLORS.bgPanel }}>
              <SectionHeader title="Filter" icon={<Sliders size={12} />} />
              <div className="flex justify-around">
                <RotaryKnob value={effects.filterFreq} min={20} max={20000} label="Cutoff" unit="Hz" onChange={(v) => updateEffect('filterFreq', v)} size={44} color="#2196f3" />
                <RotaryKnob value={effects.filterQ} min={0.1} max={20} label="Resonance" onChange={(v) => updateEffect('filterQ', v)} size={44} color="#2196f3" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sample Slicer Modal */}
      {showSlicer && <SampleSlicer onClose={() => setShowSlicer(false)} />}
    </div>
  );
};

export default FLSampler;
export { RotaryKnob, ToggleButton, FL_COLORS };

