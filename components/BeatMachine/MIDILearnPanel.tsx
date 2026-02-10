'use client';

import React, { useEffect, useState } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { midiService } from '@/lib/audio/midiService';
import { X, Settings, Trash2, Loader, AlertCircle, Check, Zap } from 'lucide-react';

interface MIDILearnPanelProps {
  onClose: () => void;
}

const MIDILearnPanel: React.FC<MIDILearnPanelProps> = ({ onClose }) => {
  const {
    midiLearnMode,
    midiLearnTarget,
    midiMappings,
    setMidiLearnMode,
    setMidiLearnTarget,
    addMidiMapping,
    removeMidiMapping,
    clearMidiMappings,
    loadMidiMappings,
  } = useBeatStore();

  const [devices, setDevices] = useState<Array<{ id: string; name: string; connected: boolean }>>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  // Initialize MIDI service on mount
  useEffect(() => {
    loadMidiMappings();
    midiService.initialize().then((success) => {
      setIsInitialized(success);
      if (success) {
        setDevices(midiService.getDevices());
        console.log('🎹 MIDI Service initialized in MIDILearnPanel');
      }
    });

    // Subscribe to MIDI messages for display
    const unsubscribe = midiService.onMessage((msg) => {
      const label = msg.type === 'cc' 
        ? `CC${msg.value} = ${msg.velocity}` 
        : `Note ${msg.value} (${msg.type === 'noteOn' ? 'ON' : 'OFF'})`;
      setLastMessage(`Ch${msg.channel}: ${label}`);
    });

    return () => {
      unsubscribe();
      if (midiLearnMode) setMidiLearnMode(false);
    };
  }, [loadMidiMappings, midiLearnMode, setMidiLearnMode]);

  // Handle MIDI Learn mode
  useEffect(() => {
    if (midiLearnMode && midiLearnTarget) {
      midiService.startLearn((msg) => {
        if (msg.type === 'noteOn' || msg.type === 'cc') {
          addMidiMapping({
            type: msg.type === 'cc' ? 'cc' : 'note',
            channel: msg.channel,
            value: msg.value,
            targetType: midiLearnTarget.type,
            targetId: midiLearnTarget.id,
            label: midiLearnTarget.label,
          });
          midiService.stopLearn();
        }
      });
    } else {
      midiService.stopLearn();
    }
  }, [midiLearnMode, midiLearnTarget, addMidiMapping]);

  const startLearnForPad = (padIndex: number) => {
    setMidiLearnTarget({ type: 'pad', id: padIndex, label: `Pad ${padIndex + 1}` });
    setMidiLearnMode(true);
  };

  const startLearnForTransport = (action: string) => {
    const labels: Record<string, string> = {
      play: 'Play/Pause', stop: 'Stop', record: 'Record', bpm: 'BPM',
    };
    setMidiLearnTarget({ type: 'transport', id: action, label: labels[action] || action });
    setMidiLearnMode(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Settings className="text-orange-500" size={18} />
            <span className="font-semibold text-white">MIDI Learn</span>
            {midiLearnMode && (
              <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full animate-pulse">
                Learning...
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-gray-400">
              {isInitialized ? `${devices.length} device(s) connected` : 'MIDI not available'}
            </span>
            {lastMessage && (
              <span className="ml-auto text-xs text-gray-500 font-mono">{lastMessage}</span>
            )}
          </div>

          {/* Learn Target Info */}
          {midiLearnMode && midiLearnTarget && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-center gap-3">
              <Loader className="animate-spin text-orange-400" size={16} />
              <span className="text-orange-300 text-sm">
                Waiting for MIDI input for <strong>{midiLearnTarget.label}</strong>...
              </span>
              <button onClick={() => setMidiLearnMode(false)} className="ml-auto text-xs text-orange-400 hover:underline">
                Cancel
              </button>
            </div>
          )}

          {/* Pad Mappings */}
          <div>
            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">Drum Pads</h3>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }, (_, i) => {
                const mapping = midiMappings.find(m => m.targetType === 'pad' && m.targetId === i);
                return (
                  <button
                    key={i}
                    onClick={() => startLearnForPad(i)}
                    className={`relative h-12 rounded-lg text-xs font-medium transition-all ${
                      mapping
                        ? 'bg-green-600/20 border border-green-500/50 text-green-400'
                        : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-orange-500'
                    }`}
                  >
                    <span className="absolute top-1 left-1.5 text-[10px] opacity-60">{i + 1}</span>
                    {mapping && (
                      <span className="text-[9px]">{mapping.type === 'note' ? `N${mapping.value}` : `CC${mapping.value}`}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transport Mappings */}
          <div>
            <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">Transport Controls</h3>
            <div className="flex gap-2">
              {['play', 'stop', 'record'].map((action) => {
                const mapping = midiMappings.find(m => m.targetType === 'transport' && m.targetId === action);
                return (
                  <button
                    key={action}
                    onClick={() => startLearnForTransport(action)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      mapping
                        ? 'bg-green-600/20 border border-green-500/50 text-green-400'
                        : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-orange-500'
                    }`}
                  >
                    <Zap size={12} />
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                    {mapping && <Check size={10} className="ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Mappings List */}
          {midiMappings.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase text-gray-500 font-semibold">All Mappings ({midiMappings.length})</h3>
                <button
                  onClick={clearMidiMappings}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 size={10} /> Clear All
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {midiMappings.map((m) => (
                  <div key={m.id} className="flex items-center justify-between bg-gray-800/50 rounded px-2 py-1.5 text-xs">
                    <span className="text-gray-300">{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-mono">
                        Ch{m.channel} {m.type === 'note' ? `Note${m.value}` : `CC${m.value}`}
                      </span>
                      <button onClick={() => removeMidiMapping(m.id)} className="text-red-400 hover:text-red-300 p-0.5">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-800/30 rounded-lg p-3">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>
              Click a pad or transport button, then press a key or move a control on your MIDI controller to assign it.
              Mappings are saved automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MIDILearnPanel;

