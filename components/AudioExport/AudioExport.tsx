'use client';

import React, { useState } from 'react';
import { Download, X, Loader, Music, Layers } from 'lucide-react';
import * as Tone from 'tone';
import { useBeatStore } from '@/store/useBeatStore';

interface AudioExportProps {
  onClose: () => void;
  defaultMode?: 'pattern' | 'arrangement';
}

export const AudioExport: React.FC<AudioExportProps> = ({ onClose, defaultMode = 'pattern' }) => {
  const {
    arrangementClips, patterns, bpm,
    steps, pads, midiNotes, numBars, numSteps, currentPatternIndex,
    tracks
  } = useBeatStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<'wav' | 'mp3'>('wav');
  const [exportQuality, setExportQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [exportMode, setExportMode] = useState<'pattern' | 'arrangement'>(defaultMode);

  const calculateArrangementDuration = () => {
    if (arrangementClips.length === 0) return 0;

    const maxEnd = Math.max(...arrangementClips.map(clip => clip.startTime + clip.duration));
    return maxEnd; // in bars
  };

  const calculatePatternDuration = () => {
    return numBars; // Pattern duration in bars
  };

  const exportAudio = async () => {
    setIsExporting(true);
    setExportProgress(0);

    console.log(`🎵 Starting ${exportMode} export...`, {
      mode: exportMode,
      format: exportFormat,
      quality: exportQuality,
      bpm,
    });

    try {
      await Tone.start();

      let durationBars: number;

      if (exportMode === 'arrangement') {
        durationBars = calculateArrangementDuration();
        if (durationBars === 0) {
          alert('No clips in arrangement to export');
          console.log('❌ Export failed: No clips in arrangement');
          setIsExporting(false);
          return;
        }
        console.log(`📋 Exporting arrangement: ${arrangementClips.length} clips, ${durationBars} bars`);
      } else {
        durationBars = calculatePatternDuration();
        const activeSteps = steps.filter(s => s.active).length;
        const activeMidiNotes = midiNotes.length;
        console.log(`🎹 Exporting pattern ${currentPatternIndex}: ${durationBars} bars, ${activeSteps} drum steps, ${activeMidiNotes} MIDI notes`);
      }

      // Calculate duration in seconds
      const beatsPerBar = 4; // Assuming 4/4 time
      const beatsPerMinute = bpm;
      const durationSeconds = (durationBars * beatsPerBar) / (beatsPerMinute / 60);
      console.log(`⏱️ Duration: ${durationSeconds.toFixed(2)}s`);

      // Clear any scheduled events
      Tone.getTransport().cancel();
      Tone.getTransport().position = 0;

      // Set up recorder
      const recorder = new Tone.Recorder();
      Tone.getDestination().connect(recorder);

      // Start recording
      await recorder.start();
      setExportProgress(10);
      console.log('🔴 Recording started');

      if (exportMode === 'arrangement') {
        // Schedule all clips (similar to ArrangementPlayback)
        arrangementClips.forEach(clip => {
          const pattern = patterns.find(p => p.id === clip.patternId);
          if (!pattern) return;

          const startTime = `${clip.startTime}:0:0`;

          if (pattern.type === 'drum' && pattern.pads && pattern.steps) {
            scheduleDrumPattern(pattern, startTime, clip.duration);
          } else if (pattern.type === 'piano' && pattern.midiNotes) {
            schedulePianoPattern(pattern, startTime);
          }
        });
      } else {
        // Export current pattern
        scheduleCurrentPattern();
      }

      setExportProgress(30);
      console.log('📅 All events scheduled');

      // Start transport
      Tone.getTransport().bpm.value = bpm;
      Tone.getTransport().start();
      console.log('▶️ Playback started for export');

      // Wait for playback to complete (with progress updates)
      const totalMs = (durationSeconds + 0.5) * 1000;
      const startTime = Date.now();

      await new Promise<void>(resolve => {
        const checkProgress = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(90, 30 + (elapsed / totalMs) * 60);
          setExportProgress(Math.round(progress));

          if (elapsed >= totalMs) {
            resolve();
          } else {
            setTimeout(checkProgress, 100);
          }
        };
        checkProgress();
      });

      // Stop recording
      const recording = await recorder.stop();
      Tone.getTransport().stop();
      Tone.getTransport().position = 0;
      setExportProgress(90);
      console.log('⏹️ Recording stopped');

      // Download the file
      const url = URL.createObjectURL(recording);
      const link = document.createElement('a');
      link.href = url;
      const filename = exportMode === 'arrangement'
        ? `beatshop-arrangement-${Date.now()}.${exportFormat}`
        : `beatshop-pattern${currentPatternIndex}-${Date.now()}.${exportFormat}`;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      setExportProgress(100);
      console.log(`✅ Export complete: ${filename}`);

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);

    } catch (error) {
      console.error('❌ Export error:', error);
      alert('Error exporting audio. Please try again.');
      setIsExporting(false);
    }
  };

  // Schedule the current pattern for export
  const scheduleCurrentPattern = () => {
    // Schedule drum steps (legacy pad system)
    steps.forEach((step) => {
      if (!step.active) return;

      const pad = pads[step.padIndex];
      if (!pad || !pad.sample || !pad.sample.url) return;

      const stepTime = step.stepIndex / 4; // Convert to beats
      const time = `0:${stepTime}:0`;

      Tone.getTransport().schedule((transportTime) => {
        const player = new Tone.Player(pad.sample!.url).toDestination();
        player.volume.value = Tone.gainToDb(step.velocity || 0.8);
        player.start(transportTime);
        console.log(`🥁 Drum step: Pad ${step.padIndex + 1} at beat ${stepTime.toFixed(2)}`);
      }, time);
    });

    // Schedule track-based steps
    tracks.forEach(track => {
      if (!track.steps) return;

      track.steps.forEach((step, stepIndex) => {
        if (!step.active) return;

        const stepTime = stepIndex / 4; // Convert to beats
        const time = `0:${stepTime}:0`;

        Tone.getTransport().schedule((transportTime) => {
          if (track.sampleUrl) {
            const player = new Tone.Player(track.sampleUrl).toDestination();
            player.volume.value = Tone.gainToDb(step.velocity || 0.8);
            player.start(transportTime);
            console.log(`🎵 Track step: ${track.name} at beat ${stepTime.toFixed(2)}`);
          }
        }, time);
      });
    });

    // Schedule MIDI notes
    midiNotes.forEach(note => {
      const noteStartBeats = note.startTime / 4; // Convert steps to beats
      const noteDurationBeats = note.duration / 4;
      const time = `0:${noteStartBeats}:0`;

      Tone.getTransport().schedule((transportTime) => {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(note.pitch / 12) - 1;
        const noteName = noteNames[note.pitch % 12] + octave;
        const duration = `0:${noteDurationBeats}:0`;

        const synth = new Tone.Synth().toDestination();
        synth.volume.value = Tone.gainToDb(note.velocity || 0.8);
        synth.triggerAttackRelease(noteName, duration, transportTime);
        console.log(`🎹 MIDI note: ${noteName} at beat ${noteStartBeats.toFixed(2)}`);
      }, time);
    });
  };

  const scheduleDrumPattern = (pattern: any, startTime: string, durationBars: number) => {
    const patternLengthBars = (pattern.patternLength || 16) / 16;
    const numRepeats = Math.ceil(durationBars / patternLengthBars);

    for (let repeat = 0; repeat < numRepeats; repeat++) {
      pattern.steps.forEach((step: any) => {
        if (!step.active) return;

        const pad = pattern.pads[step.padIndex];
        if (!pad || !pad.sample) return;

        const barOffset = repeat * patternLengthBars;
        const stepTime = step.stepIndex / 16;
        const totalTime = `${parseFloat(startTime.split(':')[0]) + barOffset + stepTime}:0:0`;

        Tone.getTransport().schedule((time) => {
          if (pad.sample.type === 'audio' && pad.sample.url) {
            const player = new Tone.Player(pad.sample.url).toDestination();
            player.volume.value = Tone.gainToDb(step.velocity || 0.8);
            player.start(time);
          }
        }, totalTime);
      });
    }
  };

  const schedulePianoPattern = (pattern: any, startTime: string) => {
    pattern.midiNotes.forEach((note: any) => {
      const noteStartBars = note.startTime / 16;
      const noteDurationBars = note.duration / 16;
      
      const totalTime = `${parseFloat(startTime.split(':')[0]) + noteStartBars}:0:0`;
      const noteDuration = `${noteDurationBars}:0:0`;

      Tone.getTransport().schedule((time) => {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(note.pitch / 12) - 1;
        const noteName = noteNames[note.pitch % 12] + octave;

        const synth = new Tone.Synth().toDestination();
        synth.volume.value = Tone.gainToDb(note.velocity || 0.8);
        synth.triggerAttackRelease(noteName, noteDuration, time);
      }, totalTime);
    });
  };

  const arrangementDurationBars = calculateArrangementDuration();
  const patternDurationBars = calculatePatternDuration();
  const durationBars = exportMode === 'arrangement' ? arrangementDurationBars : patternDurationBars;
  const beatsPerBar = 4;
  const durationSeconds = (durationBars * beatsPerBar) / (bpm / 60);
  const activeSteps = steps.filter(s => s.active).length;
  const trackSteps = tracks.reduce((sum, t) => sum + (t.steps?.filter(s => s.active).length || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl shadow-2xl border-2 border-gray-800/50 max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b-2 border-gray-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-200">Export Audio</h2>
            <p className="text-sm text-gray-400">Render your {exportMode} to audio file</p>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-all"
            >
              <X size={24} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Mode Toggle */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Export Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setExportMode('pattern')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                  exportMode === 'pattern'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                }`}
              >
                <Music size={16} />
                Pattern
              </button>
              <button
                onClick={() => setExportMode('arrangement')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                  exportMode === 'arrangement'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                }`}
              >
                <Layers size={16} />
                Arrangement
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <h3 className="font-bold text-gray-300 mb-2">
              {exportMode === 'arrangement' ? 'Arrangement Info' : `Pattern ${currentPatternIndex} Info`}
            </h3>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Duration: {durationBars} bars ({durationSeconds.toFixed(1)}s)</p>
              <p>BPM: {bpm}</p>
              {exportMode === 'arrangement' ? (
                <p>Clips: {arrangementClips.length}</p>
              ) : (
                <>
                  <p>Drum Steps: {activeSteps + trackSteps}</p>
                  <p>MIDI Notes: {midiNotes.length}</p>
                </>
              )}
            </div>
          </div>

          {!isExporting ? (
            <>
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Format</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExportFormat('wav')}
                    className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
                      exportFormat === 'wav'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                    }`}
                  >
                    WAV
                  </button>
                  <button
                    onClick={() => setExportFormat('mp3')}
                    className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${
                      exportFormat === 'mp3'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                    }`}
                  >
                    MP3
                  </button>
                </div>
              </div>

              {/* Quality Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Quality</label>
                <select
                  value={exportQuality}
                  onChange={(e) => setExportQuality(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="high">High (48kHz, 24-bit)</option>
                  <option value="medium">Medium (44.1kHz, 16-bit)</option>
                  <option value="low">Low (22kHz, 16-bit)</option>
                </select>
              </div>

              {/* Export Button */}
              <button
                onClick={exportAudio}
                disabled={
                  exportMode === 'arrangement'
                    ? arrangementClips.length === 0
                    : (activeSteps + trackSteps + midiNotes.length) === 0
                }
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-all"
              >
                <Download size={20} />
                Export {exportMode === 'arrangement' ? 'Arrangement' : 'Pattern'}
              </button>

              {exportMode === 'arrangement' && arrangementClips.length === 0 && (
                <p className="text-sm text-red-400 text-center">
                  Add clips to the arrangement before exporting
                </p>
              )}
              {exportMode === 'pattern' && (activeSteps + trackSteps + midiNotes.length) === 0 && (
                <p className="text-sm text-red-400 text-center">
                  Add steps or notes to the pattern before exporting
                </p>
              )}
            </>
          ) : (
            <>
              {/* Export Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Loader size={24} className="text-purple-500 animate-spin" />
                  <span className="text-gray-300 font-bold">Exporting...</span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>

                <p className="text-center text-sm text-gray-400">
                  {exportProgress}% complete
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioExport;

