'use client';

import React from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { Play, Volume2, Music } from 'lucide-react';

const StepSequencer: React.FC = () => {
  const {
    pads,
    steps,
    toggleStep,
    currentStep,
    clearPattern,
    setPadVolume,
    togglePadMute,
    togglePadSolo,
    triggerPad,
    bpm
  } = useBeatStore();
  const numSteps = 16;

  // Color palette for each pad row
  const padColors = [
    { bg: 'bg-cyan-500', hover: 'hover:bg-cyan-600', active: 'bg-cyan-400', dim: 'bg-cyan-900/30' },
    { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', active: 'bg-emerald-400', dim: 'bg-emerald-900/30' },
    { bg: 'bg-lime-500', hover: 'hover:bg-lime-600', active: 'bg-lime-400', dim: 'bg-lime-900/30' },
    { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', active: 'bg-yellow-400', dim: 'bg-yellow-900/30' },
    { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', active: 'bg-orange-400', dim: 'bg-orange-900/30' },
    { bg: 'bg-pink-500', hover: 'hover:bg-pink-600', active: 'bg-pink-400', dim: 'bg-pink-900/30' },
    { bg: 'bg-fuchsia-500', hover: 'hover:bg-fuchsia-600', active: 'bg-fuchsia-400', dim: 'bg-fuchsia-900/30' },
    { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', active: 'bg-purple-400', dim: 'bg-purple-900/30' },
    { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', active: 'bg-blue-400', dim: 'bg-blue-900/30' },
    { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600', active: 'bg-indigo-400', dim: 'bg-indigo-900/30' },
    { bg: 'bg-violet-500', hover: 'hover:bg-violet-600', active: 'bg-violet-400', dim: 'bg-violet-900/30' },
    { bg: 'bg-rose-500', hover: 'hover:bg-rose-600', active: 'bg-rose-400', dim: 'bg-rose-900/30' },
    { bg: 'bg-red-500', hover: 'hover:bg-red-600', active: 'bg-red-400', dim: 'bg-red-900/30' },
    { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', active: 'bg-amber-400', dim: 'bg-amber-900/30' },
    { bg: 'bg-teal-500', hover: 'hover:bg-teal-600', active: 'bg-teal-400', dim: 'bg-teal-900/30' },
    { bg: 'bg-sky-500', hover: 'hover:bg-sky-600', active: 'bg-sky-400', dim: 'bg-sky-900/30' },
  ];

  const getStep = (padIndex: number, stepIndex: number) => {
    return steps.find(s => s.padIndex === padIndex && s.stepIndex === stepIndex);
  };

  const getColor = (padIndex: number) => {
    return padColors[padIndex % padColors.length];
  };

  return (
    <div className="step-sequencer bg-[#2A2A2A] rounded-xl p-6 border-2 border-gray-800/50 shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            Use main transport controls (top toolbar) to play/pause
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium text-gray-200">
            Pattern 01 • {bpm} BPM
          </div>
          <button
            onClick={clearPattern}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-lg text-sm font-medium text-red-400 transition-colors"
          >
            Clear Pattern
          </button>
        </div>
      </div>

      {/* Sequencer Grid */}
      <div className="space-y-1">
        {pads.filter(pad => pad.sample).map((pad, padIndex) => {
          const color = getColor(padIndex);
          const hasSolo = pads.some(p => p.solo);

          return (
            <div key={padIndex} className="flex items-center gap-2">
              {/* Play Button */}
              <button
                onClick={() => triggerPad(padIndex)}
                className={`p-2 rounded transition-colors ${color.bg} ${color.hover}`}
              >
                <Play size={14} className="text-white fill-white" />
              </button>

              {/* Pad Name */}
              <div className="w-32 text-sm font-medium text-gray-200 truncate">
                {pad.sample?.name || `Pad ${padIndex + 1}`}
              </div>

              {/* Volume Slider */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={pad.volume}
                onChange={(e) => setPadVolume(padIndex, parseFloat(e.target.value))}
                className="w-16 h-1 accent-gray-500"
              />

              {/* Solo/Mute Buttons */}
              <button
                onClick={() => togglePadSolo(padIndex)}
                className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
                  pad.solo ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                S
              </button>
              <button
                onClick={() => togglePadMute(padIndex)}
                className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
                  pad.muted ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                M
              </button>

              {/* Step Buttons */}
              <div className="flex gap-0.5">
                {Array.from({ length: numSteps }, (_, stepIndex) => {
                  const step = getStep(padIndex, stepIndex);
                  const isActive = step?.active || false;
                  const isCurrentStep = stepIndex === currentStep;
                  const isDimmed = (hasSolo && !pad.solo) || pad.muted;

                  return (
                    <button
                      key={stepIndex}
                      onClick={() => toggleStep(padIndex, stepIndex)}
                      className={`
                        w-12 h-12 rounded transition-all
                        ${isActive
                          ? `${color.bg} ${color.hover} ${isDimmed ? 'opacity-30' : ''}`
                          : `${color.dim} hover:bg-gray-700`
                        }
                        ${isCurrentStep ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}
                        ${stepIndex % 4 === 0 ? 'ml-1' : ''}
                      `}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini Preview (placeholder) */}
      <div className="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-center">
        <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
          <div className="flex gap-0.5">
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className="w-2 h-8 bg-gray-700 rounded-sm"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepSequencer;

