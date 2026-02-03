'use client';

import React, { useEffect, useState } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { motion } from 'framer-motion';

const PadGrid: React.FC = () => {
  const { pads, triggerPad, assignSampleToPad, padMode } = useBeatStore();
  const [activePads, setActivePads] = useState<Set<number>>(new Set());
  const [dragOverPad, setDragOverPad] = useState<number | null>(null);

  const handlePadClick = (padIndex: number) => {
    triggerPad(padIndex);
    setActivePads(prev => new Set(prev).add(padIndex));
    setTimeout(() => {
      setActivePads(prev => {
        const next = new Set(prev);
        next.delete(padIndex);
        return next;
      });
    }, 150);
  };

  const handleDragOver = (e: React.DragEvent, padIndex: number) => {
    e.preventDefault();
    setDragOverPad(padIndex);
  };

  const handleDragLeave = () => {
    setDragOverPad(null);
  };

  const handleDrop = (e: React.DragEvent, padIndex: number) => {
    e.preventDefault();
    setDragOverPad(null);

    const sampleData = e.dataTransfer.getData('application/json');
    if (sampleData) {
      try {
        const sample = JSON.parse(sampleData);
        assignSampleToPad(padIndex, sample);
      } catch (error) {
        console.error('Failed to parse sample data:', error);
      }
    }
  };

  // Keyboard mapping (Q-P for top row, A-; for second row, etc.)
  useEffect(() => {
    const keyMap: { [key: string]: number } = {
      'q': 0, 'w': 1, 'e': 2, 'r': 3,
      'a': 4, 's': 5, 'd': 6, 'f': 7,
      'z': 8, 'x': 9, 'c': 10, 'v': 11,
      't': 12, 'g': 13, 'b': 14, 'y': 15,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const padIndex = keyMap[e.key.toLowerCase()];
      if (padIndex !== undefined && !activePads.has(padIndex)) {
        handlePadClick(padIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePads]);

  const getPadColor = (padIndex: number) => {
    const pad = pads[padIndex];
    // Lighter gray pads on dark background
    if (!pad.sample) return 'bg-gradient-to-br from-gray-500 to-gray-600';

    // Subtle color tint when sample is loaded
    const categoryColors: { [key: string]: string } = {
      kick: 'bg-gradient-to-br from-red-600 to-red-700',
      snare: 'bg-gradient-to-br from-blue-600 to-blue-700',
      hihat: 'bg-gradient-to-br from-yellow-600 to-yellow-700',
      perc: 'bg-gradient-to-br from-green-600 to-green-700',
      bass: 'bg-gradient-to-br from-purple-600 to-purple-700',
      synth: 'bg-gradient-to-br from-pink-600 to-pink-700',
      fx: 'bg-gradient-to-br from-cyan-600 to-cyan-700',
      melodic: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
    };

    return categoryColors[pad.sample.category] || 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  const getPadActiveColor = (padIndex: number) => {
    const pad = pads[padIndex];
    if (!pad.sample) return 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-inner';

    // Brighter when active
    const categoryColors: { [key: string]: string } = {
      kick: 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50',
      snare: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50',
      hihat: 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/50',
      perc: 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50',
      bass: 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50',
      synth: 'bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg shadow-pink-500/50',
      fx: 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/50',
      melodic: 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/50',
    };

    return categoryColors[pad.sample.category] || 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-inner';
  };

  return (
    <div className="pad-grid">
      <div className="grid grid-cols-4 gap-3 max-w-2xl p-6 bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4)] border-2 border-gray-800/50">
        {pads.map((pad, index) => (
          <motion.button
            key={pad.id}
            onClick={() => handlePadClick(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              aspect-square rounded-lg
              flex flex-col items-center justify-center
              transition-all duration-100
              border-2 border-gray-800/40
              ${dragOverPad === index ? 'border-purple-500 scale-[1.02] shadow-[0_0_20px_rgba(168,85,247,0.5)]' : ''}
              ${activePads.has(index) ? getPadActiveColor(index) : getPadColor(index)}
              ${pad.muted ? 'opacity-40' : ''}
              ${pad.solo ? 'ring-2 ring-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]' : ''}
              hover:scale-[1.02] active:scale-95
              shadow-[0_6px_12px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.3)]
              hover:shadow-[0_8px_16px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-2px_4px_rgba(0,0,0,0.4)]
            `}
            whileTap={{ scale: 0.92 }}
          >
            <div className="text-[10px] text-gray-200 font-bold mb-1 tracking-wide">
              {padMode === 'chromatic' ? pad.note : `PAD ${index + 1}`}
            </div>
            <div className="text-xs font-bold text-center px-2 text-white leading-tight">
              {pad.sample ? (
                <span className="line-clamp-2">{pad.sample.name}</span>
              ) : (
                <span className="text-gray-300">Empty</span>
              )}
            </div>
            {pad.sample && (
              <div className="text-[9px] text-gray-300 mt-1 uppercase font-semibold tracking-wider">
                {padMode === 'chromatic' ? pad.note : pad.sample.category}
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Pad Controls - Hidden for cleaner look, can be shown on demand */}
    </div>
  );
};

const PadControl: React.FC<{ padIndex: number }> = ({ padIndex }) => {
  const { pads, setPadVolume, togglePadMute, togglePadSolo } = useBeatStore();
  const pad = pads[padIndex];

  return (
    <div className="bg-gray-200/50 rounded-lg p-3 space-y-2 border border-gray-300">
      <div className="text-xs font-bold text-gray-700">PAD {padIndex + 1}</div>

      <div>
        <label className="text-xs text-gray-600 font-semibold">Volume</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={pad.volume}
          onChange={(e) => setPadVolume(padIndex, parseFloat(e.target.value))}
          className="w-full accent-gray-600"
        />
      </div>

      <div className="flex gap-1">
        <button
          onClick={() => togglePadMute(padIndex)}
          className={`flex-1 px-2 py-1 text-xs rounded font-bold ${
            pad.muted ? 'bg-red-500 text-white' : 'bg-gray-400 text-gray-800'
          }`}
        >
          M
        </button>
        <button
          onClick={() => togglePadSolo(padIndex)}
          className={`flex-1 px-2 py-1 text-xs rounded font-bold ${
            pad.solo ? 'bg-yellow-500 text-gray-900' : 'bg-gray-400 text-gray-800'
          }`}
        >
          S
        </button>
      </div>
    </div>
  );
};

export default PadGrid;

