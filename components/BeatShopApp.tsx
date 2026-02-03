'use client';

import React, { useState, useEffect } from 'react';
import BeatMachine from './BeatMachine/BeatMachine';
import SampleBrowser from './SampleBrowser/SampleBrowser';
import AIPanel from './AIPanel/AIPanel';
import Toolbar from './Toolbar/Toolbar';
import PatternList from './PatternList/PatternList';
import ProjectManager from './ProjectManager/ProjectManager';
import { ChevronLeft, ChevronRight, Settings, FolderOpen } from 'lucide-react';
import { useBeatStore } from '@/store/useBeatStore';

const BeatShopApp: React.FC = () => {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);

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
    <div className="h-screen flex flex-col bg-[#1A1A1A]">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#252525] to-[#1A1A1A] border-b-2 border-gray-900/50 px-6 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.5)] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Beat Shop AI
            </h1>
            <p className="text-sm text-gray-400">AI-Powered Beat Machine</p>
          </div>

          {/* Pattern List */}
          <PatternList />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProjectManager(true)}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white transition-all"
            title="Project Manager"
          >
            <FolderOpen size={20} />
          </button>
          <button
            onClick={() => setShowPreferences(true)}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white transition-all"
            title="Preferences"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Sample Browser */}
        <aside className="w-80 bg-gradient-to-b from-[#252525] to-[#1A1A1A] border-r-2 border-gray-900/50 overflow-y-auto shadow-[2px_0_8px_rgba(0,0,0,0.5)]">
          <SampleBrowser />
        </aside>

        {/* Center Workspace */}
        <main className="flex-1 flex flex-col bg-gradient-to-b from-[#2A2A2A] to-[#252525]">
          <Toolbar />
          <div className="flex-1 p-8 overflow-y-auto">
            <BeatMachine />
          </div>
        </main>

        {/* Right Panel - AI Assistant (Collapsible) */}
        <div className="relative">
          {/* AI Panel */}
          {isAIPanelOpen && (
            <aside className="w-96 bg-gradient-to-b from-[#252525] to-[#1A1A1A] border-l-2 border-gray-900/50 overflow-y-auto shadow-[-2px_0_8px_rgba(0,0,0,0.5)] animate-slide-in">
              <AIPanel />
            </aside>
          )}

          {/* Toggle Button - Always visible */}
          <button
            onClick={toggleAIPanel}
            className={`absolute top-1/2 -translate-y-1/2 z-10 w-6 h-16 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border-2 border-gray-900/50 shadow-lg flex items-center justify-center text-gray-300 hover:text-white transition-all ${
              isAIPanelOpen ? 'left-0 rounded-l-lg' : 'right-0 rounded-r-lg'
            }`}
            title={isAIPanelOpen ? 'Hide AI Assistant' : 'Show AI Assistant'}
          >
            {isAIPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
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
      <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] border-2 border-gray-800/50 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b-2 border-gray-900/50">
          <h2 className="text-xl font-bold text-gray-200">Preferences</h2>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <PreferencesContent />
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-t-2 border-gray-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 rounded-lg font-bold text-white shadow-lg transition-all"
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

