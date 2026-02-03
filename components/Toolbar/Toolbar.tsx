'use client';

import React, { useEffect, useRef } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { Play, Pause, Square, Circle, Drum, Music2, Volume2 } from 'lucide-react';
import * as Tone from 'tone';

const Toolbar: React.FC = () => {
  const {
    bpm, setBpm,
    isPlaying, setIsPlaying,
    isRecording, setIsRecording,
    pads, steps,
    currentStep, setCurrentStep,
    triggerPad,
    padMode, setPadMode,
    metronomeEnabled, setMetronomeEnabled,
    metronomeVolume, setMetronomeVolume,
    swing, setSwing,
    patternLength, setPatternLength,
    timeSignature, setTimeSignature,
    preferences
  } = useBeatStore();

  const metronomeRef = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    // Initialize Tone.js transport
    Tone.getTransport().bpm.value = bpm;

    // Initialize metronome synth
    if (!metronomeRef.current) {
      metronomeRef.current = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.05,
          sustain: 0,
          release: 0.05,
        },
      }).toDestination();
    }

    // Set up sequencer loop
    const loop = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step);

        // Metronome click
        if (metronomeEnabled && metronomeRef.current) {
          // Click on every quarter note (steps 0, 4, 8, 12)
          // Higher pitch on beat 1 (step 0)
          if (step % 4 === 0) {
            const pitch = step === 0 ? 'C6' : 'C5';
            const volume = Tone.gainToDb(metronomeVolume);
            metronomeRef.current.volume.value = volume;
            metronomeRef.current.triggerAttackRelease(pitch, '32n', time);
          }
        }

        // Trigger active steps
        pads.forEach((pad, padIndex) => {
          const stepData = steps.find(s => s.padIndex === padIndex && s.stepIndex === step);
          // Check if step is active AND pad has a sample (either synth or audio)
          if (stepData?.active && pad.sample && !pad.muted) {
            // Check if any pad is soloed
            const hasSolo = pads.some(p => p.solo);
            if (hasSolo && !pad.solo) return;

            // Trigger the pad using the store's triggerPad function
            triggerPad(padIndex, stepData.velocity || 0.8);
          }
        });
      },
      Array.from({ length: 16 }, (_, i) => i),
      '16n'
    );

    loop.start(0);

    return () => {
      loop.dispose();
    };
  }, [pads, steps, metronomeEnabled, metronomeVolume]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if keyboard shortcuts are enabled
      if (!preferences.keyboardEnabled) return;

      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Spacebar = Play/Pause
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preferences.keyboardEnabled, isPlaying]);

  const handlePlayPause = async () => {
    await Tone.start();

    if (isPlaying) {
      Tone.getTransport().pause();
      setIsPlaying(false);
    } else {
      Tone.getTransport().start();
      setIsPlaying(true);
    }
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    Tone.getTransport().bpm.value = newBpm;
  };

  const handleStop = () => {
    Tone.getTransport().stop();
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleRecord = () => {
    const recordingEngine = (window as any).recordingEngine;

    if (isRecording) {
      // Stop recording
      if (recordingEngine) {
        recordingEngine.stopRecording();
      } else {
        setIsRecording(false);
      }
    } else {
      // Start recording (will trigger count-in)
      setIsRecording(true);
    }
  };

  return (
    <div className="toolbar bg-gradient-to-b from-[#2A2A2A] to-[#252525] border-b-2 border-gray-900/50 px-6 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-6">
        {/* Transport Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all shadow-lg text-white"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={handleStop}
            className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 rounded-lg transition-all shadow-lg text-white"
            title="Stop"
          >
            <Square size={20} />
          </button>

          <button
            onClick={handleRecord}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all shadow-lg ${
              isRecording ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse text-white' : 'bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
            }`}
            title="Record"
          >
            <Circle size={20} fill={isRecording ? 'white' : 'none'} />
          </button>
        </div>

        {/* Metronome Controls */}
        <div className="flex items-center gap-3 border-l-2 border-gray-600/30 pl-6">
          <button
            onClick={() => setMetronomeEnabled(!metronomeEnabled)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all shadow-lg ${
              metronomeEnabled
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                : 'bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
            }`}
            title={metronomeEnabled ? 'Metronome On' : 'Metronome Off'}
          >
            <Volume2 size={20} />
          </button>

          {metronomeEnabled && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-400">Vol</label>
              <input
                type="range"
                value={metronomeVolume}
                onChange={(e) => setMetronomeVolume(parseFloat(e.target.value))}
                className="w-20 accent-blue-500"
                min="0"
                max="1"
                step="0.1"
              />
            </div>
          )}
        </div>

        {/* Pad Mode Selector */}
        <div className="flex items-center gap-2 border-l-2 border-gray-600/30 pl-6">
          <label className="text-sm font-bold text-gray-300">Mode</label>
          <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1 border border-gray-700/30">
            <button
              onClick={() => setPadMode('drum')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all font-semibold ${
                padMode === 'drum'
                  ? 'bg-gray-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
              title="Drum Kit Mode - Each pad plays a different sample"
            >
              <Drum size={16} />
              <span className="text-sm">Drum Kit</span>
            </button>
            <button
              onClick={() => setPadMode('chromatic')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all font-semibold ${
                padMode === 'chromatic'
                  ? 'bg-gray-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
              title="Chromatic Mode - One sample across all pads at different pitches"
            >
              <Music2 size={16} />
              <span className="text-sm">Chromatic</span>
            </button>
          </div>
        </div>

        {/* BPM Control */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-300">BPM</label>
          <input
            type="number"
            value={bpm}
            onChange={(e) => handleBpmChange(parseInt(e.target.value) || 120)}
            className="w-20 px-3 py-2 bg-gray-800 border-2 border-gray-700/50 rounded-lg text-center font-mono font-bold text-gray-200 shadow-inner"
            min="40"
            max="240"
          />
          <input
            type="range"
            value={bpm}
            onChange={(e) => handleBpmChange(parseInt(e.target.value))}
            className="w-32 accent-gray-500"
            min="40"
            max="240"
          />
        </div>

        {/* Pattern Length */}
        <div className="flex items-center gap-2 border-l-2 border-gray-600/30 pl-6">
          <label className="text-sm font-bold text-gray-300">Length</label>
          <select
            value={patternLength}
            onChange={(e) => setPatternLength(parseInt(e.target.value) as 16 | 32 | 64)}
            className="px-3 py-2 bg-gray-800 border-2 border-gray-700/50 rounded-lg font-mono text-sm font-bold text-gray-200 shadow-inner cursor-pointer hover:bg-gray-700 transition-colors"
          >
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={64}>64</option>
          </select>
        </div>

        {/* Swing Control */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-gray-300">Swing</label>
          <input
            type="range"
            value={swing}
            onChange={(e) => setSwing(parseFloat(e.target.value))}
            className="w-24 accent-purple-500"
            min="0"
            max="1"
            step="0.01"
          />
          <span className="text-xs text-gray-400 font-mono w-10">{Math.round(swing * 100)}%</span>
        </div>

        {/* Time Signature */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-gray-300">Time</label>
          <select
            value={timeSignature}
            onChange={(e) => setTimeSignature(e.target.value)}
            className="px-3 py-2 bg-gray-800 border-2 border-gray-700/50 rounded-lg font-mono text-sm font-bold text-gray-200 shadow-inner cursor-pointer hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            <option value="5/4">5/4</option>
            <option value="6/8">6/8</option>
            <option value="7/8">7/8</option>
            <option value="8/8">8/8</option>
            <option value="9/8">9/8</option>
            <option value="12/8">12/8</option>
            <option value="16/16">16/16</option>
          </select>
        </div>

        {/* Current Step Indicator */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm font-bold text-gray-300">Step</label>
          <div className="px-3 py-2 bg-gray-800 border-2 border-gray-700/50 rounded-lg font-mono text-sm min-w-[3rem] text-center font-bold text-gray-200 shadow-inner">
            {currentStep + 1}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;

