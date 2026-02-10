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
import MIDILearnPanel from './MIDILearnPanel';
import { Sliders, Piano, Music, Disc, ListMusic, Download, HelpCircle, Settings, ChevronDown, ChevronUp } from 'lucide-react';

// Layout modes for the workspace
type LayoutMode = 'drumpad' | 'keys' | 'sequencer' | 'song' | 'mixer';

const BeatMachine: React.FC = () => {
  // Layout mode controls which view is displayed
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('drumpad');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);
  const [showMIDILearnPanel, setShowMIDILearnPanel] = useState(false);
  const [samplerCollapsed, setSamplerCollapsed] = useState(true);
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

      {/* MIDI Learn Panel */}
      {showMIDILearnPanel && (
        <MIDILearnPanel onClose={() => setShowMIDILearnPanel(false)} />
      )}

      {/* Layout Tab Navigation - FL Studio Window Toolbar Style */}
      <div className="flex gap-0 mb-3 bg-[var(--fl-panel-bg)] border border-[var(--fl-panel-border)] w-fit shadow-[inset_0_0_0_1px_#00000040]">
        {/* Drum Pad */}
        <button
          onClick={() => setLayoutMode('drumpad')}
          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold transition-all duration-300 border-r border-[var(--fl-panel-border)] ${
            layoutMode === 'drumpad'
              ? 'bg-gradient-to-b from-[var(--fl-accent-orange)] to-[#cc5500] text-white shadow-[inset_0_0_8px_rgba(255,107,0,0.4)]'
              : 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[var(--fl-panel-bg)] text-[var(--fl-text-secondary)] hover:text-white hover:bg-[var(--fl-panel-light)]'
          }`}
        >
          <Disc size={12} />
          <span>Drum Pad</span>
        </button>

        {/* Keys */}
        <button
          onClick={() => setLayoutMode('keys')}
          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold transition-all duration-300 border-r border-[var(--fl-panel-border)] ${
            layoutMode === 'keys'
              ? 'bg-gradient-to-b from-[var(--fl-accent-orange)] to-[#cc5500] text-white shadow-[inset_0_0_8px_rgba(255,107,0,0.4)]'
              : 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[var(--fl-panel-bg)] text-[var(--fl-text-secondary)] hover:text-white hover:bg-[var(--fl-panel-light)]'
          }`}
        >
          <Piano size={12} />
          <span>Keys</span>
        </button>

        {/* Sequencer */}
        <button
          onClick={() => setLayoutMode('sequencer')}
          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold transition-all duration-300 border-r border-[var(--fl-panel-border)] ${
            layoutMode === 'sequencer'
              ? 'bg-gradient-to-b from-[var(--fl-accent-blue)] to-[#2a6abf] text-white shadow-[inset_0_0_8px_rgba(74,158,255,0.4)]'
              : 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[var(--fl-panel-bg)] text-[var(--fl-text-secondary)] hover:text-white hover:bg-[var(--fl-panel-light)]'
          }`}
        >
          <ListMusic size={12} />
          <span>Sequencer</span>
        </button>

        {/* Song Mode */}
        <button
          onClick={() => setLayoutMode('song')}
          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold transition-all duration-300 border-r border-[var(--fl-panel-border)] ${
            layoutMode === 'song'
              ? 'bg-gradient-to-b from-[var(--fl-accent-amber)] to-[#c07f00] text-white shadow-[inset_0_0_8px_rgba(245,166,35,0.4)]'
              : 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[var(--fl-panel-bg)] text-[var(--fl-text-secondary)] hover:text-white hover:bg-[var(--fl-panel-light)]'
          }`}
        >
          <Music size={12} />
          <span>Song Mode</span>
        </button>

        {/* Mixer */}
        <button
          onClick={() => setLayoutMode('mixer')}
          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold transition-all duration-300 border-r border-[var(--fl-panel-border)] ${
            layoutMode === 'mixer'
              ? 'bg-gradient-to-b from-[#00cc44] to-[#009933] text-white shadow-[inset_0_0_8px_rgba(0,204,68,0.4)]'
              : 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[var(--fl-panel-bg)] text-[var(--fl-text-secondary)] hover:text-white hover:bg-[var(--fl-panel-light)]'
          }`}
        >
          <Sliders size={12} />
          <span>Mixer</span>
        </button>

        {/* Separator */}
        <div className="w-px bg-gradient-to-b from-transparent via-[var(--fl-panel-border-light)] to-transparent mx-0" />

        {/* Export Button */}
        <button
          onClick={() => {
            setShowExportModal(true);
            console.log('📤 Opening export dialog', { currentMode: layoutMode });
          }}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold transition-all duration-300 border-r border-[var(--fl-panel-border)] bg-gradient-to-b from-[var(--fl-panel-medium)] to-[var(--fl-panel-bg)] text-[var(--fl-text-secondary)] hover:text-[var(--fl-accent-green)] hover:bg-[var(--fl-panel-light)]"
          title="Export Audio (Ctrl+Shift+E)"
        >
          <Download size={12} />
          <span>Export</span>
        </button>

        {/* MIDI Learn Button */}
        <button
          onClick={() => {
            setShowMIDILearnPanel(true);
            console.log('🎹 MIDI Learn panel opened');
          }}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold transition-all duration-300 border-r border-[var(--fl-panel-border)] bg-gradient-to-b from-[var(--fl-panel-medium)] to-[var(--fl-panel-bg)] text-[var(--fl-text-secondary)] hover:text-[var(--fl-accent-orange)] hover:bg-[var(--fl-panel-light)]"
          title="MIDI Learn"
        >
          <Settings size={12} />
        </button>

        {/* Help Button - Keyboard Shortcuts */}
        <button
          onClick={() => {
            setShowShortcutsPanel(true);
            console.log('⌨️ Keyboard Shortcuts panel opened via button');
          }}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold transition-all duration-300 bg-gradient-to-b from-[var(--fl-panel-medium)] to-[var(--fl-panel-bg)] text-[var(--fl-text-secondary)] hover:text-[var(--fl-accent-amber)] hover:bg-[var(--fl-panel-light)]"
          title="Keyboard Shortcuts (? or F1)"
        >
          <HelpCircle size={12} />
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
              background: 'var(--fl-panel-darker)',
              overflow: 'hidden',
              border: '1px solid var(--fl-panel-border)',
            }}
          >
            <PianoRoll />
          </div>
        </div>
      ) : layoutMode === 'keys' ? (
        /* Keys Mode - Full-width keyboard layout */
        <div className="flex-1 flex flex-col overflow-hidden pb-2">
          {/* Full-width Piano Keyboard */}
          <div
            className="w-full"
            style={{
              height: '280px',
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
              border: '1px solid #333',
            }}
          >
            <PianoKeyboard />
          </div>

          {/* Piano Roll / Pattern Builder - Fills remaining screen space */}
          <div
            className="mt-4 flex-1 min-h-0"
            style={{
              background: 'var(--fl-panel-darker)',
              overflow: 'hidden',
              border: '1px solid var(--fl-panel-border)',
            }}
          >
            <PianoRoll />
          </div>
        </div>
      ) : (
        /* Drum Pad Mode - Hardware-Style Enclosure */
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
                  STUDIO
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

              {/* CENTER - Pad Grid - Stretches to fill available space */}
              <div
                className="flex-1 flex flex-col gap-2 h-full"
                style={{ minWidth: '320px' }}
              >
                {/* Instrument (Pads) - Always visible, takes full space */}
                <div
                  className="flex-1 flex flex-col min-h-0 overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
                    borderRadius: '8px',
                    padding: '10px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  <PadGrid />
                </div>
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

          {/* FL Sampler Panel - Collapsible, below pads, above piano roll */}
          {selectedPadIndex !== null && hasSample && (
            <div
              className="mt-2 flex-shrink-0"
              style={{
                background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                border: '1px solid #333',
              }}
            >
              {/* Collapse/Expand toggle bar */}
              <button
                onClick={() => setSamplerCollapsed(!samplerCollapsed)}
                className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <span className="flex items-center gap-1.5">
                  <span style={{ color: '#ff6b00' }}>▸</span>
                  SAMPLER — Pad {selectedPadIndex + 1} • {pads[selectedPadIndex]?.sample?.name || 'Empty'}
                </span>
                {samplerCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </button>
              {/* Sampler content - hidden when collapsed */}
              {!samplerCollapsed && (
                <div style={{ maxHeight: '220px', overflow: 'auto' }}>
                  <FLSampler />
                </div>
              )}
            </div>
          )}

          {/* Piano Roll / Pattern Builder - Fills remaining screen space */}
          <div
            className="mt-2 flex-1 min-h-0"
            style={{
              background: 'var(--fl-panel-darker)',
              overflow: 'hidden',
              border: '1px solid var(--fl-panel-border)',
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

