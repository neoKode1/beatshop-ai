'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBeatStore } from '@/store/useBeatStore';

interface KnobProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: number;
}

// Compact mini knob for tight layouts
const Knob: React.FC<KnobProps> = ({ label, value, onChange, min = 0, max = 1, size = 32 }) => {
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
      const sensitivity = range / 100;
      const newValue = Math.max(min, Math.min(max, startValueRef.current + deltaY * sensitivity));
      onChange(newValue);
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, onChange]);

  const percentage = (value - min) / (max - min);
  const rotation = -135 + percentage * 270;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative cursor-pointer select-none"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
        title={`${label}: ${Math.round(percentage * 100)}%`}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border border-gray-700" />
        <div
          className="absolute w-0.5 rounded-full bg-white"
          style={{
            height: size * 0.3,
            top: '3px',
            left: '50%',
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
          }}
        />
      </div>
      <span className="text-[9px] text-gray-500 uppercase tracking-wide">{label}</span>
    </div>
  );
};

const MasterControls: React.FC = () => {
  const { masterEffects } = useBeatStore();
  const {
    setMasterVolume,
    setCompressorThreshold,
    setCompressorRatio,
    setEqLow,
    setEqMid,
    setEqHigh,
    setMasterReverb,
    setMasterDelay,
    setDistortion,
    setStereoWidth,
    setLimiterThreshold,
    setChorus,
    setPhaser,
    setFlanger,
    setBitcrusher,
  } = useBeatStore();

  return (
    <div className="master-controls">
      {/* Compact Master Controls - All in one scrollable view */}
      <div className="space-y-2">
        {/* Volume - Main control */}
        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-gray-700/50">
          <span className="text-[9px] font-bold text-gray-400 uppercase">Master</span>
          <Knob label="Vol" value={masterEffects.volume} onChange={setMasterVolume} size={32} />
        </div>

        {/* EQ Row */}
        <div>
          <span className="text-[8px] font-bold text-gray-500 uppercase block mb-1">EQ</span>
          <div className="flex justify-between gap-0.5">
            <Knob label="Lo" value={masterEffects.eqLow} onChange={setEqLow} min={-24} max={24} size={24} />
            <Knob label="Md" value={masterEffects.eqMid} onChange={setEqMid} min={-24} max={24} size={24} />
            <Knob label="Hi" value={masterEffects.eqHigh} onChange={setEqHigh} min={-24} max={24} size={24} />
          </div>
        </div>

        {/* Dynamics Row */}
        <div>
          <span className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Dyn</span>
          <div className="flex justify-between gap-0.5">
            <Knob label="Cmp" value={masterEffects.compressorThreshold} onChange={setCompressorThreshold} min={-100} max={0} size={24} />
            <Knob label="Rat" value={masterEffects.compressorRatio} onChange={setCompressorRatio} min={1} max={20} size={24} />
            <Knob label="Lim" value={masterEffects.limiterThreshold} onChange={setLimiterThreshold} min={-24} max={0} size={24} />
          </div>
        </div>

        {/* Space/Time FX Row */}
        <div>
          <span className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Space</span>
          <div className="flex justify-between gap-0.5">
            <Knob label="Rev" value={masterEffects.reverb} onChange={setMasterReverb} size={24} />
            <Knob label="Dly" value={masterEffects.delay} onChange={setMasterDelay} size={24} />
            <Knob label="Wid" value={masterEffects.stereoWidth} onChange={setStereoWidth} size={24} />
          </div>
        </div>

        {/* Modulation Row */}
        <div>
          <span className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Mod</span>
          <div className="flex justify-between gap-0.5">
            <Knob label="Chr" value={masterEffects.chorus} onChange={setChorus} size={24} />
            <Knob label="Phs" value={masterEffects.phaser} onChange={setPhaser} size={24} />
            <Knob label="Flg" value={masterEffects.flanger} onChange={setFlanger} size={24} />
          </div>
        </div>

        {/* Distortion/Lo-Fi Row */}
        <div>
          <span className="text-[8px] font-bold text-gray-500 uppercase block mb-1">LoFi</span>
          <div className="flex justify-between gap-0.5">
            <Knob label="Dst" value={masterEffects.distortion} onChange={setDistortion} size={24} />
            <Knob label="Bit" value={masterEffects.bitcrusher} onChange={setBitcrusher} size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterControls;

