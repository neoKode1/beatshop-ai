'use client';

import React, { useState, useEffect } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import PadGrid from './PadGrid';
import PianoRoll from './PianoRoll';
import PianoKeyboard from './PianoKeyboard';
import MasterControls from './MasterControls';
import ArrangementView from './ArrangementView';
import RecordingEngine from './RecordingEngine';
import ChannelMixer from './ChannelMixer';
import FLSampler from './FLSampler';
import MPCLeftPanel from './MPCLeftPanel';
import MPCRightPanel from './MPCRightPanel';
import MPCStudioSkin from './MPCStudioSkin';
import StepSequencerGrid from './StepSequencerGrid';
import VolumeMeter from '../VolumeMeter/VolumeMeter';
import AudioExport from '../AudioExport/AudioExport';
import KeyboardShortcutsPanel from './KeyboardShortcutsPanel';
import { Sliders, Piano, Music, Disc, ListMusic, Download, HelpCircle } from 'lucide-react';

// Layout modes for the workspace
type LayoutMode = 'drumpad' | 'keys' | 'sequencer' | 'song' | 'mixer';

const BeatMachine: React.FC = () => {
  // Layout mode controls which view is displayed
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('drumpad');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);
  const { selectedPadIndex, pads } = useBeatStore();

  // Get the selected pad to check if it has a sample
  const selectedPad = selectedPadIndex !== null ? pads[selectedPadIndex] : null;
  const hasSample = selectedPad?.sample !== null;

  // Keyboard shortcut to open shortcuts panel (? or F1)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // ? key (Shift + /) or F1 to open shortcuts panel
      if ((e.shiftKey && e.key === '?') || e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsPanel(true);
        console.log('⌨️ Keyboard Shortcuts panel opened');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="beat-machine h-full flex flex-col overflow-hidden">
      {/* Recording Engine */}
      <RecordingEngine />

      {/* Export Modal */}
      {showExportModal && (
        <AudioExport
          onClose={() => setShowExportModal(false)}
          defaultMode={layoutMode === 'song' ? 'arrangement' : 'pattern'}
        />
      )}

      {/* Keyboard Shortcuts Panel */}
      {showShortcutsPanel && (
        <KeyboardShortcutsPanel onClose={() => setShowShortcutsPanel(false)} />
      )}

      {/* Layout Tab Navigation - FL Studio Style */}
      <div className="flex gap-1 mb-4 bg-gray-800/30 p-1 rounded-lg border border-gray-700/30 w-fit">
        {/* Drum Pad */}
        <button
          onClick={() => setLayoutMode('drumpad')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            layoutMode === 'drumpad'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <Disc size={14} />
          <span>Drum Pad</span>
        </button>

        {/* Keys */}
        <button
          onClick={() => setLayoutMode('keys')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            layoutMode === 'keys'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <Piano size={14} />
          <span>Keys</span>
        </button>

        {/* Sequencer */}
        <button
          onClick={() => setLayoutMode('sequencer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            layoutMode === 'sequencer'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <ListMusic size={14} />
          <span>Sequencer</span>
        </button>

        {/* Song Mode */}
        <button
          onClick={() => setLayoutMode('song')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            layoutMode === 'song'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <Music size={14} />
          <span>Song Mode</span>
        </button>

        {/* Mixer */}
        <button
          onClick={() => setLayoutMode('mixer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            layoutMode === 'mixer'
              ? 'bg-green-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <Sliders size={14} />
          <span>Mixer</span>
        </button>

        {/* Separator */}
        <div className="w-px bg-gray-600 mx-1" />

        {/* Export Button */}
        <button
          onClick={() => {
            setShowExportModal(true);
            console.log('📤 Opening export dialog', { currentMode: layoutMode });
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all text-gray-400 hover:text-green-400 hover:bg-green-600/20"
          title="Export Audio (Ctrl+Shift+E)"
        >
          <Download size={14} />
          <span>Export</span>
        </button>

        {/* Help Button - Keyboard Shortcuts */}
        <button
          onClick={() => {
            setShowShortcutsPanel(true);
            console.log('⌨️ Keyboard Shortcuts panel opened via button');
          }}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm font-semibold transition-all text-gray-400 hover:text-purple-400 hover:bg-purple-600/20"
          title="Keyboard Shortcuts (? or F1)"
        >
          <HelpCircle size={14} />
        </button>
      </div>

      {/* Layout Content Based on Mode */}
      {layoutMode === 'song' ? (
        /* Song Mode - Arrangement View */
        <div className="flex-1 overflow-auto">
          <ArrangementView />
        </div>
      ) : layoutMode === 'mixer' ? (
        /* Mixer Mode - Channel Mixer View */
        <div className="flex-1 overflow-auto pb-2">
          <ChannelMixer />
        </div>
      ) : layoutMode === 'sequencer' ? (
        /* Sequencer Mode - Step Sequencer Grid with Piano Roll */
        <div className="flex-1 flex flex-col overflow-hidden pb-2 gap-4">
          {/* Step Sequencer Grid */}
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              borderRadius: '12px',
              overflow: 'auto',
              boxShadow: '0 8px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
              border: '1px solid #333',
            }}
          >
            <StepSequencerGrid />
          </div>

          {/* Piano Roll below for melodic editing */}
          <div
            className="flex-1 min-h-0"
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
              border: '1px solid #333',
            }}
          >
            <PianoRoll />
          </div>
        </div>
      ) : (
        /* Drum Pad or Keys Mode - Hardware-Style Enclosure */
        <div className="flex-1 flex flex-col overflow-hidden pb-2">
          {/* Main Hardware Unit - MPC Studio Skin */}
          <MPCStudioSkin>
            {/* Header Bar */}
            <div className="flex items-center justify-between mb-2">
              {/* Left side - Brand */}
              <div className="flex items-center gap-3">
                <h1
                  className="text-lg font-black tracking-wider text-gray-100"
                  style={{
                    fontFamily: '"Orbitron", "Share Tech Mono", "Rajdhani", monospace',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                  }}
                >
                  BEATSHOP
                </h1>
              </div>

              {/* Center - Volume Meter */}
              <div
                className="flex items-center py-1 px-3 rounded flex-1 mx-4"
                style={{
                  background: 'linear-gradient(180deg, #0a0a0a 0%, #121212 100%)',
                  border: '1px solid rgba(50,50,50,0.4)',
                }}
              >
                <span className="text-[7px] font-bold uppercase text-gray-600 mr-2">OUT</span>
                <VolumeMeter />
              </div>

              {/* Right side - Model name */}
              <div className="text-right">
                <div className="text-xs font-mono text-gray-500 tracking-wide">
                  {layoutMode === 'drumpad' ? 'STUDIO' : 'KEYS'}
                </div>
              </div>
            </div>

            {/* Main Content Area - MPC Style Layout - Flush with no gaps */}
            <div className="flex gap-2" style={{ height: '380px' }}>
              {/* LEFT PANEL - MPC Controls */}
              <div
                className="flex-shrink-0 h-full overflow-hidden"
                style={{
                  width: '70px',
                  background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
                  borderRadius: '8px',
                  padding: '8px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                <MPCLeftPanel />
              </div>

              {/* CENTER - Pad Grid or Keyboard */}
              <div className="flex-1 flex flex-col gap-2 h-full" style={{ minWidth: '320px', maxWidth: '420px' }}>
                {/* Instrument (Pads or Keyboard) */}
                <div
                  className="flex-1"
                  style={{
                    background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
                    borderRadius: '8px',
                    padding: '10px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {layoutMode === 'drumpad' ? <PadGrid /> : <PianoKeyboard />}
                </div>

                {/* FL Sampler - Show when a pad with sample is selected */}
                {selectedPadIndex !== null && hasSample && (
                  <div
                    style={{
                      background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    <FLSampler />
                  </div>
                )}
              </div>

              {/* RIGHT PANEL - LCD, Jog Wheel, Sample/Timing Controls */}
              <div
                className="flex-shrink-0 h-full overflow-hidden"
                style={{
                  width: '140px',
                  background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
                  borderRadius: '8px',
                  padding: '8px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                <MPCRightPanel />
              </div>

              {/* FAR RIGHT - Master Controls */}
              <div
                className="flex-shrink-0 h-full overflow-hidden"
                style={{
                  width: '100px',
                  background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
                  borderRadius: '8px',
                  padding: '10px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                <MasterControls />
              </div>
            </div>

          </MPCStudioSkin>

          {/* Piano Roll / Pattern Builder - Fills remaining screen space */}
          <div
            className="mt-4 flex-1 min-h-0"
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
              border: '1px solid #333',
            }}
          >
            <PianoRoll />
          </div>
        </div>
      )}
    </div>
  );
};

export default BeatMachine;

