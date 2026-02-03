'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import WaveSurfer from 'wavesurfer.js';
import * as Tone from 'tone';
import { X, Play, RotateCcw, Volume2, Sliders, ChevronDown } from 'lucide-react';

const WaveformEditor: React.FC = () => {
  const { pads, selectedPadIndex, setSelectedPadIndex, triggerPad, setPadEffects } = useBeatStore();
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Dropdown states
  const [isADSROpen, setIsADSROpen] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isPitchOpen, setIsPitchOpen] = useState(true);

  const selectedPad = selectedPadIndex !== null ? pads[selectedPadIndex] : null;

  // Get effects from the selected pad
  const effects = selectedPad?.effects || {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.5,
    release: 0.3,
    filterFreq: 5000,
    filterQ: 1,
    pitch: 0,
    reverse: false,
  };

  // Update effect handlers
  const updateEffect = (key: keyof typeof effects, value: number | boolean) => {
    if (selectedPadIndex !== null) {
      setPadEffects(selectedPadIndex, { [key]: value });
    }
  };

  // Initialize WaveSurfer when a pad is selected
  useEffect(() => {
    if (!selectedPad || !selectedPad.sample || !waveformRef.current) {
      return;
    }

    // Only show waveform for audio samples
    if (selectedPad.sample.type !== 'audio' || !selectedPad.sample.url) {
      return;
    }

    // Destroy existing instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    // Create new WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4F46E5',
      progressColor: '#818CF8',
      cursorColor: '#C7D2FE',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 120,
      barGap: 1,
    });

    wavesurfer.load(selectedPad.sample.url);

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [selectedPad?.sample?.url]);

  if (selectedPadIndex === null || !selectedPad || !selectedPad.sample) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900/30 rounded-lg border border-gray-700/30">
        <div className="text-center text-gray-500">
          <Sliders size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Click on a pad to edit its sample</p>
        </div>
      </div>
    );
  }

  const handleClose = () => {
    setSelectedPadIndex(null);
  };

  const handlePreview = () => {
    if (selectedPadIndex !== null) {
      triggerPad(selectedPadIndex);
    }
  };

  const handleReset = () => {
    if (selectedPadIndex !== null) {
      setPadEffects(selectedPadIndex, {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.3,
        filterFreq: 5000,
        filterQ: 1,
        pitch: 0,
        reverse: false,
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900/50 rounded-lg border border-gray-700/30 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700/30">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Sample Editor</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Pad {selectedPadIndex + 1} • {selectedPad.sample.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 rounded-md text-blue-400 transition-colors"
            title="Preview"
          >
            <Play size={16} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-md text-gray-400 transition-colors"
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleClose}
            className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-md text-gray-400 transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Waveform Display */}
      {selectedPad.sample.type === 'audio' && (
        <div className="mb-4 bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
          <div ref={waveformRef} className="w-full" />
        </div>
      )}

      {/* Synth Type Info */}
      {selectedPad.sample.type === 'synth' && (
        <div className="mb-4 bg-gray-800/50 rounded-lg p-3 border border-gray-700/30 text-center">
          <p className="text-xs text-gray-400">
            Synthesizer: <span className="text-gray-200 font-semibold">{selectedPad.sample.synthType}</span>
          </p>
        </div>
      )}

      {/* Editing Controls - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {/* ADSR Envelope */}
        <div className="bg-gray-800/30 rounded-lg border border-gray-700/20">
          <button
            onClick={() => setIsADSROpen(!isADSROpen)}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Volume2 size={14} />
              ADSR Envelope
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isADSROpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isADSROpen && (
            <div className="px-3 pb-3 space-y-3">
            <div>
              <label className="text-xs text-gray-500 flex justify-between">
                <span>Attack</span>
                <span className="text-gray-400">{effects.attack.toFixed(3)}s</span>
              </label>
              <input
                type="range"
                min="0.001"
                max="2"
                step="0.001"
                value={effects.attack}
                onChange={(e) => updateEffect('attack', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 flex justify-between">
                <span>Decay</span>
                <span className="text-gray-400">{effects.decay.toFixed(3)}s</span>
              </label>
              <input
                type="range"
                min="0.001"
                max="2"
                step="0.001"
                value={effects.decay}
                onChange={(e) => updateEffect('decay', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 flex justify-between">
                <span>Sustain</span>
                <span className="text-gray-400">{(effects.sustain * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effects.sustain}
                onChange={(e) => updateEffect('sustain', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 flex justify-between">
                <span>Release</span>
                <span className="text-gray-400">{effects.release.toFixed(3)}s</span>
              </label>
              <input
                type="range"
                min="0.001"
                max="5"
                step="0.001"
                value={effects.release}
                onChange={(e) => updateEffect('release', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
          )}
        </div>

        {/* Filter */}
        <div className="bg-gray-800/30 rounded-lg border border-gray-700/20">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders size={14} />
              Filter
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isFilterOpen && (
            <div className="px-3 pb-3 space-y-3">
            <div>
              <label className="text-xs text-gray-500 flex justify-between">
                <span>Cutoff Frequency</span>
                <span className="text-gray-400">{effects.filterFreq.toFixed(0)} Hz</span>
              </label>
              <input
                type="range"
                min="20"
                max="20000"
                step="10"
                value={effects.filterFreq}
                onChange={(e) => updateEffect('filterFreq', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 flex justify-between">
                <span>Resonance (Q)</span>
                <span className="text-gray-400">{effects.filterQ.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={effects.filterQ}
                onChange={(e) => updateEffect('filterQ', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
          )}
        </div>

        {/* Pitch & Effects */}
        <div className="bg-gray-800/30 rounded-lg border border-gray-700/20">
          <button
            onClick={() => setIsPitchOpen(!isPitchOpen)}
            className="w-full p-3 flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders size={14} />
              Pitch & Effects
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isPitchOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isPitchOpen && (
            <div className="px-3 pb-3 space-y-3">
            <div>
              <label className="text-xs text-gray-500 flex justify-between">
                <span>Pitch</span>
                <span className="text-gray-400">{effects.pitch > 0 ? '+' : ''}{effects.pitch} semitones</span>
              </label>
              <input
                type="range"
                min="-24"
                max="24"
                step="1"
                value={effects.pitch}
                onChange={(e) => updateEffect('pitch', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500">Reverse</label>
              <button
                onClick={() => updateEffect('reverse', !effects.reverse)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  effects.reverse
                    ? 'bg-purple-600/30 border border-purple-600/50 text-purple-400'
                    : 'bg-gray-700/50 border border-gray-600/50 text-gray-400'
                }`}
              >
                {effects.reverse ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-900/10 border border-blue-800/30 rounded-lg p-3">
          <p className="text-xs text-blue-400/70">
            💡 <strong>Tip:</strong> These parameters will be applied to the sample in real-time during playback.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaveformEditor;

