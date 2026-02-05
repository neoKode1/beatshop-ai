'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { Play, Pause, Square, Circle, Volume2, Cpu, HardDrive, Timer, SkipBack, SkipForward } from 'lucide-react';
import * as Tone from 'tone';

// LCD Display Component - Classic FL Studio green LCD style
const LCDDisplay: React.FC<{
  value: string;
  label?: string;
  width?: string;
  onClick?: () => void;
}> = ({ value, label, width = 'auto', onClick }) => (
  <div
    className={`flex flex-col items-center ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    {label && <span className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</span>}
    <div
      className="bg-[#0a0f0a] border border-[#1a2a1a] rounded px-2 py-1 font-mono text-[#00ff00] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]"
      style={{ width, textShadow: '0 0 8px #00ff00' }}
    >
      {value}
    </div>
  </div>
);

// Pattern/Song Mode Toggle
const ModeToggle: React.FC<{
  mode: 'PAT' | 'SONG';
  onToggle: () => void;
}> = ({ mode, onToggle }) => (
  <button
    onClick={onToggle}
    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
      mode === 'SONG'
        ? 'bg-orange-500 text-white shadow-[0_0_8px_rgba(255,165,0,0.5)]'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    {mode}
  </button>
);

// Transport Button
const TransportButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  color?: 'green' | 'red' | 'gray' | 'blue';
  children: React.ReactNode;
  title?: string;
}> = ({ onClick, active, color = 'gray', children, title }) => {
  const colorClasses = {
    green: active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-green-600 hover:bg-green-500',
    red: active ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-gray-600 hover:bg-red-600',
    gray: 'bg-gray-600 hover:bg-gray-500',
    blue: active ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-600 hover:bg-blue-600',
  };

  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded transition-all text-white ${colorClasses[color]}`}
      title={title}
    >
      {children}
    </button>
  );
};

// Waveform Oscilloscope Display
const OscilloscopeDisplay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  const animationRef = useRef<number>(0);
  const { isPlaying } = useBeatStore();

  useEffect(() => {
    if (!analyzerRef.current) {
      analyzerRef.current = new Tone.Analyser('waveform', 128);
      Tone.getDestination().connect(analyzerRef.current);
    }

    const draw = () => {
      const canvas = canvasRef.current;
      const analyzer = analyzerRef.current;
      if (!canvas || !analyzer) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const values = analyzer.getValue() as Float32Array;

      ctx.fillStyle = '#0a0f0a';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 1;
      ctx.beginPath();

      const sliceWidth = width / values.length;
      let x = 0;

      for (let i = 0; i < values.length; i++) {
        const v = (values[i] + 1) / 2;
        const y = v * height;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) draw();
    else {
      // Draw flat line when not playing
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0a0f0a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
      }
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="bg-[#0a0f0a] border border-[#1a2a1a] rounded overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
      <canvas ref={canvasRef} width={100} height={28} />
    </div>
  );
};

// CPU/Memory Monitor
const SystemMonitor: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryMB, setMemoryMB] = useState(0);
  const [polyphony, setPolyphony] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulated values - in production would use actual measurements
      setCpuUsage(Math.floor(Math.random() * 15) + 5);
      setMemoryMB(Math.floor(Math.random() * 100) + 400);
      setPolyphony(Math.floor(Math.random() * 20) + 10);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-[10px] text-gray-400">
      <div className="flex items-center gap-1">
        <Cpu size={12} />
        <span className="font-mono text-green-400">{cpuUsage}%</span>
      </div>
      <div className="flex items-center gap-1">
        <HardDrive size={12} />
        <span className="font-mono text-green-400">{memoryMB}MB</span>
      </div>
      <div className="font-mono text-yellow-400">{polyphony}</div>
    </div>
  );
};

// Pattern Selector
const PatternSelector: React.FC<{
  currentPattern: number;
  totalPatterns: number;
  patternName: string;
  onPrev: () => void;
  onNext: () => void;
  onSelect: () => void;
}> = ({ currentPattern, totalPatterns, patternName, onPrev, onNext, onSelect }) => (
  <div className="flex items-center gap-1">
    <button
      onClick={onPrev}
      className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-300 text-xs"
    >
      ◀
    </button>
    <button
      onClick={onSelect}
      className="px-2 py-1 bg-[#0a0f0a] border border-[#1a2a1a] rounded font-mono text-[11px] text-[#00ff00] min-w-[80px] text-center hover:bg-[#0f1a0f]"
      style={{ textShadow: '0 0 5px #00ff00' }}
    >
      {patternName || `Pattern ${currentPattern}`}
    </button>
    <button
      onClick={onNext}
      className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-300 text-xs"
    >
      ▶
    </button>
  </div>
);

// Main FL Studio Toolbar Component
const FLToolbar: React.FC = () => {
  const {
    bpm, setBpm,
    isPlaying, setIsPlaying,
    isArmed, setIsArmed,
    isRecording, setIsRecording,
    isCountingIn, setIsCountingIn,
    countInStep, setCountInStep,
    countInEnabled, setCountInEnabled,
    countInBars, setCountInBars,
    tracks, triggerTrack,
    pads, steps,
    currentStep, setCurrentStep,
    triggerPad,
    metronomeEnabled, setMetronomeEnabled,
    metronomeVolume,
    swing, setSwing,
    numBars, setNumBars,
    snapSetting, setSnapSetting,
    numSteps,
    patterns,
    currentPatternId,
    currentPatternIndex,
    playbackMode,
    togglePlaybackMode,
    selectPattern,
    createNewPattern,
    preferences,
    // FL Studio Recording Features
    loopRecordingEnabled, toggleLoopRecording,
    blendRecording, toggleBlendRecording,
    waitForInput, toggleWaitForInput,
    recordingFilter, setRecordingFilter,
    inputQuantize, setInputQuantize,
    tapTempo,
    panicMode,
    dumpScoreLogToPattern,
    // Recording Session Actions
    cancelRecordingSession,
    recordingSession,
  } = useBeatStore();

  // Record menu state
  const [showRecordMenu, setShowRecordMenu] = useState(false);
  const recordMenuRef = useRef<HTMLDivElement>(null);
  const lastStopClickRef = useRef<number>(0);
  const [elapsedTime, setElapsedTime] = useState('0:00:00');
  const metronomeRef = useRef<Tone.Synth | null>(null);

  // Close record menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (recordMenuRef.current && !recordMenuRef.current.contains(e.target as Node)) {
        setShowRecordMenu(false);
      }
    };
    if (showRecordMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRecordMenu]);

  // Format time as M:SS:CS (minutes:seconds:centiseconds)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}:${cs.toString().padStart(2, '0')}`;
  };

  // Update elapsed time during playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      const startTime = Tone.now();
      interval = setInterval(() => {
        const elapsed = Tone.now() - startTime;
        setElapsedTime(formatTime(elapsed));
      }, 10);
    } else {
      setElapsedTime('0:00:00');
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Refs to track count-in state without causing loop recreation
  const isCountingInRef = useRef(isCountingIn);
  const countInStepRef = useRef(countInStep);
  const countInBarsRef = useRef(countInBars);
  const metronomeEnabledRef = useRef(metronomeEnabled);
  const metronomeVolumeRef = useRef(metronomeVolume);

  // Keep refs in sync with state
  useEffect(() => {
    isCountingInRef.current = isCountingIn;
  }, [isCountingIn]);

  useEffect(() => {
    countInStepRef.current = countInStep;
  }, [countInStep]);

  useEffect(() => {
    countInBarsRef.current = countInBars;
  }, [countInBars]);

  useEffect(() => {
    metronomeEnabledRef.current = metronomeEnabled;
  }, [metronomeEnabled]);

  useEffect(() => {
    metronomeVolumeRef.current = metronomeVolume;
  }, [metronomeVolume]);

  // Initialize metronome and sequencer - ONLY recreate when tracks/steps/numSteps change
  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
    Tone.getContext().lookAhead = 0.05;

    if (!metronomeRef.current) {
      metronomeRef.current = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
      }).toDestination();
    }

    const loop = new Tone.Sequence(
      (time, step) => {
        // Use refs to access current count-in state without causing loop recreation
        const currentIsCountingIn = isCountingInRef.current;
        const currentCountInStep = countInStepRef.current;
        const totalCountInBeats = countInBarsRef.current * 4;

        Tone.getDraw().schedule(() => {
          if (currentIsCountingIn && step % 4 === 0) {
            setCountInStep(currentCountInStep + 1);
            // Check if we've completed all count-in beats
            if (currentCountInStep >= totalCountInBeats - 1) {
              setIsCountingIn(false);
              setCountInStep(0);
              setCurrentStep(0);
            }
          } else if (!currentIsCountingIn) {
            setCurrentStep(step);
          }
        }, time);

        // Metronome - play during count-in OR during playback if enabled
        if (metronomeRef.current && step % 4 === 0) {
          const shouldPlayMetronome = currentIsCountingIn || metronomeEnabledRef.current;
          if (shouldPlayMetronome) {
            const pitch = step === 0 ? 'C6' : 'C5';
            metronomeRef.current.volume.value = Tone.gainToDb(metronomeVolumeRef.current);
            metronomeRef.current.triggerAttackRelease(pitch, '32n', time);
          }
        }

        // Trigger steps - only when NOT counting in
        if (!currentIsCountingIn) {
          if (tracks.length > 0) {
            tracks.forEach((track) => {
              if (track.muted) return;
              if (track.type === 'drum') {
                const trackStep = track.steps.find(s => s.stepIndex === step);
                if (trackStep?.active) {
                  // Check probability (default 100% if not set)
                  const probability = trackStep.probability ?? 100;
                  if (Math.random() * 100 >= probability) {
                    // Step skipped due to probability
                    return;
                  }

                  // Apply microtiming offset (convert ms to seconds)
                  const microTimingOffset = (trackStep.microTiming ?? 0) / 1000;
                  const triggerTime = time + microTimingOffset;

                  triggerTrack(track.id, undefined, trackStep.velocity || 0.8, triggerTime);
                }
              } else if (track.type === 'instrument') {
                track.midiNotes.forEach(note => {
                  if (note.startTime === step) {
                    triggerTrack(track.id, note.pitch, note.velocity, time);
                  }
                });
              }
            });
          } else {
            pads.forEach((pad, padIndex) => {
              const stepData = steps.find(s => s.padIndex === padIndex && s.stepIndex === step);
              if (stepData?.active) {
                // Check probability (default 100% if not set)
                const probability = stepData.probability ?? 100;
                if (Math.random() * 100 >= probability) {
                  // Step skipped due to probability
                  return;
                }

                // Apply microtiming offset (convert ms to seconds)
                const microTimingOffset = (stepData.microTiming ?? 0) / 1000;
                const triggerTime = time + microTimingOffset;

                triggerPad(padIndex, stepData.velocity || 0.8, triggerTime);
              }
            });
          }
        }
      },
      Array.from({ length: numSteps }, (_, i) => i),
      '16n'
    );

    loop.start(0);
    return () => loop.dispose();
  }, [tracks, triggerTrack, pads, steps, triggerPad, numSteps, bpm]);

  // Keyboard shortcuts (FL Studio style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!preferences.keyboardEnabled) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Space - Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      }

      // R - Toggle Record Arm
      if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleRecord();
      }

      // Ctrl+B - Toggle Blend Recording (Overdub)
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyB') {
        e.preventDefault();
        toggleBlendRecording();
      }

      // Ctrl+I - Toggle Wait for Input
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyI') {
        e.preventDefault();
        toggleWaitForInput();
      }

      // Ctrl+P - Toggle Count-in
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyP') {
        e.preventDefault();
        setCountInEnabled(!countInEnabled);
      }

      // Ctrl+M - Toggle Metronome
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyM') {
        e.preventDefault();
        setMetronomeEnabled(!metronomeEnabled);
      }

      // Escape - Cancel Recording (revert to pre-recording state)
      if (e.code === 'Escape' && isRecording) {
        e.preventDefault();
        // Call the recording engine's cancel function if available
        if ((window as any).recordingEngine?.cancelRecording) {
          (window as any).recordingEngine.cancelRecording();
        } else {
          // Fallback: use store's cancel function
          cancelRecordingSession();
          setIsRecording(false);
          setIsPlaying(false);
          setIsArmed(false);
          setIsCountingIn(false);
          setCountInStep(0);
        }
        console.log('🚫 Recording cancelled via Escape key');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preferences.keyboardEnabled, isPlaying, isRecording, countInEnabled, metronomeEnabled, cancelRecordingSession]);

  const handlePlayPause = async () => {
    await Tone.start();
    if (Tone.getContext().state !== 'running') await Tone.getContext().resume();
    if (isPlaying) {
      Tone.getTransport().pause();
      setIsPlaying(false);
      console.log('⏸️ PLAYBACK PAUSED');
    } else {
      // If armed for recording, start recording when play is pressed
      if (isArmed) {
        console.log('🔴 RECORDING ARMED - Starting recording...');
        setIsRecording(true);
        // Start count-in if enabled
        if (countInEnabled) {
          setIsCountingIn(true);
          setCountInStep(0);
          console.log('⏱️ Count-in enabled - waiting for count-in...');
        }
      }
      Tone.getTransport().start();
      setIsPlaying(true);
      console.log('▶️ PLAYBACK STARTED', { bpm, isArmed, countInEnabled });
    }
  };

  // Double-click Stop = Panic Mode (stop all sounds immediately)
  const handleStop = () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastStopClickRef.current;
    lastStopClickRef.current = now;

    if (timeSinceLastClick < 300) {
      // Double-click detected - PANIC MODE
      panicMode();
      console.log('🚨 PANIC MODE: All sounds stopped immediately!');
    } else {
      // Normal stop
      Tone.getTransport().stop();
      Tone.getTransport().position = 0;
      setIsPlaying(false);
      setIsRecording(false);
      setIsArmed(false);
      setIsCountingIn(false);
      setCountInStep(0);
      setCurrentStep(0);
      console.log('⏹️ PLAYBACK STOPPED - Transport reset to position 0');
    }
  };

  // handleRecord now only ARMS recording, doesn't start playback
  // Right-click opens recording filter menu
  const handleRecord = () => {
    if (isArmed || isRecording) {
      // Disarm or stop recording
      setIsArmed(false);
      setIsRecording(false);
      setIsCountingIn(false);
      setCountInStep(0);
      console.log('🔴 Recording DISARMED');
    } else {
      // ARM recording - will start when spacebar/play is pressed
      setIsArmed(true);
      console.log('🔴 Recording ARMED - Press Play or Spacebar to start recording', {
        blendMode: blendRecording,
        countIn: countInEnabled,
        loopRecording: loopRecordingEnabled,
        waitForInput,
      });
    }
  };

  const handleRecordRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowRecordMenu(!showRecordMenu);
  };

  // Tap Tempo - click BPM multiple times to set tempo
  const handleTapTempo = () => {
    tapTempo();
  };

  const handleBpmChange = (newBpm: number) => {
    const clampedBpm = Math.max(20, Math.min(999, newBpm));
    setBpm(clampedBpm);
    Tone.getTransport().bpm.value = clampedBpm;
  };

  return (
    <div className="fl-toolbar bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-b border-[#0a0a0a] px-3 py-2 shadow-lg">
      <div className="flex items-center gap-3">
        {/* PAT/SONG Mode Toggle */}
        <ModeToggle mode={playbackMode} onToggle={togglePlaybackMode} />

        {/* Transport Controls */}
        <div className="flex items-center gap-1 border-l border-gray-700 pl-3">
          {/* Skip to Start */}
          <TransportButton
            onClick={() => setCurrentStep(0)}
            color="gray"
            title="Skip to Start"
          >
            <SkipBack size={14} />
          </TransportButton>
          <TransportButton onClick={handlePlayPause} active={isPlaying} color="green" title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </TransportButton>
          <TransportButton onClick={handleStop} color="gray" title="Stop (Double-click for Panic Mode)">
            <Square size={14} />
          </TransportButton>
          {/* Skip to End */}
          <TransportButton
            onClick={() => setCurrentStep(numSteps - 1)}
            color="gray"
            title="Skip to End"
          >
            <SkipForward size={14} />
          </TransportButton>

          {/* Record Button with Right-click Menu */}
          <div className="relative" ref={recordMenuRef}>
            <button
              onClick={handleRecord}
              onContextMenu={handleRecordRightClick}
              className={`w-8 h-8 flex items-center justify-center rounded transition-all text-white ${
                isArmed || isRecording
                  ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : 'bg-gray-600 hover:bg-red-600'
              }`}
              title={isArmed ? 'Armed - Press Play/Space to record (Right-click: Options)' : isRecording ? 'Recording' : 'Arm Recording (Right-click: Options)'}
            >
              {isCountingIn ? (
                <span className="text-sm font-bold">{countInStep + 1}</span>
              ) : (
                <Circle
                  size={14}
                  fill={isRecording ? 'white' : 'none'}
                  className={isArmed && !isRecording ? 'animate-pulse' : ''}
                />
              )}
            </button>

            {/* Recording Filter Menu (Right-click) */}
            {showRecordMenu && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-xl z-50 min-w-[180px] py-1">
                <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700">Recording Filter</div>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={recordingFilter.notes} onChange={(e) => setRecordingFilter({ notes: e.target.checked })} className="accent-orange-500" />
                  <span className="text-xs text-gray-200">Notes</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={recordingFilter.automation} onChange={(e) => setRecordingFilter({ automation: e.target.checked })} className="accent-orange-500" />
                  <span className="text-xs text-gray-200">Automation</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={recordingFilter.audio} onChange={(e) => setRecordingFilter({ audio: e.target.checked })} className="accent-orange-500" />
                  <span className="text-xs text-gray-200">Audio</span>
                </label>

                <div className="border-t border-gray-700 my-1" />
                <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider">Input Quantize</div>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={inputQuantize.noteStartTime} onChange={(e) => setInputQuantize({ noteStartTime: e.target.checked })} className="accent-blue-500" />
                  <span className="text-xs text-gray-200">Note start time</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={inputQuantize.noteEndTime} onChange={(e) => setInputQuantize({ noteEndTime: e.target.checked })} className="accent-blue-500" />
                  <span className="text-xs text-gray-200">Note end time</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={inputQuantize.leaveDuration} onChange={(e) => setInputQuantize({ leaveDuration: e.target.checked })} className="accent-blue-500" />
                  <span className="text-xs text-gray-200">Leave note duration</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={inputQuantize.recordToStepSequencer} onChange={(e) => setInputQuantize({ recordToStepSequencer: e.target.checked })} className="accent-blue-500" />
                  <span className="text-xs text-gray-200">Record to step seq</span>
                </label>

                <div className="border-t border-gray-700 my-1" />
                <button
                  onClick={() => { dumpScoreLogToPattern(); setShowRecordMenu(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs text-gray-200 hover:bg-gray-700"
                >
                  📝 Dump score log to pattern
                </button>
              </div>
            )}
          </div>

          <TransportButton onClick={() => setMetronomeEnabled(!metronomeEnabled)} active={metronomeEnabled} color="blue" title="Metronome">
            <Volume2 size={14} />
          </TransportButton>

          {/* FL Studio Recording Mode Buttons */}
          <div className="flex items-center gap-0.5 ml-1 border-l border-gray-700 pl-2">
            {/* Loop Recording */}
            <button
              onClick={toggleLoopRecording}
              className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-all ${
                loopRecordingEnabled
                  ? 'bg-orange-500 text-white shadow-[0_0_6px_rgba(249,115,22,0.5)]'
                  : 'bg-gray-600 text-gray-400 hover:bg-gray-500'
              }`}
              title={loopRecordingEnabled ? 'Loop Recording ON (pattern loops)' : 'Loop Recording OFF (pattern extends)'}
            >
              🔄
            </button>

            {/* Blend/Overdub Recording */}
            <button
              onClick={toggleBlendRecording}
              className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-all ${
                blendRecording
                  ? 'bg-purple-500 text-white shadow-[0_0_6px_rgba(168,85,247,0.5)]'
                  : 'bg-gray-600 text-gray-400 hover:bg-gray-500'
              }`}
              title={blendRecording ? 'Blend ON (overdub mode)' : 'Blend OFF (overwrite mode)'}
            >
              🎵
            </button>

            {/* Wait for Input */}
            <button
              onClick={toggleWaitForInput}
              className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-all ${
                waitForInput
                  ? 'bg-cyan-500 text-white shadow-[0_0_6px_rgba(6,182,212,0.5)]'
                  : 'bg-gray-600 text-gray-400 hover:bg-gray-500'
              }`}
              title={waitForInput ? 'Wait for Input ON (recording starts on MIDI input)' : 'Wait for Input OFF'}
            >
              ⏸
            </button>
          </div>

          {/* Count-in Button with dropdown */}
          <div className="relative group">
            <button
              onClick={() => setCountInEnabled(!countInEnabled)}
              onContextMenu={(e) => {
                e.preventDefault();
                // Show context menu handled by CSS
              }}
              className={`w-8 h-8 flex items-center justify-center rounded transition-all text-white ${
                countInEnabled
                  ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'
                  : 'bg-gray-600 hover:bg-orange-600'
              }`}
              title={`Count-in (${countInBars} bar${countInBars > 1 ? 's' : ''}) - Right-click for options`}
            >
              <Timer size={14} />
            </button>
            {/* Right-click dropdown menu */}
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-0 group-hover:invisible z-50 min-w-[100px]"
              style={{ display: 'none' }}
            >
              {[1, 2, 4].map(bars => (
                <button
                  key={bars}
                  onClick={() => setCountInBars(bars)}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-700 ${
                    countInBars === bars ? 'text-orange-400' : 'text-gray-300'
                  }`}
                >
                  {bars} Bar{bars > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Count-in bars selector (compact) */}
          <select
            value={countInBars}
            onChange={(e) => setCountInBars(parseInt(e.target.value))}
            className="w-12 h-8 bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 text-center cursor-pointer"
            title="Count-in bars"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </div>

        {/* Tempo LCD Display with Tap Tempo */}
        <div className="border-l border-gray-700 pl-3">
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={bpm}
              onChange={(e) => handleBpmChange(parseInt(e.target.value) || 120)}
              className="w-20 bg-[#0a0f0a] border border-[#1a2a1a] rounded px-2 py-1 font-mono text-xl text-[#00ff00] text-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]"
              style={{ textShadow: '0 0 8px #00ff00' }}
              min="20"
              max="999"
            />
            <span className="text-[10px] text-gray-500">BPM</span>
            {/* Tap Tempo Button */}
            <button
              onClick={handleTapTempo}
              className="ml-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 active:bg-orange-500 rounded text-[10px] text-gray-300 hover:text-white font-medium transition-all"
              title="Tap Tempo - Click repeatedly to set BPM"
            >
              TAP
            </button>
          </div>
        </div>

        {/* Snap Settings (FL Studio style) & Bars */}
        <div className="flex items-center gap-2 border-l border-gray-700 pl-3">
          <select
            value={snapSetting}
            onChange={(e) => setSnapSetting(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-1.5 py-1 text-xs text-gray-200 cursor-pointer"
            title="Snap Settings"
          >
            <optgroup label="Grid">
              <option value="line">Line</option>
              <option value="cell">Cell</option>
              <option value="none">(none)</option>
            </optgroup>
            <optgroup label="Step">
              <option value="1/6 step">1/6 Step</option>
              <option value="1/4 step">1/4 Step</option>
              <option value="1/3 step">1/3 Step</option>
              <option value="1/2 step">1/2 Step</option>
              <option value="step">Step</option>
            </optgroup>
            <optgroup label="Beat">
              <option value="1/6 beat">1/6 Beat</option>
              <option value="1/4 beat">1/4 Beat</option>
              <option value="1/3 beat">1/3 Beat</option>
              <option value="1/2 beat">1/2 Beat</option>
              <option value="beat">Beat</option>
            </optgroup>
            <optgroup label="Bar">
              <option value="bar">Bar</option>
            </optgroup>
          </select>
          <select
            value={numBars}
            onChange={(e) => setNumBars(parseInt(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded px-1.5 py-1 text-xs text-gray-200 cursor-pointer"
          >
            {[1, 2, 4, 8, 16].map(n => <option key={n} value={n}>{n} Bar{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>

        {/* Time Display */}
        <LCDDisplay value={elapsedTime} width="85px" />

        {/* Oscilloscope */}
        <OscilloscopeDisplay />

        {/* Pattern Selector */}
        <div className="border-l border-gray-700 pl-3">
          <PatternSelector
            currentPattern={currentPatternIndex}
            totalPatterns={Math.max(patterns.length, 1)}
            patternName={patterns.find(p => p.id === currentPatternId)?.name || `Pattern ${currentPatternIndex}`}
            onPrev={() => {
              if (currentPatternIndex > 1) {
                selectPattern(currentPatternIndex - 1);
              }
            }}
            onNext={() => {
              if (currentPatternIndex < patterns.length) {
                selectPattern(currentPatternIndex + 1);
              } else {
                // Create new pattern when navigating past last pattern
                createNewPattern();
              }
            }}
            onSelect={() => {
              // Could open a pattern picker modal
            }}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* System Monitor */}
        <SystemMonitor />
      </div>
    </div>
  );
};

export default FLToolbar;

