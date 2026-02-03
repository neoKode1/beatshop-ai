'use client';

import React from 'react';
import { useBeatStore } from '@/store/useBeatStore';

const StepSequencer: React.FC = () => {
  const { pads, steps, toggleStep, currentStep, clearPattern } = useBeatStore();
  const numSteps = 16;

  const getStep = (padIndex: number, stepIndex: number) => {
    return steps.find(s => s.padIndex === padIndex && s.stepIndex === stepIndex);
  };

  return (
    <div className="step-sequencer">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">16-Step Sequencer</h3>
        <button
          onClick={clearPattern}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
        >
          Clear Pattern
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Step numbers */}
          <div className="flex mb-2">
            <div className="w-32 flex-shrink-0"></div>
            {Array.from({ length: numSteps }, (_, i) => (
              <div
                key={i}
                className={`w-12 h-8 flex items-center justify-center text-xs font-mono ${
                  i === currentStep ? 'text-purple-400 font-bold' : 'text-gray-500'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Pad rows */}
          {pads.map((pad, padIndex) => (
            <div key={pad.id} className="flex mb-1">
              {/* Pad label */}
              <div className="w-32 flex-shrink-0 flex items-center px-2 bg-gray-800 rounded-l">
                <div className="text-xs">
                  <div className="font-semibold">{pad.sample?.name || `Pad ${padIndex + 1}`}</div>
                  {pad.sample && (
                    <div className="text-gray-500 uppercase text-[10px]">{pad.sample.category}</div>
                  )}
                </div>
              </div>

              {/* Steps */}
              {Array.from({ length: numSteps }, (_, stepIndex) => {
                const step = getStep(padIndex, stepIndex);
                const isActive = step?.active || false;
                const isCurrentStep = stepIndex === currentStep;

                return (
                  <button
                    key={stepIndex}
                    onClick={() => toggleStep(padIndex, stepIndex)}
                    className={`
                      w-12 h-12 border border-gray-700
                      transition-all duration-100
                      ${isActive ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-900 hover:bg-gray-800'}
                      ${isCurrentStep ? 'ring-2 ring-purple-400' : ''}
                      ${stepIndex % 4 === 0 ? 'border-l-2 border-l-gray-600' : ''}
                    `}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepSequencer;

