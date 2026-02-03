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
    numSteps,
    preferences
  } = useBeatStore();

  const metronomeRef = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    // Initialize Tone.js transport with optimized settings for lower latency
    Tone.getTransport().bpm.value = bpm;

    // Configure lookahead for better timing precision
    // Lower values = less latency but may cause glitches on slower devices
    Tone.getContext().lookAhead = 0.05; // 50ms lookahead (default is 0.1)

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

    // Set up sequencer loop - use numSteps for time signature support
    const loop = new Tone.Sequence(
      (time, step) => {
        // Use Tone.Draw.schedule() for visual updates - this syncs the visual
        // with the audio output by accounting for the audio system's latency
        Tone.getDraw().schedule(() => {
          setCurrentStep(step);
        }, time);

        // Metronome click - use the scheduled time for precise timing
        if (metronomeEnabled && metronomeRef.current) {
          // Click on every quarter note (steps 0, 4, 8, 12, etc.)
          // Higher pitch on beat 1 (step 0)
          if (step % 4 === 0) {
            const pitch = step === 0 ? 'C6' : 'C5';
            const volume = Tone.gainToDb(metronomeVolume);
            metronomeRef.current.volume.value = volume;
            metronomeRef.current.triggerAttackRelease(pitch, '32n', time);
          }
        }

        // Trigger active steps - pass the scheduled time for precise audio sync
        pads.forEach((pad, padIndex) => {
          const stepData = steps.find(s => s.padIndex === padIndex && s.stepIndex === step);
          // Check if step is active - triggerPad handles mute/solo logic
          if (stepData?.active) {
            // Pass the scheduled time to triggerPad for precise timing
            triggerPad(padIndex, stepData.velocity || 0.8, time);
          }
        });
      },
      Array.from({ length: numSteps }, (_, i) => i),
      '16n'
    );

    loop.start(0);

    return () => {
      loop.dispose();
    };
  }, [pads, steps, metronomeEnabled, metronomeVolume, numSteps]);

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
    // Start audio context if not already started
    await Tone.start();

    // Ensure audio context is running (handle browser autoplay policy)
    if (Tone.getContext().state !== 'running') {
      await Tone.getContext().resume();
    }

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

  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <div className="toolbar bg-gradient-to-b from-[#2A2A2A] to-[#252525] border-b border-gray-800/50 px-4 py-2.5 shadow-lg">
      <div className="flex items-center gap-4">
        {/* Transport Controls - Compact */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePlayPause}
            className="w-9 h-9 flex items-center justify-center bg-green-600 hover:bg-green-700 rounded-md transition-colors text-white"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            onClick={handleStop}
            className="w-9 h-9 flex items-center justify-center bg-gray-600 hover:bg-gray-700 rounded-md transition-colors text-white"
            title="Stop"
          >
            <Square size={18} />
          </button>

          <button
            onClick={handleRecord}
            className={`w-9 h-9 flex items-center justify-center rounded-md transition-colors ${
              isRecording ? 'bg-red-600 animate-pulse text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            title="Record"
          >
            <Circle size={18} fill={isRecording ? 'white' : 'none'} />
          </button>
        </div>

        {/* BPM Control - Compact */}
        <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
          <label className="text-xs font-semibold text-gray-400">BPM</label>
          <input
            type="number"
            value={bpm}
            onChange={(e) => handleBpmChange(parseInt(e.target.value) || 120)}
            className="w-16 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-center text-sm font-mono font-bold text-gray-200"
            min="40"
            max="240"
          />
        </div>

        {/* Pattern Length - Compact */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-400">Length</label>
          <select
            value={patternLength}
            onChange={(e) => setPatternLength(parseInt(e.target.value) as 16 | 32 | 64)}
            className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm font-mono font-bold text-gray-200 cursor-pointer hover:bg-gray-700"
          >
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={64}>64</option>
          </select>
        </div>

        {/* Time Signature - Compact */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-400">Time</label>
          <select
            value={timeSignature}
            onChange={(e) => setTimeSignature(e.target.value)}
            className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm font-mono font-bold text-gray-200 cursor-pointer hover:bg-gray-700"
          >
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            <option value="6/8">6/8</option>
            <option value="7/8">7/8</option>
          </select>
        </div>

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            showAdvanced ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Advanced Controls"
        >
          Advanced {showAdvanced ? '▲' : '▼'}
        </button>
      </div>

      {/* Advanced Controls - Collapsible */}
      {showAdvanced && (
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-800">
          {/* Metronome */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMetronomeEnabled(!metronomeEnabled)}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                metronomeEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
              title="Metronome"
            >
              <Volume2 size={16} />
            </button>
            {metronomeEnabled && (
              <input
                type="range"
                value={metronomeVolume}
                onChange={(e) => setMetronomeVolume(parseFloat(e.target.value))}
                className="w-16 h-1 accent-blue-500"
                min="0"
                max="1"
                step="0.1"
              />
            )}
          </div>

          {/* Swing */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-400">Swing</label>
            <input
              type="range"
              value={swing}
              onChange={(e) => setSwing(parseFloat(e.target.value))}
              className="w-20 h-1 accent-purple-500"
              min="0"
              max="1"
              step="0.01"
            />
            <span className="text-xs text-gray-500 font-mono w-8">{Math.round(swing * 100)}%</span>
          </div>

          {/* Pad Mode */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-400">Mode</label>
            <div className="flex gap-1">
              <button
                onClick={() => setPadMode('drum')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  padMode === 'drum' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                title="Drum Kit"
              >
                <Drum size={14} />
              </button>
              <button
                onClick={() => setPadMode('chromatic')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  padMode === 'chromatic' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                title="Chromatic"
              >
                <Music2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;

