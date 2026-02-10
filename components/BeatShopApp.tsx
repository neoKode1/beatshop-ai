'use client';

import React, { useState, useEffect } from 'react';
import BeatMachine from './BeatMachine/BeatMachine';
import ArrangementView from './BeatMachine/ArrangementView';
import SampleBrowser from './SampleBrowser/SampleBrowser';
import AIPanel from './AIPanel/AIPanel';
import AIGeneratorPanel from './AIGenerator/AIGeneratorPanel';
import FLToolbar from './Toolbar/FLToolbar';
import ProjectManager from './ProjectManager/ProjectManager';
import SessionRestore from './SessionRestore/SessionRestore';
import { ChevronLeft, ChevronRight, Wand2, MessageSquare } from 'lucide-react';
import { useBeatStore } from '@/store/useBeatStore';

const BeatShopApp: React.FC = () => {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [aiPanelMode, setAIPanelMode] = useState<'generator' | 'assistant'>('generator');

  // Get playback mode from store
  const playbackMode = useBeatStore(state => state.playbackMode);

  // Load AI panel state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('aiPanelOpen');
    if (saved !== null) {
      setIsAIPanelOpen(JSON.parse(saved));
    }
  }, []);

  // Save AI panel state to localStorage
  const toggleAIPanel = () => {
    const newState = !isAIPanelOpen;
    setIsAIPanelOpen(newState);
    localStorage.setItem('aiPanelOpen', JSON.stringify(newState));
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--fl-panel-darker)]">
      {/* Session Restore Prompt */}
      <SessionRestore />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Sample Browser */}
        <aside className="w-80 bg-[var(--fl-panel-bg)] border-r border-[var(--fl-panel-border)] overflow-y-auto shadow-[inset_-1px_0_0_#00000040]">
          <SampleBrowser />
        </aside>

        {/* Center Workspace */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--fl-panel-medium)]">
          <FLToolbar />
          <div className="flex-1 p-2 min-h-0 overflow-y-auto">
            {/* Show BeatMachine in PAT mode, ArrangementView in SONG mode */}
            {playbackMode === 'PAT' ? (
              <BeatMachine />
            ) : (
              <ArrangementView />
            )}
          </div>
        </main>

        {/* Right Panel - AI Panel (Collapsible) */}
        {isAIPanelOpen && (
          <aside className="w-96 bg-[var(--fl-panel-bg)] border-l border-[var(--fl-panel-border)] overflow-hidden relative flex flex-col shadow-[inset_1px_0_0_#00000040]">
            {/* AI Panel Mode Switcher */}
            <div className="flex bg-[var(--fl-panel-darker)] border-b border-[var(--fl-panel-border)]">
              <button
                onClick={() => setAIPanelMode('generator')}
                className={`flex-1 py-1.5 px-3 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all duration-300 ${
                  aiPanelMode === 'generator'
                    ? 'text-[var(--fl-accent-amber)] border-b-2 border-[var(--fl-accent-amber)] bg-[var(--fl-accent-amber)]/10'
                    : 'text-[var(--fl-text-secondary)] hover:text-[var(--fl-text-primary)] hover:bg-[var(--fl-panel-medium)]'
                }`}
              >
                <Wand2 size={12} />
                AI Generator
              </button>
              <button
                onClick={() => setAIPanelMode('assistant')}
                className={`flex-1 py-1.5 px-3 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all duration-300 ${
                  aiPanelMode === 'assistant'
                    ? 'text-[var(--fl-accent-amber)] border-b-2 border-[var(--fl-accent-amber)] bg-[var(--fl-accent-amber)]/10'
                    : 'text-[var(--fl-text-secondary)] hover:text-[var(--fl-text-primary)] hover:bg-[var(--fl-panel-medium)]'
                }`}
              >
                <MessageSquare size={12} />
                AI Assistant
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto">
              {aiPanelMode === 'generator' ? <AIGeneratorPanel /> : <AIPanel />}
            </div>

            {/* Toggle Button - On left edge of panel */}
            <button
              onClick={toggleAIPanel}
              className="absolute top-1/2 -translate-y-1/2 -left-5 z-10 w-5 h-14 bg-gradient-to-r from-[var(--fl-panel-medium)] to-[var(--fl-panel-bg)] border border-[var(--fl-panel-border)] shadow-[0_2px_6px_rgba(0,0,0,0.5)] rounded-l flex items-center justify-center text-[var(--fl-text-dim)] hover:text-white transition-all duration-300"
              title="Hide AI Panel"
            >
              <ChevronRight size={14} />
            </button>
          </aside>
        )}

        {/* Toggle Button - When panel is closed */}
        {!isAIPanelOpen && (
          <button
            onClick={toggleAIPanel}
            className="w-5 h-14 bg-gradient-to-l from-[var(--fl-panel-medium)] to-[var(--fl-panel-bg)] border border-[var(--fl-panel-border)] shadow-[0_2px_6px_rgba(0,0,0,0.5)] rounded-r flex items-center justify-center text-[var(--fl-text-dim)] hover:text-white transition-all duration-300 self-center"
            title="Show AI Panel"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <PreferencesModal onClose={() => setShowPreferences(false)} />
      )}

      {/* Project Manager */}
      {showProjectManager && (
        <ProjectManager onClose={() => setShowProjectManager(false)} />
      )}
    </div>
  );
};

// Preferences Modal Component
const PreferencesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[var(--fl-panel-bg)] rounded-sm shadow-[0_8px_32px_rgba(0,0,0,0.8)] border border-[var(--fl-panel-border)] w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="fl-panel-header px-4 py-3 h-auto border-b border-[var(--fl-panel-border)]">
          <h2 className="text-sm font-bold text-[var(--fl-text-primary)]">Preferences</h2>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(80vh-140px)]">
          <PreferencesContent />
        </div>

        {/* Footer */}
        <div className="bg-[var(--fl-panel-darker)] px-4 py-3 border-t border-[var(--fl-panel-border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-gradient-to-b from-[var(--fl-panel-medium)] to-[#000000b0] shadow-[inset_0_0_0_0.5px_#00000090] text-[var(--fl-text-primary)] text-xs font-bold hover:text-white transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Preferences Content Component
const PreferencesContent: React.FC = () => {
  const preferences = useBeatStore(state => state.preferences);
  const setAudioQuality = useBeatStore(state => state.setAudioQuality);
  const setKeyboardEnabled = useBeatStore(state => state.setKeyboardEnabled);
  const setAutoSave = useBeatStore(state => state.setAutoSave);
  const loadPreferences = useBeatStore(state => state.loadPreferences);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  return (
    <div className="space-y-6">
      {/* Audio Settings */}
      <section>
        <h3 className="text-lg font-bold text-gray-300 mb-4">Audio Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Audio Quality
            </label>
            <select
              value={preferences.audioQuality}
              onChange={(e) => setAudioQuality(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-700/50 rounded-lg text-gray-200 font-semibold focus:border-gray-600 focus:outline-none"
            >
              <option value="low">Low (Faster)</option>
              <option value="medium">Medium</option>
              <option value="high">High (Best Quality)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Input Settings */}
      <section>
        <h3 className="text-lg font-bold text-gray-300 mb-4">Input Settings</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/30 cursor-pointer hover:bg-gray-800/70 transition-all">
            <span className="text-sm font-semibold text-gray-300">
              Enable Keyboard Shortcuts
            </span>
            <input
              type="checkbox"
              checked={preferences.keyboardEnabled}
              onChange={(e) => setKeyboardEnabled(e.target.checked)}
              className="w-5 h-5 accent-gray-600"
            />
          </label>
        </div>
      </section>

      {/* General Settings */}
      <section>
        <h3 className="text-lg font-bold text-gray-300 mb-4">General Settings</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/30 cursor-pointer hover:bg-gray-800/70 transition-all">
            <span className="text-sm font-semibold text-gray-300">
              Auto-save Projects
            </span>
            <input
              type="checkbox"
              checked={preferences.autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="w-5 h-5 accent-gray-600"
            />
          </label>
        </div>
      </section>

      {/* Info */}
      <section className="pt-4 border-t-2 border-gray-800/50">
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 Preferences are automatically saved to your browser</p>
          <p>🎵 Changes take effect immediately</p>
        </div>
      </section>
    </div>
  );
};

export default BeatShopApp;

