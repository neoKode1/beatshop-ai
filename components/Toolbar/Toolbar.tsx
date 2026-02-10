'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { Play, Pause, Square, Circle, Drum, Music2, Volume2, Repeat, Layers, Clock, Keyboard, ChevronDown, AlertTriangle } from 'lucide-react';
import * as Tone from 'tone';

const Toolbar: React.FC = () => {
  const {
    bpm, setBpm,
    isPlaying, setIsPlaying,
    isRecording, setIsRecording,
    isCountingIn, setIsCountingIn,
    countInStep, setCountInStep,
    countInEnabled, setCountInEnabled,
    countInBars, setCountInBars,
    // Track system (new)
    tracks,
    triggerTrack,
    // Legacy pads (for backward compatibility)
    pads, steps,
    currentStep, setCurrentStep,
    triggerPad,
    padMode, setPadMode,
    metronomeEnabled, setMetronomeEnabled,
    metronomeVolume, setMetronomeVolume,
    swing, setSwing,
    numBars, setNumBars,
    patternLength, setPatternLength,
    timeSignature, setTimeSignature,
    numSteps,
    preferences,
    // FL Studio Recording Mode
    loopRecordingEnabled, toggleLoopRecording,
    blendRecording, toggleBlendRecording,
    extendPatternForRecording,
    disarmOnStop,
    waitForInput, toggleWaitForInput,
    // FL Studio Playback Mode
    playbackMode, togglePlaybackMode,
    // Tap Tempo
    tapTempo, resetTapTempo,
    // Panic Mode
    panicMode,
    // Recording Filter
    recordingFilter, setRecordingFilter,
    // Input Quantize
    inputQuantize, setInputQuantize,
    // Score Logger
    dumpScoreLogToPattern,
    // Snap Setting
    snapSetting, setSnapSetting,
  } = useBeatStore();

  // Recording filter menu state
  const [showRecordMenu, setShowRecordMenu] = useState(false);
  const [showCountInMenu, setShowCountInMenu] = useState(false);
  const recordMenuRef = useRef<HTMLDivElement>(null);
  const countInMenuRef = useRef<HTMLDivElement>(null);

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
    // FL Studio-style: when loopRecordingEnabled is OFF during recording, extend pattern at end
    const loop = new Tone.Sequence(
      (time, step) => {
        // Use Tone.Draw.schedule() for visual updates - this syncs the visual
        // with the audio output by accounting for the audio system's latency
        Tone.getDraw().schedule(() => {
          // Handle count-in (4 beats before recording starts)
          // Only count on quarter notes (every 4 steps)
          if (isCountingIn && step % 4 === 0) {
            const currentCountStep = countInStep;
            setCountInStep(currentCountStep + 1);

            // After 4 count-in beats (16 steps), start actual recording
            if (currentCountStep >= 3) {
              setIsCountingIn(false);
              setCountInStep(0);
              setCurrentStep(0); // Start from step 0
              console.log('🎙️ Recording started!');
            }
          } else if (!isCountingIn) {
            setCurrentStep(step);

            // FL Studio-style Pattern Extension:
            // If recording AND loop recording is OFF AND we're at the last step,
            // extend the pattern by 1 bar to allow continuous recording
            if (isRecording && !loopRecordingEnabled && step === numSteps - 1) {
              console.log('🔄 Approaching pattern end during recording - extending pattern...');
              extendPatternForRecording();
            }
          }
        }, time);

        // Metronome click - use the scheduled time for precise timing
        if (metronomeRef.current) {
          // Always play metronome during count-in (on quarter notes only)
          if (isCountingIn && step % 4 === 0) {
            const pitch = countInStep === 0 ? 'C6' : 'C5'; // Higher pitch on beat 1
            const volume = Tone.gainToDb(metronomeVolume * 1.5); // Louder during count-in
            metronomeRef.current.volume.value = volume;
            metronomeRef.current.triggerAttackRelease(pitch, '32n', time);
          } else if (metronomeEnabled && !isCountingIn) {
            // Normal metronome during playback
            // Metronome always clicks on beat 1 (step 0, 16, 32, etc.) with higher pitch
            if (step % 4 === 0) {
              // Calculate which beat in the bar (0-3 for 4/4)
              const beatInBar = Math.floor(step / 4) % 4;
              const pitch = beatInBar === 0 ? 'C6' : 'C5'; // Higher pitch on downbeat (beat 1)
              const volume = Tone.gainToDb(metronomeVolume);
              metronomeRef.current.volume.value = volume;
              metronomeRef.current.triggerAttackRelease(pitch, '32n', time);
            }
          }
        }

        // Only trigger steps if NOT counting in
        if (!isCountingIn) {
          // Use tracks if available, otherwise fall back to pads
          if (tracks.length > 0) {
            // TRACK SYSTEM: Trigger tracks
            tracks.forEach((track) => {
              // Skip muted tracks (solo is handled in triggerTrack)
              if (track.muted) return;

              if (track.type === 'drum') {
                // Drum track: check if step is active
                const trackStep = track.steps.find(s => s.stepIndex === step);
                if (trackStep?.active) {
                  triggerTrack(track.id, undefined, trackStep.velocity || 0.8, time);
                }
              } else if (track.type === 'instrument') {
                // Instrument track: check for MIDI notes at this time position
                // Convert step to time in 16th notes
                const currentTime = step;
                track.midiNotes.forEach(note => {
                  // Trigger note if it starts at this step
                  if (note.startTime === currentTime) {
                    triggerTrack(track.id, note.pitch, note.velocity, time);
                  }
                });
              }
            });
          } else {
            // LEGACY PAD SYSTEM: Trigger pads
            pads.forEach((pad, padIndex) => {
              const stepData = steps.find(s => s.padIndex === padIndex && s.stepIndex === step);
              // Check if step is active - triggerPad handles mute/solo logic
              if (stepData?.active) {
                // Pass the scheduled time to triggerPad for precise timing
                triggerPad(padIndex, stepData.velocity || 0.8, time);
              }
            });
          }
        }
      },
      Array.from({ length: numSteps }, (_, i) => i),
      '16n'
    );

    loop.start(0);

    return () => {
      loop.dispose();
    };
  }, [
    tracks,
    triggerTrack,
    pads,
    steps,
    triggerPad,
    metronomeEnabled,
    metronomeVolume,
    numSteps,
    isCountingIn,
    countInStep,
    setCurrentStep,
    setIsCountingIn,
    setCountInStep,
    // FL Studio recording mode dependencies
    isRecording,
    loopRecordingEnabled,
    extendPatternForRecording
  ]);

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
    // Reset transport position to 0 so next play/record starts from beginning
    Tone.getTransport().position = 0;
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsCountingIn(false);
      setCountInStep(0);
      console.log('⏹️ Recording stopped');
    } else {
      // Start count-in (1, 2, 3, 4 - then recording starts on beat 5)
      console.log('🎵 Count-in started: 1, 2, 3, 4...');
      setIsRecording(true);
      setIsCountingIn(true);
      setCountInStep(0);

      // Start playback if not already playing
      if (!isPlaying) {
        await Tone.start();
        if (Tone.getContext().state !== 'running') {
          await Tone.getContext().resume();
        }
        Tone.getTransport().start();
        setIsPlaying(true);
      }
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
            className={`w-9 h-9 flex items-center justify-center rounded-md transition-colors relative ${
              isRecording ? 'bg-red-600 animate-pulse text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            title="Record"
          >
            {isCountingIn ? (
              <span className="text-lg font-bold">{countInStep + 1}</span>
            ) : (
              <Circle size={18} fill={isRecording ? 'white' : 'none'} />
            )}
          </button>

          {/* Metronome Toggle */}
          <button
            onClick={() => setMetronomeEnabled(!metronomeEnabled)}
            className={`w-9 h-9 flex items-center justify-center rounded-md transition-colors ${
              metronomeEnabled ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            title={metronomeEnabled ? 'Metronome: ON' : 'Metronome: OFF'}
          >
            <Volume2 size={18} />
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

        {/* Pattern Length in Bars */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-400">Bars</label>
          <select
            value={numBars}
            onChange={(e) => setNumBars(parseInt(e.target.value))}
            className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm font-mono font-bold text-gray-200 cursor-pointer hover:bg-gray-700"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={13}>13</option>
            <option value={16}>16</option>
          </select>
        </div>

        {/* Time Signature */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-400">Time</label>
          <select
            value={timeSignature}
            onChange={(e) => setTimeSignature(e.target.value)}
            className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm font-mono font-bold text-gray-200 cursor-pointer hover:bg-gray-700"
          >
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            <option value="5/4">5/4</option>
            <option value="6/8">6/8</option>
            <option value="7/8">7/8</option>
            <option value="9/8">9/8</option>
            <option value="12/8">12/8</option>
          </select>
        </div>

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            showAdvanced ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
              className="w-20 h-1 accent-amber-500"
              min="0"
              max="1"
              step="0.01"
            />
            <span className="text-xs text-gray-500 font-mono w-8">{Math.round(swing * 100)}%</span>
          </div>

          {/* Loop Recording Toggle (FL Studio style) */}
          <button
            onClick={toggleLoopRecording}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              loopRecordingEnabled ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={loopRecordingEnabled
              ? 'Loop Recording: ON (recording loops at pattern end)'
              : 'Loop Recording: OFF (recording continues beyond pattern, auto-extends)'
            }
          >
            🔄 Loop Rec {loopRecordingEnabled ? '●' : '○'}
          </button>

          {/* Blend Recording Toggle (FL Studio Overdub) */}
          <button
            onClick={toggleBlendRecording}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              blendRecording ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={blendRecording
              ? 'Blend Recording: ON (new notes merge with existing - overdub)'
              : 'Blend Recording: OFF (new notes overwrite existing)'
            }
          >
            🎵 Blend {blendRecording ? '●' : '○'}
          </button>

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

