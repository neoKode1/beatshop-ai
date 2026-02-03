'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBeatStore } from '@/store/useBeatStore';

interface KnobProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const Knob: React.FC<KnobProps> = ({ label, value, onChange, min = 0, max = 1, step = 0.01 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 200; // 200px for full range
      const newValue = Math.max(min, Math.min(max, startValueRef.current + deltaY * sensitivity));
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, onChange]);

  // Calculate rotation angle (-135° to +135° = 270° total range)
  const percentage = (value - min) / (max - min);
  const rotation = -135 + percentage * 270;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Knob */}
      <div
        className="relative w-24 h-24 cursor-pointer select-none"
        onMouseDown={handleMouseDown}
      >
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.5)]" />
        
        {/* Inner knob */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 shadow-[0_2px_6px_rgba(0,0,0,0.4)]" />
        
        {/* Center circle */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]" />
        
        {/* Indicator line */}
        <div
          className="absolute inset-0 flex items-start justify-center pt-2 transition-transform duration-100"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="w-1 h-8 bg-white rounded-full shadow-lg" />
        </div>
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-800 shadow-inner" />
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className="text-sm font-bold text-gray-300 uppercase tracking-wider">{label}</div>
        <div className="text-xs text-gray-500 font-mono mt-1">
          {Math.round(percentage * 100)}%
        </div>
      </div>
    </div>
  );
};

const MasterControls: React.FC = () => {
  const { masterEffects } = useBeatStore();
  const {
    setMasterVolume,
    setCompressorThreshold,
    setCompressorRatio,
    setCompressorAttack,
    setCompressorRelease,
    setEqLow,
    setEqMid,
    setEqHigh,
    setDistortion,
    setMasterReverb,
    setMasterDelay,
    setStereoWidth,
    setLimiterThreshold,
  } = useBeatStore();

  const [activeSection, setActiveSection] = React.useState<'dynamics' | 'eq' | 'effects'>('dynamics');

  return (
    <div className="master-controls h-full flex flex-col">
      <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4)] border-2 border-gray-800/50 h-full flex flex-col">
        {/* Header */}
        <h3 className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b-2 border-gray-800/50">
          Master Controls
        </h3>

        {/* Section Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-900/50 rounded-lg p-1">
          <button
            onClick={() => setActiveSection('dynamics')}
            className={`flex-1 px-2 py-1 rounded text-xs font-bold transition-all ${
              activeSection === 'dynamics'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            DYNAMICS
          </button>
          <button
            onClick={() => setActiveSection('eq')}
            className={`flex-1 px-2 py-1 rounded text-xs font-bold transition-all ${
              activeSection === 'eq'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            EQ
          </button>
          <button
            onClick={() => setActiveSection('effects')}
            className={`flex-1 px-2 py-1 rounded text-xs font-bold transition-all ${
              activeSection === 'effects'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            FX
          </button>
        </div>

        {/* Knobs - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6">
            {activeSection === 'dynamics' && (
              <>
                <Knob
                  label="Volume"
                  value={masterEffects.volume}
                  onChange={setMasterVolume}
                  min={0}
                  max={1}
                />

                <div className="border-t-2 border-gray-800/50 pt-4">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-3 text-center">Compressor</div>
                  <div className="space-y-4">
                    <Knob
                      label="Threshold"
                      value={masterEffects.compressorThreshold}
                      onChange={setCompressorThreshold}
                      min={-100}
                      max={0}
                    />
                    <Knob
                      label="Ratio"
                      value={masterEffects.compressorRatio}
                      onChange={setCompressorRatio}
                      min={1}
                      max={20}
                    />
                    <Knob
                      label="Attack"
                      value={masterEffects.compressorAttack}
                      onChange={setCompressorAttack}
                      min={0}
                      max={1}
                    />
                    <Knob
                      label="Release"
                      value={masterEffects.compressorRelease}
                      onChange={setCompressorRelease}
                      min={0}
                      max={1}
                    />
                  </div>
                </div>

                <div className="border-t-2 border-gray-800/50 pt-4">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-3 text-center">Limiter</div>
                  <Knob
                    label="Threshold"
                    value={masterEffects.limiterThreshold}
                    onChange={setLimiterThreshold}
                    min={-24}
                    max={0}
                  />
                </div>
              </>
            )}

            {activeSection === 'eq' && (
              <>
                <Knob
                  label="Low"
                  value={masterEffects.eqLow}
                  onChange={setEqLow}
                  min={-24}
                  max={24}
                />
                <Knob
                  label="Mid"
                  value={masterEffects.eqMid}
                  onChange={setEqMid}
                  min={-24}
                  max={24}
                />
                <Knob
                  label="High"
                  value={masterEffects.eqHigh}
                  onChange={setEqHigh}
                  min={-24}
                  max={24}
                />
              </>
            )}

            {activeSection === 'effects' && (
              <>
                <Knob
                  label="Distortion"
                  value={masterEffects.distortion}
                  onChange={setDistortion}
                  min={0}
                  max={1}
                />
                <Knob
                  label="Reverb"
                  value={masterEffects.reverb}
                  onChange={setMasterReverb}
                  min={0}
                  max={1}
                />
                <Knob
                  label="Delay"
                  value={masterEffects.delay}
                  onChange={setMasterDelay}
                  min={0}
                  max={1}
                />
                <Knob
                  label="Stereo Width"
                  value={masterEffects.stereoWidth}
                  onChange={setStereoWidth}
                  min={0}
                  max={1}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterControls;

