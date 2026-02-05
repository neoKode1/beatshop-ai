'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { X, Dice6, Clock } from 'lucide-react';

interface StepPropertiesPanelProps {
  padIndex: number;
  stepIndex: number;
  position: { x: number; y: number };
  onClose: () => void;
  isTrackStep?: boolean;  // true if this is a track step, false for legacy pad step
  trackId?: string;       // only used when isTrackStep is true
}

export const StepPropertiesPanel: React.FC<StepPropertiesPanelProps> = ({
  padIndex,
  stepIndex,
  position,
  onClose,
  isTrackStep = false,
  trackId,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  
  const {
    steps,
    tracks,
    setStepVelocity,
    setLegacyStepProbability,
    setLegacyStepMicroTiming,
    setStepProbability,
    setStepMicroTiming,
  } = useBeatStore();

  // Get current step data
  const getStepData = () => {
    if (isTrackStep && trackId) {
      const track = tracks.find(t => t.id === trackId);
      if (track?.type === 'drum') {
        return track.steps.find(s => s.stepIndex === stepIndex);
      }
    } else {
      return steps.find(s => s.padIndex === padIndex && s.stepIndex === stepIndex);
    }
    return null;
  };

  const stepData = getStepData();
  const [velocity, setVelocity] = useState((stepData?.velocity ?? 0.8) * 100);
  const [probability, setProbability] = useState(stepData?.probability ?? 100);
  const [microTiming, setMicroTiming] = useState(stepData?.microTiming ?? 0);

  // Close panel on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleVelocityChange = (val: number) => {
    setVelocity(val);
    if (!isTrackStep) {
      setStepVelocity(padIndex, stepIndex, val / 100);
    }
  };

  const handleProbabilityChange = (val: number) => {
    setProbability(val);
    if (isTrackStep && trackId) {
      setStepProbability(trackId, stepIndex, val);
    } else {
      setLegacyStepProbability(padIndex, stepIndex, val);
    }
  };

  const handleMicroTimingChange = (val: number) => {
    setMicroTiming(val);
    if (isTrackStep && trackId) {
      setStepMicroTiming(trackId, stepIndex, val);
    } else {
      setLegacyStepMicroTiming(padIndex, stepIndex, val);
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-[#1a1a1a] border border-gray-600 rounded-lg shadow-xl p-3 w-64"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
        <span className="text-xs font-bold text-gray-300">
          Step {stepIndex + 1} Properties
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X size={14} />
        </button>
      </div>

      {/* Velocity Slider */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span className="flex items-center gap-1">🎚️ Velocity</span>
          <span className="font-mono">{Math.round(velocity)}%</span>
        </div>
        <input
          type="range"
          min="0" max="100" value={velocity}
          onChange={(e) => handleVelocityChange(Number(e.target.value))}
          className="w-full h-1.5 accent-purple-500"
        />
      </div>

      {/* Probability Slider */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span className="flex items-center gap-1"><Dice6 size={10} /> Probability</span>
          <span className="font-mono">{probability}%</span>
        </div>
        <input
          type="range"
          min="0" max="100" value={probability}
          onChange={(e) => handleProbabilityChange(Number(e.target.value))}
          className="w-full h-1.5 accent-orange-500"
        />
        <div className="text-[9px] text-gray-500 mt-0.5">
          {probability < 100 ? `Triggers ~${probability}% of the time` : 'Always triggers'}
        </div>
      </div>

      {/* Microtiming Slider */}
      <div className="mb-1">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span className="flex items-center gap-1"><Clock size={10} /> Microtiming</span>
          <span className="font-mono">{microTiming > 0 ? '+' : ''}{microTiming}ms</span>
        </div>
        <input
          type="range"
          min="-50" max="50" value={microTiming}
          onChange={(e) => handleMicroTimingChange(Number(e.target.value))}
          className="w-full h-1.5 accent-cyan-500"
        />
        <div className="text-[9px] text-gray-500 mt-0.5">
          {microTiming < 0 ? 'Plays early (rush)' : microTiming > 0 ? 'Plays late (drag)' : 'On the grid'}
        </div>
      </div>
    </div>
  );
};

export default StepPropertiesPanel;

