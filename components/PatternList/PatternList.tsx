'use client';

import React, { useState } from 'react';
import { useBeatStore, Pattern } from '@/store/useBeatStore';
import { Music, Plus, Trash2, Copy, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PatternList: React.FC = () => {
  const { patterns, currentPatternId, savePattern, loadPattern, deletePattern, duplicatePattern, renamePattern } = useBeatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPatternName, setNewPatternName] = useState('');
  const [patternType, setPatternType] = useState<'drum' | 'piano'>('drum');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleSavePattern = () => {
    if (newPatternName.trim()) {
      savePattern(newPatternName.trim(), patternType);
      setNewPatternName('');
      setShowSaveDialog(false);
    }
  };

  const handleRename = (patternId: string) => {
    if (editingName.trim()) {
      renamePattern(patternId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const startDrag = (e: React.DragEvent, pattern: Pattern) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'pattern',
      patternId: pattern.id,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="relative">
      {/* Patterns Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all border border-gray-600/30"
      >
        <Music size={18} className="text-amber-400" />
        <span className="font-bold text-gray-200">Patterns</span>
        <span className="text-xs bg-amber-600/30 px-2 py-0.5 rounded-full text-amber-300">
          {patterns.length}
        </span>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-96 bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] border-2 border-gray-800/50 z-50 max-h-96 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-200">Saved Patterns</h3>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-bold text-white transition-all"
              >
                <Plus size={14} />
                Save Current
              </button>
            </div>

            {/* Pattern List */}
            <div className="flex-1 overflow-y-auto p-2">
              {patterns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Music size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No patterns saved yet</p>
                  <p className="text-xs mt-1">Create a beat and save it!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      draggable
                      onDragStart={(e) => startDrag(e, pattern)}
                      className={`p-3 rounded-lg border transition-all cursor-move ${
                        currentPatternId === pattern.id
                          ? 'bg-amber-600/20 border-amber-500/50'
                          : 'bg-gray-800/30 border-gray-700/30 hover:bg-gray-700/30'
                      }`}
                    >
                      {editingId === pattern.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(pattern.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="flex-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRename(pattern.id)}
                            className="p-1 hover:bg-green-600/20 rounded text-green-400"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 hover:bg-red-600/20 rounded text-red-400"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-200 text-sm">{pattern.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                pattern.type === 'drum' 
                                  ? 'bg-blue-600/30 text-blue-300' 
                                  : 'bg-green-600/30 text-green-300'
                              }`}>
                                {pattern.type}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => loadPattern(pattern.id)}
                              className="flex-1 px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 rounded text-xs font-bold text-gray-300 transition-all"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(pattern.id);
                                setEditingName(pattern.name);
                              }}
                              className="p-1 hover:bg-gray-600/50 rounded text-gray-400"
                              title="Rename"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => duplicatePattern(pattern.id)}
                              className="p-1 hover:bg-gray-600/50 rounded text-gray-400"
                              title="Duplicate"
                            >
                              <Copy size={12} />
                            </button>
                            <button
                              onClick={() => deletePattern(pattern.id)}
                              className="p-1 hover:bg-red-600/20 rounded text-red-400"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Pattern Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] border-2 border-gray-800/50 w-full max-w-md p-6"
          >
            <h3 className="text-lg font-bold text-gray-200 mb-4">Save Pattern</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Pattern Name
                </label>
                <input
                  type="text"
                  value={newPatternName}
                  onChange={(e) => setNewPatternName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePattern();
                    if (e.key === 'Escape') setShowSaveDialog(false);
                  }}
                  placeholder="My Awesome Beat"
                  className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-700/50 rounded-lg text-gray-200 font-semibold focus:border-amber-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Pattern Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPatternType('drum')}
                    className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
                      patternType === 'drum'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                    }`}
                  >
                    Drum Pattern
                  </button>
                  <button
                    onClick={() => setPatternType('piano')}
                    className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
                      patternType === 'piano'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                    }`}
                  >
                    Piano Pattern
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg font-bold text-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePattern}
                disabled={!newPatternName.trim()}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-bold text-white transition-all"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PatternList;

