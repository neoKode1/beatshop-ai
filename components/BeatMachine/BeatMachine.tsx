'use client';

import React, { useEffect } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import PadGrid from './PadGrid';
import PianoRoll from './PianoRoll';
import PianoKeyboard from './PianoKeyboard';
import MasterControls from './MasterControls';
import ArrangementView from './ArrangementView';
import TimelineView from './TimelineView';
import RecordingEngine from './RecordingEngine';
import { Grid3x3, Piano, List, Music } from 'lucide-react';

const BeatMachine: React.FC = () => {
  const [viewMode, setViewMode] = React.useState<'instrument' | 'timeline' | 'arrangement'>('instrument');
  const [instrumentMode, setInstrumentMode] = React.useState<'pads' | 'piano'>('pads');
  const { bpm, setBpm } = useBeatStore();

  return (
    <div className="beat-machine h-full flex flex-col">
      {/* Recording Engine */}
      <RecordingEngine />

      {/* View Mode Toggle - 3 simplified modes */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('instrument')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold transition-all ${
            viewMode === 'instrument'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-200'
          }`}
        >
          <Music size={18} />
          <span>Instrument</span>
        </button>
        <button
          onClick={() => setViewMode('timeline')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold transition-all ${
            viewMode === 'timeline'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-200'
          }`}
        >
          <List size={18} />
          <span>Pattern Timeline</span>
        </button>
        <button
          onClick={() => setViewMode('arrangement')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold transition-all ${
            viewMode === 'arrangement'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-200'
          }`}
        >
          <List size={18} />
          <span>Arrangement</span>
        </button>

        {/* Instrument Sub-Mode (only show when in instrument view) */}
        {viewMode === 'instrument' && (
          <div className="ml-auto flex gap-2 border-l-2 border-gray-700 pl-4">
            <button
              onClick={() => setInstrumentMode('pads')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                instrumentMode === 'pads'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
              }`}
            >
              <Grid3x3 size={16} />
              Drums
            </button>
            <button
              onClick={() => setInstrumentMode('piano')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                instrumentMode === 'piano'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
              }`}
            >
              <Piano size={16} />
              Piano
            </button>
          </div>
        )}
      </div>

      {/* Content - 2-Column Layout: Input + Knobs */}
      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Main Content Area */}
        <div className={viewMode === 'timeline' || viewMode === 'arrangement' ? 'flex-1' : 'flex-shrink-0'}>
          {viewMode === 'instrument' && instrumentMode === 'pads' && <PadGrid />}
          {viewMode === 'instrument' && instrumentMode === 'piano' && <PianoKeyboard />}
          {viewMode === 'timeline' && <TimelineView />}
          {viewMode === 'arrangement' && <ArrangementView />}
        </div>

        {/* Right: Master Controls (only for instrument view) */}
        {viewMode === 'instrument' && (
          <div className="w-80">
            <MasterControls />
          </div>
        )}
      </div>
    </div>
  );
};

export default BeatMachine;

