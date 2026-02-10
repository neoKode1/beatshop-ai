'use client';

import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsPanelProps {
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  color: string;
  shortcuts: { keys: string; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Transport Controls',
    color: 'green',
    shortcuts: [
      { keys: 'Space', description: 'Play / Stop + Rewind' },
      { keys: 'Ctrl + Space', description: 'Pause (keep position)' },
      { keys: 'R', description: 'Arm / Disarm Recording' },
      { keys: 'L', description: 'Toggle PAT / SONG Mode' },
      { keys: 'Escape', description: 'Cancel Recording (revert)' },
      { keys: 'Ctrl + M', description: 'Toggle Metronome' },
      { keys: 'Ctrl + P', description: 'Toggle Count-in' },
      { keys: 'Ctrl + B', description: 'Toggle Blend Recording (Overdub)' },
      { keys: 'Ctrl + I', description: 'Toggle Wait for Input' },
      { keys: 'Ctrl + T', description: 'Typing Keyboard to Piano (MIDI toggle)' },
    ],
  },
  {
    title: 'Piano Roll Tools',
    color: 'amber',
    shortcuts: [
      { keys: 'P', description: 'Draw Tool (Pencil)' },
      { keys: 'B', description: 'Paint Tool (Brush)' },
      { keys: 'N', description: 'Paint Drum Sequence' },
      { keys: 'D', description: 'Delete Tool' },
      { keys: 'T', description: 'Mute Tool' },
      { keys: 'E', description: 'Select Tool' },
      { keys: 'C', description: 'Slice Tool' },
      { keys: 'K', description: 'Chord Stamp Tool' },
      { keys: 'Alt + V', description: 'Toggle Ghost Notes' },
    ],
  },
  {
    title: 'Editing',
    color: 'blue',
    shortcuts: [
      { keys: 'Ctrl + Z', description: 'Undo' },
      { keys: 'Ctrl + Y', description: 'Redo' },
      { keys: 'Ctrl + C', description: 'Copy Selected Notes' },
      { keys: 'Ctrl + V', description: 'Paste Notes' },
      { keys: 'Ctrl + A', description: 'Select All Notes' },
      { keys: 'Ctrl + D', description: 'Duplicate Selection' },
      { keys: 'Delete', description: 'Delete Selected Notes' },
      { keys: 'Ctrl + S', description: 'Save Project' },
    ],
  },
  {
    title: 'Drum Pads (Row Layout)',
    color: 'orange',
    shortcuts: [
      { keys: 'Q W E R', description: 'Pads 1-4 (Top Row)' },
      { keys: 'A S D F', description: 'Pads 5-8' },
      { keys: 'Z X C V', description: 'Pads 9-12' },
      { keys: 'T G B Y', description: 'Pads 13-16' },
    ],
  },
  {
    title: 'MPC Functions',
    color: 'red',
    shortcuts: [
      { keys: 'Click Pad', description: 'Trigger Pad Sound' },
      { keys: 'Right-click Pad', description: 'Fill / Rotate / Randomize Steps' },
      { keys: 'Right-click Step', description: 'Edit Velocity / Probability / Microtiming' },
      { keys: 'Hold Pad (Note Repeat)', description: 'Repeat note at selected rate' },
    ],
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
};

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({ onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl shadow-2xl border-2 border-gray-800/50 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-2 border-gray-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Keyboard size={24} className="text-amber-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-200">Keyboard Shortcuts</h2>
              <p className="text-xs text-gray-500">Press ? or F1 to open this panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-all"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {SHORTCUT_GROUPS.map((group) => {
            const colors = colorClasses[group.color] || colorClasses.blue;
            return (
              <div
                key={group.title}
                className={`rounded-lg p-3 border ${colors.bg} ${colors.border}`}
              >
                <h3 className={`font-bold text-sm mb-2 ${colors.text}`}>{group.title}</h3>
                <div className="space-y-1.5">
                  {group.shortcuts.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{shortcut.description}</span>
                      <kbd className="bg-gray-700/50 px-1.5 py-0.5 rounded text-gray-300 font-mono text-[10px] border border-gray-600/50">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800/50 text-center text-xs text-gray-500 shrink-0">
          Press <kbd className="bg-gray-700/50 px-1 rounded">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsPanel;

