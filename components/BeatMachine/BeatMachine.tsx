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
import StepSequencer from './StepSequencer';
import WaveformEditor from './WaveformEditor';
import { Grid3x3, Piano, List, Music } from 'lucide-react';

const BeatMachine: React.FC = () => {
  const [viewMode, setViewMode] = React.useState<'instrument' | 'timeline' | 'arrangement'>('instrument');
  const [instrumentMode, setInstrumentMode] = React.useState<'pads' | 'piano'>('pads');
  const { bpm, setBpm } = useBeatStore();

  return (
    <div className="beat-machine h-full flex flex-col">
      {/* Recording Engine */}
      <RecordingEngine />

      {/* Compact Tab Navigation */}
      <div className="flex gap-1 mb-4 bg-gray-800/30 p-1 rounded-lg border border-gray-700/30 w-fit">
        <button
          onClick={() => { setViewMode('instrument'); setInstrumentMode('pads'); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            viewMode === 'instrument' && instrumentMode === 'pads'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <Grid3x3 size={14} />
          <span>Drums</span>
        </button>
        <button
          onClick={() => { setViewMode('instrument'); setInstrumentMode('piano'); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            viewMode === 'instrument' && instrumentMode === 'piano'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <Piano size={14} />
          <span>Piano</span>
        </button>
        <button
          onClick={() => setViewMode('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            viewMode === 'timeline'
              ? 'bg-green-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <List size={14} />
          <span>Timeline</span>
        </button>
        <button
          onClick={() => setViewMode('arrangement')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            viewMode === 'arrangement'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <Music size={14} />
          <span>Arrangement</span>
        </button>
      </div>

      {/* Hardware-Style Enclosure */}
      {viewMode === 'instrument' && instrumentMode === 'pads' ? (
        <div className="flex-1 flex justify-center items-start overflow-auto pb-6">
          {/* Main Hardware Unit */}
          <div
            className="relative"
            style={{
              background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.8),
                0 0 0 1px rgba(60, 60, 60, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.05),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3)
              `,
              minWidth: '900px',
            }}
          >
            {/* Top Panel with Branding */}
            <div className="flex justify-between items-start mb-6 px-2">
              {/* Left - Brand Name */}
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{
                    color: '#e0e0e0',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    letterSpacing: '0.5px',
                  }}
                >
                  Beat Shop AI
                </h1>
                <p
                  className="text-[10px] uppercase tracking-[3px] mt-0.5"
                  style={{ color: '#666' }}
                >
                  Professional
                </p>
              </div>

              {/* Right - Model Info */}
              <div className="text-right">
                <p
                  className="text-lg font-semibold tracking-wide"
                  style={{
                    color: '#888',
                    fontFamily: 'monospace',
                  }}
                >
                  MPC-16
                </p>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex gap-6">
              {/* Left Section - Knobs/Controls & Pads */}
              <div className="flex gap-6">
                {/* Master Controls */}
                <div
                  className="w-64 flex-shrink-0"
                  style={{
                    background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                    height: 'fit-content',
                  }}
                >
                  <MasterControls />
                </div>

                {/* Pad Grid */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                    height: 'fit-content',
                  }}
                >
                  <PadGrid />
                </div>
              </div>

              {/* Center Section - Waveform Editor */}
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                    height: '100%',
                    minHeight: '500px',
                  }}
                >
                  <WaveformEditor />
                </div>
              </div>
            </div>

            {/* Step Sequencer Below Everything */}
            <div
              className="mt-4"
              style={{
                background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              <StepSequencer />
            </div>

            {/* Bottom Panel - Decorative elements */}
            <div className="flex items-center justify-between mt-4 px-2">
              {/* LED Indicator */}
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #ff4444, #aa0000)',
                    boxShadow: '0 0 8px rgba(255, 0, 0, 0.5)',
                  }}
                />
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Power</span>
              </div>

              {/* USB/Connection indicator */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-3 rounded-sm bg-gray-800 border border-gray-700" />
                <span className="text-[10px] uppercase tracking-wider text-gray-600">USB</span>
              </div>
            </div>

            {/* Rubber Feet Shadows */}
            <div
              className="absolute -bottom-2 left-8 w-6 h-2 rounded-full"
              style={{ background: 'rgba(0,0,0,0.4)', filter: 'blur(2px)' }}
            />
            <div
              className="absolute -bottom-2 right-8 w-6 h-2 rounded-full"
              style={{ background: 'rgba(0,0,0,0.4)', filter: 'blur(2px)' }}
            />
          </div>
        </div>
      ) : viewMode === 'instrument' && instrumentMode === 'piano' ? (
        /* Piano Mode - Also with hardware styling */
        <div className="flex-1 flex justify-center items-start overflow-auto pb-6">
          <div
            className="relative"
            style={{
              background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.8),
                0 0 0 1px rgba(60, 60, 60, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.05),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3)
              `,
              minWidth: '800px',
            }}
          >
            {/* Top Panel with Branding */}
            <div className="flex justify-between items-start mb-6 px-2">
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{
                    color: '#e0e0e0',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  Beat Shop AI
                </h1>
                <p className="text-[10px] uppercase tracking-[3px] mt-0.5 text-gray-600">
                  Professional
                </p>
              </div>
              <p className="text-lg font-semibold tracking-wide text-gray-500 font-mono">
                KEYS-24
              </p>
            </div>

            {/* Piano Keyboard */}
            <div
              style={{
                background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              <PianoKeyboard />
            </div>
          </div>
        </div>
      ) : (
        /* Timeline/Arrangement Views - Standard layout */
        <div className="flex-1 overflow-auto">
          {viewMode === 'timeline' && <TimelineView />}
          {viewMode === 'arrangement' && <ArrangementView />}
        </div>
      )}
    </div>
  );
};

export default BeatMachine;

