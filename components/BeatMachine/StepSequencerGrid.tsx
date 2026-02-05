'use client';

import React, { useState, useCallback } from 'react';
import { useBeatStore, Pad, Step } from '@/store/useBeatStore';
import { StepPropertiesPanel } from './StepPropertiesPanel';
import GroovePanel from './GroovePanel';
import { Volume2, VolumeX } from 'lucide-react';

// Color palette for pads (matches PadGrid)
const PAD_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#fb923c', '#facc15', '#4ade80',
  '#2dd4bf', '#60a5fa', '#a78bfa', '#f472b6',
];

interface StepButtonProps {
  padIndex: number;
  stepIndex: number;
  step: Step | undefined;
  isCurrentStep: boolean;
  isBeat: boolean;
  color: string;
  onToggle: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}

const StepButton: React.FC<StepButtonProps> = ({
  step, isCurrentStep, isBeat, color, onToggle, onRightClick
}) => {
  const isActive = step?.active ?? false;
  const velocity = step?.velocity ?? 0.8;
  const probability = step?.probability ?? 100;

  return (
    <button
      onClick={onToggle}
      onContextMenu={onRightClick}
      className={`
        w-6 h-6 rounded-sm transition-all border
        ${isCurrentStep ? 'ring-2 ring-white ring-opacity-80' : ''}
        ${isBeat ? 'border-gray-500' : 'border-gray-700'}
        hover:brightness-125
      `}
      style={{
        backgroundColor: isActive ? color : '#1a1a1a',
        opacity: isActive ? velocity : (isBeat ? 0.4 : 0.25),
        boxShadow: isActive ? `0 0 8px ${color}40` : 'none',
      }}
      title={isActive 
        ? `Velocity: ${Math.round(velocity * 100)}%\nProbability: ${probability}%\nRight-click for properties`
        : 'Click to add step'
      }
    />
  );
};

interface PadRowProps {
  pad: Pad;
  padIndex: number;
  steps: Step[];
  numSteps: number;
  currentStep: number;
  isPlaying: boolean;
  onStepRightClick: (padIndex: number, stepIndex: number, e: React.MouseEvent) => void;
}

const PadRow: React.FC<PadRowProps> = ({
  pad, padIndex, steps, numSteps, currentStep, isPlaying, onStepRightClick
}) => {
  const { toggleStep, setPadMuted, setPadSolo } = useBeatStore();
  const color = PAD_COLORS[padIndex % PAD_COLORS.length];
  
  // Get steps for this pad
  const padSteps = new Map<number, Step>();
  steps.filter(s => s.padIndex === padIndex).forEach(s => {
    padSteps.set(s.stepIndex, s);
  });

  return (
    <div className="flex items-center gap-2 py-0.5">
      {/* Pad Info */}
      <div 
        className="w-16 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono truncate"
        style={{ backgroundColor: `${color}40` }}
      >
        <span className="font-bold" style={{ color }}>{padIndex + 1}</span>
        <span className="text-gray-400 truncate">
          {pad.sample?.name?.slice(0, 6) || 'Empty'}
        </span>
      </div>

      {/* Mute/Solo buttons */}
      <button
        onClick={() => setPadMuted(padIndex, !pad.muted)}
        className={`w-4 h-4 flex items-center justify-center rounded text-[8px] ${
          pad.muted ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
        }`}
        title="Mute"
      >
        M
      </button>
      <button
        onClick={() => setPadSolo(padIndex, !pad.solo)}
        className={`w-4 h-4 flex items-center justify-center rounded text-[8px] ${
          pad.solo ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
        }`}
        title="Solo"
      >
        S
      </button>

      {/* Step buttons */}
      <div className="flex gap-0.5">
        {Array.from({ length: numSteps }, (_, stepIndex) => (
          <StepButton
            key={stepIndex}
            padIndex={padIndex}
            stepIndex={stepIndex}
            step={padSteps.get(stepIndex)}
            isCurrentStep={isPlaying && currentStep === stepIndex}
            isBeat={stepIndex % 4 === 0}
            color={color}
            onToggle={() => toggleStep(padIndex, stepIndex)}
            onRightClick={(e) => onStepRightClick(padIndex, stepIndex, e)}
          />
        ))}
      </div>
    </div>
  );
};

const StepSequencerGrid: React.FC = () => {
  const { pads, steps, numSteps, currentStep, isPlaying } = useBeatStore();
  const [stepPropsPanel, setStepPropsPanel] = useState<{
    padIndex: number;
    stepIndex: number;
    position: { x: number; y: number };
  } | null>(null);

  const handleStepRightClick = useCallback((padIndex: number, stepIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    setStepPropsPanel({
      padIndex,
      stepIndex,
      position: { x: e.clientX, y: e.clientY }
    });
    console.log(`🎹 Step Properties opened: Pad ${padIndex + 1}, Step ${stepIndex + 1}`);
  }, []);

  const padsWithSamples = pads.filter(p => p.sample);

  return (
    <div className="step-sequencer-grid bg-[#1a1a1a] rounded-lg p-3 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700">
        <span className="text-xs font-bold text-gray-300">Step Sequencer</span>
        <div className="flex items-center gap-3">
          <GroovePanel compact />
          <span className="text-[10px] text-gray-500">{numSteps} steps • Right-click for step properties</span>
        </div>
      </div>

      {/* Grid - only show pads with samples */}
      {padsWithSamples.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          <VolumeX size={24} className="mx-auto mb-2 opacity-50" />
          <p>No samples loaded</p>
          <p className="text-xs text-gray-600 mt-1">Drag samples to pads to start sequencing</p>
        </div>
      ) : (
        <div className="space-y-0.5 overflow-x-auto">
          {padsWithSamples.map((pad) => {
            const originalIndex = pads.findIndex(p => p.id === pad.id);
            return (
              <PadRow
                key={pad.id}
                pad={pad}
                padIndex={originalIndex}
                steps={steps}
                numSteps={numSteps}
                currentStep={currentStep}
                isPlaying={isPlaying}
                onStepRightClick={handleStepRightClick}
              />
            );
          })}
        </div>
      )}

      {/* Step Properties Panel */}
      {stepPropsPanel && (
        <StepPropertiesPanel
          padIndex={stepPropsPanel.padIndex}
          stepIndex={stepPropsPanel.stepIndex}
          position={stepPropsPanel.position}
          onClose={() => setStepPropsPanel(null)}
          isTrackStep={false}
        />
      )}
    </div>
  );
};

export default StepSequencerGrid;

