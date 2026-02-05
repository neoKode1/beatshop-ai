'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getMasterEffects } from '@/lib/audio/effects';

interface ChannelState {
  level: number;
  peak: number;
  peakHold: number;
  peakDecay: number;
}

const VolumeMeter: React.FC = () => {
  const [leftChannel, setLeftChannel] = useState<ChannelState>({ level: 0, peak: 0, peakHold: 0, peakDecay: 0 });
  const [rightChannel, setRightChannel] = useState<ChannelState>({ level: 0, peak: 0, peakHold: 0, peakDecay: 0 });
  const animationRef = useRef<number | null>(null);
  const leftStateRef = useRef<ChannelState>({ level: 0, peak: 0, peakHold: 0, peakDecay: 0 });
  const rightStateRef = useRef<ChannelState>({ level: 0, peak: 0, peakHold: 0, peakDecay: 0 });

  useEffect(() => {
    const masterEffects = getMasterEffects();

    const updateChannel = (currentLevel: number, stateRef: React.MutableRefObject<ChannelState>): ChannelState => {
      const state = stateRef.current;
      let newPeak = state.peak;
      let newPeakHold = state.peakHold;
      let newPeakDecay = state.peakDecay;

      if (currentLevel > state.peak) {
        newPeak = currentLevel;
        newPeakHold = 30;
        newPeakDecay = currentLevel;
      } else {
        if (state.peakHold > 0) {
          newPeakHold = state.peakHold - 1;
        } else {
          newPeakDecay = Math.max(0, state.peakDecay - 0.02);
          newPeak = newPeakDecay;
        }
      }

      const newState = { level: currentLevel, peak: newPeak, peakHold: newPeakHold, peakDecay: newPeakDecay };
      stateRef.current = newState;
      return newState;
    };

    const updateMeter = () => {
      const levels = masterEffects.getMeterLevel();

      setLeftChannel(updateChannel(levels.left, leftStateRef));
      setRightChannel(updateChannel(levels.right, rightStateRef));

      animationRef.current = requestAnimationFrame(updateMeter);
    };

    animationRef.current = requestAnimationFrame(updateMeter);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const getBarColor = (position: number) => {
    if (position < 0.6) return 'bg-green-500';
    if (position < 0.85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGlowColor = (position: number) => {
    if (position < 0.6) return '#22c55e';
    if (position < 0.85) return '#eab308';
    return '#ef4444';
  };

  const segments = 32;

  const renderMeterBar = (channel: ChannelState, label: string) => {
    const activeSegments = Math.floor(channel.level * segments);
    const peakSegment = Math.floor(channel.peak * segments);

    return (
      <div className="flex items-center gap-2 flex-1">
        <span className="text-[9px] font-bold text-gray-500 w-3">{label}</span>
        <div className="flex-1 flex gap-[2px] bg-black/50 rounded-sm p-[3px]">
          {Array.from({ length: segments }).map((_, i) => {
            const isActive = i < activeSegments;
            const isPeak = i === peakSegment && channel.peak > 0;
            const position = i / segments;

            return (
              <div
                key={i}
                className={`
                  flex-1 h-[8px] rounded-[1px] transition-opacity duration-50
                  ${isActive ? getBarColor(position) : 'bg-gray-800'}
                  ${isPeak ? 'opacity-100' : isActive ? 'opacity-95' : 'opacity-40'}
                `}
                style={{
                  boxShadow: isActive ? `0 0 6px ${getGlowColor(position)}60` : 'none',
                  minWidth: '3px',
                }}
              />
            );
          })}
        </div>
        <span className="text-[9px] font-mono text-gray-500 w-7 text-right">
          {channel.level > 0 ? `${Math.round((channel.level * 60) - 60)}` : '-∞'}
        </span>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-1 px-4">
      {renderMeterBar(leftChannel, 'L')}
      {renderMeterBar(rightChannel, 'R')}
    </div>
  );
};

export default VolumeMeter;

