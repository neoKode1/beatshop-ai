'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { Save, Check, AlertCircle } from 'lucide-react';

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const AUTO_SAVE_KEY = 'beatshop_autosave';
const CURRENT_PROJECT_KEY = 'beatshop_current_project';

interface AutoSaveProps {
  onQuickSave?: () => void;
}

const AutoSave: React.FC<AutoSaveProps> = ({ onQuickSave }) => {
  const store = useBeatStore();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveEnabled = store.preferences.autoSave;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Serialize pads (remove Tone.js objects)
  const serializePads = useCallback((pads: any[]) => {
    return pads.map(pad => ({
      id: pad.id,
      sample: pad.sample,
      volume: pad.volume,
      pan: pad.pan,
      muted: pad.muted,
      solo: pad.solo,
      note: pad.note,
      effects: pad.effects,
    }));
  }, []);

  // Serialize tracks (remove Tone.js audio objects like player, sampler)
  const serializeTracks = useCallback((tracks: any[]) => {
    return tracks.map(track => ({
      id: track.id,
      name: track.name,
      type: track.type,
      sample: track.sample,
      volume: track.volume,
      pan: track.pan,
      muted: track.muted,
      solo: track.solo,
      color: track.color,
      steps: track.steps,
      midiNotes: track.midiNotes,
      // Exclude: player, sampler, effects (Tone.js objects with circular refs)
    }));
  }, []);

  // Create auto-save data
  const createAutoSaveData = useCallback(() => {
    return {
      id: 'autosave',
      name: 'Auto-Save',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      bpm: store.bpm,
      timeSignature: store.timeSignature,
      numBars: store.numBars,
      patterns: store.patterns,
      arrangementClips: store.arrangementClips,
      pads: serializePads(store.pads),
      steps: store.steps,
      tracks: serializeTracks(store.tracks), // Serialize to remove Tone.js objects
      midiNotes: store.midiNotes,
      masterSettings: {
        masterVolume: store.masterVolume,
        compressorThreshold: store.compressorThreshold,
        compressorRatio: store.compressorRatio,
        compressorAttack: store.compressorAttack,
        compressorRelease: store.compressorRelease,
        limiterThreshold: store.limiterThreshold,
        eqLow: store.eqLow,
        eqMid: store.eqMid,
        eqHigh: store.eqHigh,
        distortion: store.distortion,
        reverb: store.reverb,
        delay: store.delay,
        stereoWidth: store.stereoWidth,
        swing: store.swing,
        patternLength: store.patternLength,
      },
    };
  }, [store, serializePads, serializeTracks]);

  // Perform auto-save
  const performAutoSave = useCallback(() => {
    if (!autoSaveEnabled) return;

    try {
      setSaveStatus('saving');
      const data = createAutoSaveData();
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data));
      localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(data));
      setLastSaved(new Date());
      setSaveStatus('saved');
      
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [autoSaveEnabled, createAutoSaveData]);

  // Set up auto-save interval
  useEffect(() => {
    if (autoSaveEnabled) {
      // Initial save after 5 seconds
      const initialTimeout = setTimeout(performAutoSave, 5000);
      
      // Then save every 30 seconds
      intervalRef.current = setInterval(performAutoSave, AUTO_SAVE_INTERVAL);

      return () => {
        clearTimeout(initialTimeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoSaveEnabled, performAutoSave]);

  // Keyboard shortcut: Cmd/Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (onQuickSave) {
          onQuickSave();
        } else {
          performAutoSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onQuickSave, performAutoSave]);

  // Don't render anything if auto-save is disabled
  if (!autoSaveEnabled) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {saveStatus === 'saving' && (
        <>
          <Save size={12} className="animate-pulse" />
          <span>Saving...</span>
        </>
      )}
      {saveStatus === 'saved' && (
        <>
          <Check size={12} className="text-green-500" />
          <span className="text-green-500">Saved</span>
        </>
      )}
      {saveStatus === 'error' && (
        <>
          <AlertCircle size={12} className="text-red-500" />
          <span className="text-red-500">Save failed</span>
        </>
      )}
      {saveStatus === 'idle' && lastSaved && (
        <span title={lastSaved.toLocaleString()}>
          Last saved: {lastSaved.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default AutoSave;

