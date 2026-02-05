'use client';

import React, { useEffect } from 'react';
import { useBeatStore } from '@/store/useBeatStore';

const AUTO_SAVE_KEY = 'beatshop_autosave';
const CURRENT_PROJECT_KEY = 'beatshop_current_project';

const SessionRestore: React.FC = () => {
  const store = useBeatStore();

  useEffect(() => {
    // Auto-restore session on mount without prompting
    const autoRestoreSession = () => {
      try {
        // First check for current project, then auto-save
        const currentProject = localStorage.getItem(CURRENT_PROJECT_KEY);
        const autoSave = localStorage.getItem(AUTO_SAVE_KEY);

        const savedData = currentProject || autoSave;

        if (savedData) {
          const parsed = JSON.parse(savedData);
          // Only restore if there's meaningful data
          const hasPads = parsed.pads?.some((p: any) => p.sample !== null);
          const hasPatterns = parsed.patterns?.length > 0;
          const hasSteps = parsed.steps?.some((s: any) => s.active);

          if (hasPads || hasPatterns || hasSteps) {
            // Auto-restore without prompting
            store.restoreProject({
              bpm: parsed.bpm,
              timeSignature: parsed.timeSignature,
              patterns: parsed.patterns,
              arrangementClips: parsed.arrangementClips,
              pads: parsed.pads,
              steps: parsed.steps,
              tracks: parsed.tracks,
              midiNotes: parsed.midiNotes,
              masterSettings: parsed.masterSettings,
            });
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      }
    };

    // Small delay to let the app initialize
    const timeout = setTimeout(autoRestoreSession, 300);
    return () => clearTimeout(timeout);
  }, [store]);

  // No UI - just auto-restore
  return null;
};

export default SessionRestore;

