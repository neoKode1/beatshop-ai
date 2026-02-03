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
    bpm,
    numSteps
  } = useBeatStore();

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
    <div className="step-sequencer bg-[#2A2A2A] rounded-lg p-4 border border-gray-800/50 shadow-xl">
      {/* Top Toolbar - Simplified */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700/30">
        <div className="text-xs text-gray-500 font-semibold">
          Step Sequencer
        </div>

        <button
          onClick={clearPattern}
          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-md text-xs font-semibold text-red-400 transition-colors"
        >
          Clear Pattern
        </button>
      </div>

      {/* Sequencer Grid - Scrollable Container */}
      <div className="overflow-x-auto pb-2">
        <div className="space-y-1 min-w-fit">
          {pads.filter(pad => pad.sample).map((pad, padIndex) => {
            const color = getColor(padIndex);
            const hasSolo = pads.some(p => p.solo);

            return (
              <div key={padIndex} className="flex items-center gap-2">
                {/* Play Button */}
                <button
                  onClick={() => triggerPad(padIndex)}
                  className={`p-2 rounded transition-colors flex-shrink-0 ${color.bg} ${color.hover}`}
                >
                  <Play size={14} className="text-white fill-white" />
                </button>

                {/* Pad Name */}
                <div className="w-28 text-sm font-medium text-gray-200 truncate flex-shrink-0">
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
                  className="w-14 h-1 accent-gray-500 flex-shrink-0"
                />

                {/* Solo/Mute Buttons */}
                <button
                  onClick={() => togglePadSolo(padIndex)}
                  className={`w-6 h-6 rounded text-xs font-bold transition-colors flex-shrink-0 ${
                    pad.solo ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  S
                </button>
                <button
                  onClick={() => togglePadMute(padIndex)}
                  className={`w-6 h-6 rounded text-xs font-bold transition-colors flex-shrink-0 ${
                    pad.muted ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  M
                </button>

                {/* Step Buttons - Responsive sizing */}
                <div className="flex gap-0.5 flex-shrink-0">
                  {Array.from({ length: numSteps }, (_, stepIndex) => {
                    const step = getStep(padIndex, stepIndex);
                    const isActive = step?.active || false;
                    const isCurrentStep = stepIndex === currentStep;
                    const isDimmed = (hasSolo && !pad.solo) || pad.muted;

                    // Calculate step size based on numSteps to fit better
                    const stepSize = numSteps <= 16 ? 'w-10 h-10' :
                                     numSteps <= 32 ? 'w-7 h-7' :
                                     numSteps <= 48 ? 'w-5 h-5' : 'w-4 h-4';

                    return (
                      <button
                        key={stepIndex}
                        onClick={() => toggleStep(padIndex, stepIndex)}
                        className={`
                          ${stepSize} rounded-md transition-all flex-shrink-0
                          ${isActive
                            ? `${color.bg} ${color.hover} ${isDimmed ? 'opacity-30' : ''}`
                            : `${color.dim} hover:bg-gray-700`
                          }
                          ${isCurrentStep ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900' : ''}
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
      </div>

      {/* Mini Preview - Also scrollable */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="overflow-x-auto">
          <div className="flex gap-0.5 justify-center min-w-fit px-4">
            {Array.from({ length: numSteps }, (_, i) => {
              const miniSize = numSteps <= 16 ? 'w-3' :
                               numSteps <= 32 ? 'w-2' : 'w-1.5';
              return (
                <div
                  key={i}
                  className={`${miniSize} h-6 bg-gray-700 rounded-sm flex-shrink-0 ${i % 4 === 0 ? 'ml-0.5' : ''}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepSequencer;

