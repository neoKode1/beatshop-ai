'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { Play, Pause, Square, Circle, Volume2, Cpu, HardDrive, Timer, SkipBack, SkipForward, Keyboard } from 'lucide-react';
import * as Tone from 'tone';

// LCD Display Component - FL Studio green LCD panel
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
    {label && <span className="text-[9px] text-[var(--fl-text-dim)] uppercase tracking-wider mb-0.5">{label}</span>}
    <div
      className="bg-[var(--fl-lcd-bg)] border border-[var(--fl-lcd-border)] rounded-sm px-2 py-0.5 font-mono text-sm text-[var(--fl-lcd-text)] shadow-[inset_0_1px_4px_rgba(0,0,0,0.9)]"
      style={{ width, textShadow: '0 0 6px var(--fl-lcd-text)' }}
    >
      {value}
    </div>
  </div>
);

// Pattern/Song Mode Toggle - FL Studio split scope style
const ModeToggle: React.FC<{
  mode: 'PAT' | 'SONG';
  onToggle: () => void;
}> = ({ mode, onToggle }) => (
  <div className="flex flex-col h-[30px] rounded-l-[10px] overflow-hidden shadow-[inset_0_0_0_1px_#00000090] cursor-pointer select-none" onClick={onToggle}>
    <div
      className={`h-[15px] px-2.5 flex items-center text-[10px] font-bold tracking-wide transition-all duration-300 ${
        mode === 'PAT'
          ? 'bg-white/75 text-[#501300] shadow-[inset_0_0_11px_var(--fl-accent-orange)] rounded-tl-[10px]'
          : 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[#000000b0] text-[var(--fl-text-dim)]'
      }`}
    >
      PAT
    </div>
    <div
      className={`h-[15px] px-2.5 flex items-center text-[10px] font-bold tracking-wide transition-all duration-300 ${
        mode === 'SONG'
          ? 'bg-white/75 text-[#003513] shadow-[inset_0_0_11px_#4ef708] rounded-bl-[10px]'
          : 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[#000000b0] text-[var(--fl-text-dim)]'
      }`}
    >
      SONG
    </div>
  </div>
);

// Transport Button - FL Studio gradient style
const TransportButton: React.FC<{
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  active?: boolean;
  color?: 'green' | 'red' | 'gray' | 'blue';
  children: React.ReactNode;
  title?: string;
  className?: string;
}> = ({ onClick, onContextMenu, active, color = 'gray', children, title, className = '' }) => {
  const baseStyle = 'w-[30px] h-[30px] flex items-center justify-center transition-all duration-300 text-[#e1e1e5] shadow-[inset_0_0_0_0.5px_#00000090]';
  const gradientBg = 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[#000000b0]';

  const colorClasses = {
    green: active
      ? `${baseStyle} bg-gradient-to-b from-green-400 to-green-600 text-white shadow-[inset_0_0_8px_rgba(34,197,94,0.6),0_0_6px_rgba(34,197,94,0.3)]`
      : `${baseStyle} ${gradientBg} hover:text-green-300`,
    red: active
      ? `${baseStyle} bg-gradient-to-b from-red-400 to-red-600 text-white animate-pulse shadow-[inset_0_0_8px_rgba(239,68,68,0.6),0_0_6px_rgba(239,68,68,0.3)]`
      : `${baseStyle} ${gradientBg} hover:text-red-300`,
    gray: `${baseStyle} ${gradientBg} hover:text-white`,
    blue: active
      ? `${baseStyle} bg-gradient-to-b from-blue-400 to-blue-600 text-white shadow-[inset_0_0_8px_rgba(59,130,246,0.6),0_0_6px_rgba(59,130,246,0.3)]`
      : `${baseStyle} ${gradientBg} hover:text-blue-300`,
  };

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`${colorClasses[color]} ${className}`}
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
    <div className="bg-[var(--fl-panel-darker)] border border-[var(--fl-panel-border)] rounded-sm overflow-hidden shadow-[inset_0_1px_4px_rgba(0,0,0,0.9)]">
      <canvas ref={canvasRef} width={100} height={28} />
    </div>
  );
};

// CPU/Memory Monitor - FL Studio compact style
const SystemMonitor: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryMB, setMemoryMB] = useState(0);
  const [polyphony, setPolyphony] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 15) + 5);
      setMemoryMB(Math.floor(Math.random() * 100) + 400);
      setPolyphony(Math.floor(Math.random() * 20) + 10);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-[var(--fl-text-secondary)] bg-[var(--fl-panel-darker)] border border-[var(--fl-panel-border)] rounded-sm px-2 py-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-0.5">
        <Cpu size={10} className="text-[var(--fl-text-dim)]" />
        <span className="font-mono text-[var(--fl-accent-green)]">{cpuUsage}%</span>
      </div>
      <div className="w-px h-3 bg-[var(--fl-panel-border-light)]" />
      <div className="flex items-center gap-0.5">
        <HardDrive size={10} className="text-[var(--fl-text-dim)]" />
        <span className="font-mono text-[var(--fl-accent-green)]">{memoryMB}MB</span>
      </div>
      <div className="w-px h-3 bg-[var(--fl-panel-border-light)]" />
      <div className="font-mono text-[var(--fl-accent-amber)]">{polyphony}v</div>
    </div>
  );
};

// Pattern Selector - FL Studio style with light-bg pill
const PatternSelector: React.FC<{
  currentPattern: number;
  totalPatterns: number;
  patternName: string;
  onPrev: () => void;
  onNext: () => void;
  onSelect: () => void;
}> = ({ currentPattern, patternName, onPrev, onNext, onSelect }) => (
  <div className="flex items-center gap-0">
    <button
      onClick={onPrev}
      className="w-5 h-[22px] flex items-center justify-center bg-gradient-to-b from-[var(--fl-panel-medium)] to-[#000000b0] shadow-[inset_0_0_0_0.5px_#00000090] text-[var(--fl-text-dim)] text-[9px] hover:text-white transition-colors"
    >
      ◀
    </button>
    <button
      onClick={onSelect}
      className="px-3 py-0.5 bg-[#c0cdd4] border-x border-[#00000030] font-bold text-[11px] text-[#1a1a1a] min-w-[90px] text-center hover:bg-[#d0dde4] transition-colors shadow-[inset_0_1px_0_#ffffff40,inset_0_-1px_2px_#00000020]"
    >
      {patternName || `Pattern ${currentPattern}`}
    </button>
    <button
      onClick={onNext}
      className="w-5 h-[22px] flex items-center justify-center bg-gradient-to-b from-[var(--fl-panel-medium)] to-[#000000b0] shadow-[inset_0_0_0_0.5px_#00000090] text-[var(--fl-text-dim)] text-[9px] hover:text-white transition-colors"
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
    setRecordingDownbeatTime,
    isCountingIn, setIsCountingIn,
    countInStep, setCountInStep,
    countInEnabled, setCountInEnabled,
    countInBars, setCountInBars,
    tracks, triggerTrack,
    pads, steps,
    setCurrentStep,
    triggerPad,
    metronomeEnabled, setMetronomeEnabled,
    metronomeVolume,
    numBars, setNumBars,
    snapSetting, setSnapSetting,
    numSteps,
    timeSignature,
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
    recordingStartsPlayback, setRecordingStartsPlayback,
    disarmOnStop, setDisarmOnStop,
    inputQuantize, setInputQuantize,
    tapTempo,
    panicMode,
    dumpScoreLogToPattern,
    // FL Studio Transport - Remember Seek Time
    rememberSeekTime, setRememberSeekTime,
    seekPosition,
    // Recording Session Actions
    cancelRecordingSession,
    // Undo/Redo
    undo,
    redo,
    // Typing Keyboard to Piano (Ctrl+T)
    typingKeyboardEnabled,
    toggleTypingKeyboardEnabled,
  } = useBeatStore();

  // Derive beatsPerMeasure from timeSignature (e.g., '4/4' → 4, '3/4' → 3, '6/8' → 6)
  const beatsPerMeasure = parseInt(timeSignature.split('/')[0], 10) || 4;

  // Record menu state
  const [showRecordMenu, setShowRecordMenu] = useState(false);
  const [showStopMenu, setShowStopMenu] = useState(false);
  const recordMenuRef = useRef<HTMLDivElement>(null);
  const stopMenuRef = useRef<HTMLDivElement>(null);
  const lastStopClickRef = useRef<number>(0);
  const [elapsedTime, setElapsedTime] = useState('0:00:00');
  const metronomeRef = useRef<Tone.Synth | null>(null);

  // Close record/stop menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (recordMenuRef.current && !recordMenuRef.current.contains(e.target as Node)) {
        setShowRecordMenu(false);
      }
      if (stopMenuRef.current && !stopMenuRef.current.contains(e.target as Node)) {
        setShowStopMenu(false);
      }
    };
    if (showRecordMenu || showStopMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRecordMenu, showStopMenu]);

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

  // ============================================================
  // "TALE OF TWO CLOCKS" SCHEDULER — Gold Standard (Chris Wilson)
  // ============================================================
  // Clock 1: JavaScript setTimeout (25ms interval) — coarse scheduling callbacks
  // Clock 2: AudioContext.currentTime — sample-accurate event timing
  // Clock 3: requestAnimationFrame — visual sync (cursor, count-in display)
  //
  // The JS thread schedules audio events AHEAD of time into the audio thread.
  // Even if the main thread stalls (layout, GC, etc.), audio keeps playing
  // at exactly the right times because events are pre-scheduled.
  // ============================================================

  // --- Scheduler tuning constants ---
  const SCHEDULE_AHEAD_TIME = 0.1;  // How far ahead to schedule audio (seconds)
  const SCHEDULER_INTERVAL = 25;     // How often to call scheduler (ms)

  // --- Refs for volatile React state (read inside scheduler without re-renders) ---
  const isCountingInRef = useRef(isCountingIn);
  const metronomeEnabledRef = useRef(metronomeEnabled);
  const metronomeVolumeRef = useRef(metronomeVolume);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const tracksRef = useRef(tracks);
  const padsRef = useRef(pads);
  const stepsRef = useRef(steps);
  const triggerPadRef = useRef(triggerPad);
  const triggerTrackRef = useRef(triggerTrack);
  const numStepsRef = useRef(numSteps);
  const numBarsRef = useRef(numBars);
  const bpmRef = useRef(bpm);

  // --- Count-in state (lives outside timeline) ---
  const countInBeatRef = useRef(0);
  const totalCountInBeatsRef = useRef(countInBars * beatsPerMeasure);

  // --- Two-clock scheduler state ---
  const nextNoteTimeRef = useRef(0);        // When the next 16th note is due (audio clock)
  const current16thNoteRef = useRef(0);     // Which 16th note we're on (0..totalSteps-1)
  const schedulerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isSchedulerRunningRef = useRef(false);
  // Queue of scheduled notes for visual sync: { step, time, isCountIn, countInBeat }
  const notesInQueueRef = useRef<Array<{
    step: number;
    time: number;
    isCountIn: boolean;
    countInBeat: number;
  }>>([]);

  // Keep refs in sync with React state
  useEffect(() => {
    isCountingInRef.current = isCountingIn;
    // NOTE: Do NOT reset countInBeatRef here — the useEffect fires AFTER React re-renders,
    // by which time the scheduler has already incremented the counter. Resetting it here
    // causes beat 0 to fire twice, making the count-in display skip/double numbers.
    // The ref is correctly initialized in handlePlayStop (line ~892) BEFORE the scheduler starts.
  }, [isCountingIn]);
  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure;
    totalCountInBeatsRef.current = countInBars * beatsPerMeasure;
  }, [beatsPerMeasure, countInBars]);
  useEffect(() => { metronomeEnabledRef.current = metronomeEnabled; }, [metronomeEnabled]);
  useEffect(() => { metronomeVolumeRef.current = metronomeVolume; }, [metronomeVolume]);
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { padsRef.current = pads; }, [pads]);
  useEffect(() => { stepsRef.current = steps; }, [steps]);
  useEffect(() => { triggerPadRef.current = triggerPad; }, [triggerPad]);
  useEffect(() => { triggerTrackRef.current = triggerTrack; }, [triggerTrack]);
  useEffect(() => { numStepsRef.current = numSteps; }, [numSteps]);
  useEffect(() => { numBarsRef.current = numBars; }, [numBars]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  // ============================================================
  // "TALE OF TWO CLOCKS" SEQUENCER (Chris Wilson / Web Audio gold standard)
  // ============================================================
  // Architecture:
  //   Clock 1 — setTimeout every 25ms: checks what notes are "coming up soon"
  //   Clock 2 — AudioContext.currentTime: schedules audio with sample accuracy
  //   Clock 3 — requestAnimationFrame: syncs visuals to the audio clock
  //
  //   IDLE → user hits play → scheduler starts → notes pre-scheduled into audio thread
  //   COUNT_IN → metronome clicks only → RECORDING/PLAYBACK → full pattern triggers
  //
  // Even if the main thread stalls (GC, layout, React re-render), audio keeps
  // playing because events are pre-scheduled 100ms ahead into the audio thread.
  // ============================================================

  // Initialize metronome synth once
  useEffect(() => {
    if (!metronomeRef.current) {
      metronomeRef.current = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
      }).toDestination();
    }
  }, []);

  // --- scheduleNote: schedule audio events for a single 16th note ---
  const scheduleNote = useCallback((stepIndex: number, time: number) => {
    const isOnBeat = stepIndex % 4 === 0;
    const currentIsCountingIn = isCountingInRef.current;
    const bpm_ = beatsPerMeasureRef.current;
    const totalBeats = totalCountInBeatsRef.current;

    // ── NEGATIVE STEPS (COUNT-IN PHASE) ──────────────────────────────────────
    if (stepIndex < 0) {
      // We're in count-in - only play metronome on beats
      if (isOnBeat) {
        const beat = countInBeatRef.current;
        notesInQueueRef.current.push({
          step: stepIndex,
          time,
          isCountIn: true,
          countInBeat: beat,
        });

        if (beat < totalBeats) {
          // Play metronome click with accent on downbeat
          const beatInMeasure = beat % bpm_;
          const isDownbeat = beatInMeasure === 0;
          if (metronomeRef.current) {
            const pitch = isDownbeat ? 'C6' : 'C5';
            metronomeRef.current.volume.value = Tone.gainToDb(metronomeVolumeRef.current);
            metronomeRef.current.triggerAttackRelease(pitch, '32n', time);
          }
          console.log(`⏱️ Count-in beat: ${beat + 1}/${totalBeats} (accent=${beatInMeasure === 0})`);
          countInBeatRef.current = beat + 1;

          // Last count-in beat? Transition to recording on next note
          if (beat + 1 >= totalBeats) {
            console.log('🎬 Count-in complete — next note is the downbeat (step 0)');
            isCountingInRef.current = false;
            countInBeatRef.current = 0;

            // Store the downbeat time for recording sync
            const secondsPerBeat = 60.0 / bpmRef.current;
            const secondsPer16th = secondsPerBeat / 4;
            const downbeatTime = nextNoteTimeRef.current + secondsPer16th;
            setRecordingDownbeatTime(downbeatTime);
            console.log(`📍 Downbeat scheduled at: ${downbeatTime.toFixed(3)}s`);

            // Update the Zustand store IMMEDIATELY so RecordingEngine can accept
            // notes on the downbeat without waiting for visualSync → React render.
            // RecordingEngine reads useBeatStore.getState().isCountingIn directly.
            setIsCountingIn(false);

            // Push explicit "count-in complete" marker (countInBeat = -1)
            // so visualSync can dismiss the overlay and reset the cursor.
            // IMPORTANT: Use time + a tiny offset so the sentinel is processed in the NEXT
            // rAF frame, giving React one frame to render the last beat number before
            // the overlay is dismissed. Without this, React batches setCountInStep(lastBeat)
            // with setCountInStep(0) from the sentinel, and the user never sees the last beat.
            notesInQueueRef.current.push({
              step: stepIndex,
              time: time + 0.02, // 20ms after last beat — enough for one rAF frame
              isCountIn: true,
              countInBeat: -1, // Sentinel: count-in is done
            });
          }
        }
      } else {
        // Non-beat 16th during count-in: push silent marker for visual sync
        notesInQueueRef.current.push({
          step: stepIndex,
          time,
          isCountIn: true,
          countInBeat: countInBeatRef.current,
        });
      }
      return; // Don't trigger pattern during count-in
    }

    // ── LEGACY COUNT-IN PHASE (for compatibility) ──────────────────────────────────────
    if (currentIsCountingIn) {
      // Push to visual queue (for rAF sync)
      if (isOnBeat) {
        const beat = countInBeatRef.current;
        notesInQueueRef.current.push({
          step: stepIndex,
          time,
          isCountIn: true,
          countInBeat: beat,
        });

        if (beat < totalBeats) {
          // Play metronome click with accent on downbeat
          const beatInMeasure = beat % bpm_;
          const isDownbeat = beatInMeasure === 0;
          if (metronomeRef.current) {
            const pitch = isDownbeat ? 'C6' : 'C5';
            metronomeRef.current.volume.value = Tone.gainToDb(metronomeVolumeRef.current);
            metronomeRef.current.triggerAttackRelease(pitch, '32n', time);
          }
          console.log(`⏱️ Count-in beat: ${beat + 1}/${totalBeats} (accent=${beatInMeasure === 0})`);
          countInBeatRef.current = beat + 1;

          // Last count-in beat? Transition to recording on next note
          if (beat + 1 >= totalBeats) {
            console.log('🎬 Count-in complete — next note is the downbeat (cursor 0)');
            isCountingInRef.current = false;
            countInBeatRef.current = 0;

            // Update store immediately so RecordingEngine can accept downbeat notes
            setIsCountingIn(false);

            // Push explicit "count-in complete" marker (countInBeat = -1)
            // Use time + tiny offset so last beat renders before sentinel dismisses overlay
            notesInQueueRef.current.push({
              step: stepIndex,
              time: time + 0.02, // 20ms after last beat — one rAF frame
              isCountIn: true,
              countInBeat: -1, // Sentinel: count-in is done
            });
            // NOTE: Don't reset current16thNoteRef here - it will naturally progress to the next step
          }
        }
      } else {
        // Non-beat 16th during count-in: push silent marker for visual sync
        notesInQueueRef.current.push({
          step: stepIndex,
          time,
          isCountIn: true,
          countInBeat: countInBeatRef.current,
        });
      }
      return; // Block ALL pattern triggers during count-in
    }

    // ── NORMAL PLAYBACK / RECORDING PHASE ───────────────────
    // Push to visual queue for rAF cursor sync
    notesInQueueRef.current.push({
      step: stepIndex,
      time,
      isCountIn: false,
      countInBeat: 0,
    });

    // Metronome during normal playback (if enabled)
    if (isOnBeat && metronomeEnabledRef.current && metronomeRef.current) {
      const beatInMeasure = (stepIndex / 4) % bpm_;
      const isDownbeat = beatInMeasure === 0;
      const pitch = isDownbeat ? 'C6' : 'C5';
      metronomeRef.current.volume.value = Tone.gainToDb(metronomeVolumeRef.current);
      metronomeRef.current.triggerAttackRelease(pitch, '32n', time);
    }

    // Trigger pattern steps
    const currentNumSteps = numStepsRef.current;
    const currentTracks = tracksRef.current;
    const currentPads = padsRef.current;
    const currentSteps = stepsRef.current;
    const drumStep = stepIndex % currentNumSteps;

    if (currentTracks.length > 0) {
      // Log once per pattern loop (step 0) to trace playback state
      if (drumStep === 0) {
        const activeStepCounts = currentTracks.map(t => ({
          id: t.id.slice(-8),
          name: t.name,
          type: t.type,
          muted: t.muted,
          hasPlayer: !!t.player,
          playerLoaded: t.player?.loaded ?? false,
          activeSteps: t.type === 'drum'
            ? t.steps.filter((s: any) => s.active).map((s: any) => s.stepIndex)
            : t.midiNotes?.length ?? 0,
        }));
        console.log(`🔊 [scheduleNote] Loop start — ${currentTracks.length} tracks, numSteps=${currentNumSteps}:`, activeStepCounts);
      }

      currentTracks.forEach((track) => {
        if (track.muted) return;
        if (track.type === 'drum') {
          const trackStep = track.steps.find(s => s.stepIndex === drumStep);
          if (trackStep?.active) {
            const probability = trackStep.probability ?? 100;
            if (Math.random() * 100 >= probability) return;
            const microTimingOffset = (trackStep.microTiming ?? 0) / 1000;
            console.log(`🥁 [scheduleNote] TRIGGER drum track "${track.name}" at step ${drumStep}, vel=${trackStep.velocity}`);
            triggerTrackRef.current(track.id, undefined, trackStep.velocity || 0.8, time + microTimingOffset);
          }
        } else if (track.type === 'instrument') {
          track.midiNotes.forEach(note => {
            if (note.startTime === stepIndex) {
              triggerTrackRef.current(track.id, note.pitch, note.velocity, time);
            }
          });
        }
      });
    } else {
      // Legacy pad system
      currentPads.forEach((_pad, padIndex) => {
        const stepData = currentSteps.find(s => s.padIndex === padIndex && s.stepIndex === drumStep);
        if (stepData?.active) {
          const probability = stepData.probability ?? 100;
          if (Math.random() * 100 >= probability) return;
          const microTimingOffset = (stepData.microTiming ?? 0) / 1000;
          triggerPadRef.current(padIndex, stepData.velocity || 0.8, time + microTimingOffset);
        }
      });
    }
  }, []); // No deps — reads everything from refs

  // --- nextNote: advance time by one 16th note, wrap at pattern end ---
  const nextNote = useCallback(() => {
    // Calculate 16th note duration from CURRENT bpm (picks up tempo changes instantly)
    const secondsPerBeat = 60.0 / bpmRef.current;
    const secondsPer16th = secondsPerBeat / 4;
    nextNoteTimeRef.current += secondsPer16th;

    // Advance step counter
    current16thNoteRef.current++;
    const totalSteps = numBarsRef.current * 16;
    if (current16thNoteRef.current >= totalSteps) {
      current16thNoteRef.current = 0; // Loop back to start
    }
  }, []); // No deps — reads everything from refs

  // --- scheduler: the JS setTimeout clock (Clock 1) ---
  // Runs every 25ms, looks ahead 100ms, schedules all notes in that window
  const scheduler = useCallback(() => {
    if (!isSchedulerRunningRef.current) return;

    const audioCtx = Tone.getContext().rawContext;
    if (!audioCtx) return;
    const currentTime = audioCtx.currentTime;

    // Schedule all notes that fall within the lookahead window
    while (nextNoteTimeRef.current < currentTime + SCHEDULE_AHEAD_TIME) {
      scheduleNote(current16thNoteRef.current, nextNoteTimeRef.current);
      nextNote();
    }

    // Schedule next check
    schedulerTimerRef.current = setTimeout(scheduler, SCHEDULER_INTERVAL);
  }, [scheduleNote, nextNote]);

  // --- visualSync: requestAnimationFrame loop (Clock 3) ---
  // Checks the note queue against audio clock to update cursor/count-in display
  //
  // VISUAL LOOKAHEAD: The metronome click is scheduled directly into the audio
  // thread at exact `time`, so it plays sample-accurately. But the cursor update
  // goes through: visualSync → setCurrentStep → React re-render, which adds
  // ~30-50ms of latency (1 rAF frame + React render). To compensate, we process
  // visual events slightly BEFORE their audio time, so the cursor appears to move
  // in sync with the metronome click rather than lagging behind it.
  const VISUAL_LOOKAHEAD = 0.04; // 40ms — compensates for rAF + React render delay

  const visualSync = useCallback(() => {
    if (!isSchedulerRunningRef.current) return;

    const audioCtx = Tone.getContext().rawContext;
    if (!audioCtx) {
      rafIdRef.current = requestAnimationFrame(visualSync);
      return;
    }
    const currentTime = audioCtx.currentTime;

    // Process all notes whose scheduled time is within the visual lookahead window
    // This makes the cursor move ~40ms before the audio plays, compensating for
    // the render pipeline delay so they appear synchronized to the user
    const queue = notesInQueueRef.current;
    while (queue.length > 0 && queue[0].time <= currentTime + VISUAL_LOOKAHEAD) {
      const note = queue.shift()!;
      if (note.isCountIn) {
        // Sentinel value -1 means "count-in just finished" — dismiss overlay
        if (note.countInBeat === -1) {
          setIsCountingIn(false);
          setCountInStep(0);
          setCurrentStep(0);
          console.log('🎬 [visualSync] Count-in overlay dismissed');
          // CRITICAL: Break out of the loop here to give React one animation frame
          // to render the overlay dismissal and step=0 BEFORE processing the normal
          // playback events that follow. Without this break, React batches
          // setCurrentStep(0) with setCurrentStep(1), setCurrentStep(2), etc.,
          // and the user only sees the final value (4-5), not 0.
          break;
        } else if (note.step % 4 === 0) {
          // Normal count-in beat: update the beat display
          setCountInStep(note.countInBeat);
        }
      } else {
        // Normal playback: update cursor position
        setCurrentStep(note.step);
      }
    }

    rafIdRef.current = requestAnimationFrame(visualSync);
  }, [setCountInStep, setIsCountingIn, setCurrentStep]);

  // --- startScheduler: kick off the two-clock system ---
  const startScheduler = useCallback(() => {
    if (isSchedulerRunningRef.current) return;

    const audioCtx = Tone.getContext().rawContext;
    if (!audioCtx) {
      console.error('❌ Cannot start scheduler: no AudioContext');
      return;
    }

    isSchedulerRunningRef.current = true;
    // Start scheduling from "now" + a tiny buffer
    nextNoteTimeRef.current = audioCtx.currentTime + 0.05;
    notesInQueueRef.current = [];

    console.log(`🎵 Scheduler started: step=${current16thNoteRef.current}, time=${nextNoteTimeRef.current.toFixed(3)}`);

    // Start both clocks
    scheduler();
    rafIdRef.current = requestAnimationFrame(visualSync);
  }, [scheduler, visualSync]);

  // --- stopScheduler: tear down both clocks ---
  const stopScheduler = useCallback(() => {
    isSchedulerRunningRef.current = false;

    if (schedulerTimerRef.current !== null) {
      clearTimeout(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    notesInQueueRef.current = [];
    console.log('⏹️ Scheduler stopped');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScheduler();
    };
  }, [stopScheduler]);

  // Keyboard shortcuts (FL Studio style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!preferences.keyboardEnabled) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Ctrl+Space - Pause (keep position) — FL Studio behavior
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        handlePause();
        return;
      }

      // Space - Play/Stop+Rewind — FL Studio behavior (NOT Play/Pause)
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayStop();
        return;
      }

      // Single-letter shortcuts: skip if typing keyboard to piano is ON (Ctrl+T)
      // These keys should play MIDI notes instead when the toggle is active
      if (!typingKeyboardEnabled) {
        // R - Toggle Record Arm
        if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          handleRecord();
        }

        // L - Toggle PAT/SONG mode (FL Studio)
        if (e.code === 'KeyL' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          togglePlaybackMode();
        }
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

      // Ctrl+T - Toggle Typing Keyboard to Piano (FL Studio)
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyT') {
        e.preventDefault();
        toggleTypingKeyboardEnabled();
        return;
      }

      // Ctrl+Z - Undo (FL Studio)
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y / Ctrl+Shift+Z - Redo (FL Studio)
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // Escape - Cancel Recording (revert to pre-recording state)
      if (e.code === 'Escape' && isRecording) {
        e.preventDefault();
        stopScheduler();
        if ((window as any).recordingEngine?.cancelRecording) {
          (window as any).recordingEngine.cancelRecording();
        } else {
          cancelRecordingSession();
          isCountingInRef.current = false;
          countInBeatRef.current = 0;
          current16thNoteRef.current = 0;
          setIsRecording(false);
          setIsPlaying(false);
          setIsArmed(false);
          setIsCountingIn(false);
          setCountInStep(0);
          setCurrentStep(0);
        }
        console.log('🚫 Recording cancelled via Escape key');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preferences.keyboardEnabled, isPlaying, isRecording, countInEnabled, metronomeEnabled, cancelRecordingSession, togglePlaybackMode, undo, redo, toggleTypingKeyboardEnabled]);

  // FL Studio: Space = Play/Stop+Rewind (NOT Play/Pause)
  const handlePlayStop = async () => {
    console.log('🎮 [FLToolbar] handlePlayStop called (FL Studio Space)', {
      currentState: { isPlaying, isArmed, isRecording, isCountingIn, countInStep, countInEnabled },
      toneState: Tone.getContext().state,
    });

    // Ensure AudioContext is fully running before any transport operations.
    // Tone.start() unlocks the context (browser autoplay policy), then we
    // verify it's actually in 'running' state before proceeding.
    await Tone.start();
    if (Tone.getContext().state !== 'running') {
      await Tone.getContext().resume();
    }
    // Double-check: wait for context to actually be running (handles slow init)
    if (Tone.getContext().state !== 'running') {
      console.warn('⚠️ AudioContext still not running after resume, retrying...');
      await new Promise(resolve => setTimeout(resolve, 100));
      await Tone.getContext().resume();
    }

    if (isPlaying) {
      // FL Studio: Space while playing = STOP + rewind to 0 (or seekPosition)
      stopScheduler();
      isCountingInRef.current = false;
      countInBeatRef.current = 0;
      const resetStep = rememberSeekTime ? Math.round(seekPosition) : 0;
      current16thNoteRef.current = resetStep;
      setIsPlaying(false);
      setIsRecording(false);
      setIsCountingIn(false);
      setCountInStep(0);
      setCurrentStep(resetStep);
      // FL Studio: disarmOnStop option
      if (disarmOnStop) {
        setIsArmed(false);
      }
      console.log('⏹️ [FLToolbar] STOPPED + REWIND (FL Studio Space)');
    } else {
      // Start playback from 0 (or seekPosition if rememberSeekTime)
      const startStep = rememberSeekTime ? Math.round(seekPosition) : 0;

      // If armed and count-in enabled, start from negative steps
      if (isArmed && countInEnabled) {
        const totalCountInSteps = countInBars * beatsPerMeasure * 4; // 4 sixteenths per beat
        current16thNoteRef.current = -totalCountInSteps;
        setCurrentStep(0); // Visual cursor stays at 0
        console.log(`🎬 Starting from step ${-totalCountInSteps} (count-in: ${countInBars} bars)`);
      } else {
        current16thNoteRef.current = startStep;
        setCurrentStep(startStep);
      }

      // If armed for recording, start recording when play is pressed
      if (isArmed) {
        console.log('🔴 [FLToolbar] RECORDING ARMED - Starting recording...');
        setIsRecording(true);

        if (countInEnabled) {
          isCountingInRef.current = true;
          countInBeatRef.current = 0;
          totalCountInBeatsRef.current = countInBars * beatsPerMeasure;
          setIsCountingIn(true);
          setCountInStep(0);
        }
      }

      startScheduler();
      setIsPlaying(true);
      console.log('▶️ [FLToolbar] PLAYBACK STARTED (FL Studio Space)');
    }
  };

  // FL Studio: Ctrl+Space = Pause (keep current playhead position)
  // Stops the scheduler but preserves current16thNoteRef so resume picks up where we left off
  const handlePause = () => {
    if (isPlaying) {
      stopScheduler();
      setIsPlaying(false);
      console.log('⏸️ [FLToolbar] PAUSED (position kept - FL Studio Ctrl+Space)');
    }
  };

  // Double-click Stop = Panic Mode (FL Studio behavior)
  // Right-click Stop = "Remember seek time" menu
  const handleStop = () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastStopClickRef.current;
    lastStopClickRef.current = now;

    if (timeSinceLastClick < 300) {
      // Double-click detected - PANIC MODE
      stopScheduler();
      panicMode();
      console.log('🚨 PANIC MODE: All sounds stopped immediately!');
    } else {
      // Normal stop — stop scheduler and reset everything
      stopScheduler();
      isCountingInRef.current = false;
      countInBeatRef.current = 0;
      const resetStep = rememberSeekTime ? Math.round(seekPosition) : 0;
      current16thNoteRef.current = resetStep;
      setIsPlaying(false);
      setIsRecording(false);
      setIsCountingIn(false);
      setCountInStep(0);
      setCurrentStep(resetStep);
      // FL Studio: disarmOnStop option
      if (disarmOnStop) {
        setIsArmed(false);
      }
      console.log('⏹️ PLAYBACK STOPPED (FL Studio Stop)');
    }
  };

  const handleStopRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowStopMenu(!showStopMenu);
  };

  // handleRecord: ARMS recording, doesn't start playback unless recordingStartsPlayback is ON
  // Right-click opens recording filter menu (FL Studio behavior)
  const handleRecord = () => {
    console.log('🎙️ [FLToolbar] handleRecord called', {
      currentState: { isArmed, isRecording, isCountingIn, isPlaying },
    });

    if (isArmed || isRecording) {
      // Disarm or stop recording — also reset count-in refs
      isCountingInRef.current = false;
      countInBeatRef.current = 0;

      if (isRecording) {
        // Actively recording — stop scheduler and reset
        stopScheduler();
        current16thNoteRef.current = 0;
        setIsPlaying(false);
        setCurrentStep(0);
      }

      setIsArmed(false);
      setIsRecording(false);
      setIsCountingIn(false);
      setCountInStep(0);
      console.log('🔴 [FLToolbar] Recording DISARMED/STOPPED');
    } else {
      // ARM recording — does NOT start playback by default (FL Studio behavior)
      setIsArmed(true);
      // FL Studio option: "Recording starts playback" — only if user enabled it
      if (recordingStartsPlayback && !isPlaying) {
        handlePlayStop();
      }
      console.log('🔴 [FLToolbar] Recording ARMED', { recordingStartsPlayback });
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
    <div className="fl-toolbar bg-[var(--fl-toolbar-bg)] border-b border-[var(--fl-toolbar-border)] px-2 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-0">
        {/* PAT/SONG Mode Toggle */}
        <ModeToggle mode={playbackMode} onToggle={togglePlaybackMode} />

        {/* Separator */}
        <div className="fl-separator h-[30px] mx-2" />

        {/* Transport Controls */}
        <div className="flex items-center gap-0">
          {/* Skip to Start */}
          <TransportButton
            onClick={() => setCurrentStep(0)}
            color="gray"
            title="Skip to Start"
          >
            <SkipBack size={14} />
          </TransportButton>
          <TransportButton onClick={handlePlayStop} active={isPlaying} color="green" title={isPlaying ? 'Stop (Space)' : 'Play (Space)'}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </TransportButton>
          <div className="relative" ref={stopMenuRef}>
            <TransportButton onClick={handleStop} color="gray" title="Stop (Double-click: Panic Mode, Right-click: Options)" onContextMenu={handleStopRightClick}>
              <Square size={14} />
            </TransportButton>
            {/* Stop Right-click Menu — FL Studio "Remember seek time" */}
            {showStopMenu && (
              <div className="absolute top-full left-0 mt-1 bg-[var(--fl-panel-bg)] border border-[var(--fl-panel-border)] rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.6)] z-50 min-w-[180px] py-1">
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--fl-panel-medium)] cursor-pointer">
                  <input type="checkbox" checked={rememberSeekTime} onChange={(e) => setRememberSeekTime(e.target.checked)} className="accent-[var(--fl-accent-orange)]" />
                  <span className="text-xs text-[var(--fl-text-primary)]">Remember seek time</span>
                </label>
              </div>
            )}
          </div>
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
              className={`w-[30px] h-[30px] flex items-center justify-center rounded-full transition-all duration-300 ${
                isArmed || isRecording
                  ? 'bg-gradient-to-b from-red-400 to-red-600 text-white animate-pulse shadow-[inset_0_0_8px_rgba(239,68,68,0.6),0_0_6px_rgba(239,68,68,0.4)]'
                  : 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[#000000b0] text-[#e1e1e5] shadow-[inset_0_0_0_0.5px_#00000090] hover:text-red-300'
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
              <div className="absolute top-full left-0 mt-1 bg-[var(--fl-panel-bg)] border border-[var(--fl-panel-border)] rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.6)] z-50 min-w-[180px] py-1">
                <div className="px-3 py-1.5 text-[10px] text-[var(--fl-text-dim)] uppercase tracking-wider border-b border-[var(--fl-panel-border)]">Recording Filter</div>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--fl-panel-medium)] cursor-pointer">
                  <input type="checkbox" checked={recordingFilter.notes} onChange={(e) => setRecordingFilter({ notes: e.target.checked })} className="accent-[var(--fl-accent-orange)]" />
                  <span className="text-xs text-[var(--fl-text-primary)]">Notes</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--fl-panel-medium)] cursor-pointer">
                  <input type="checkbox" checked={recordingFilter.automation} onChange={(e) => setRecordingFilter({ automation: e.target.checked })} className="accent-[var(--fl-accent-orange)]" />
                  <span className="text-xs text-[var(--fl-text-primary)]">Automation</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--fl-panel-medium)] cursor-pointer">
                  <input type="checkbox" checked={recordingFilter.audio} onChange={(e) => setRecordingFilter({ audio: e.target.checked })} className="accent-[var(--fl-accent-orange)]" />
                  <span className="text-xs text-[var(--fl-text-primary)]">Audio</span>
                </label>

                <div className="border-t border-[var(--fl-panel-border)] my-1" />
                <div className="px-3 py-1.5 text-[10px] text-[var(--fl-text-dim)] uppercase tracking-wider">Input Quantize</div>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--fl-panel-medium)] cursor-pointer">
                  <input type="checkbox" checked={inputQuantize.noteStartTime} onChange={(e) => setInputQuantize({ noteStartTime: e.target.checked })} className="accent-[var(--fl-accent-blue)]" />
                  <span className="text-xs text-[var(--fl-text-primary)]">Note start time</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--fl-panel-medium)] cursor-pointer">
                  <input type="checkbox" checked={inputQuantize.noteEndTime} onChange={(e) => setInputQuantize({ noteEndTime: e.target.checked })} className="accent-[var(--fl-accent-blue)]" />
                  <span className="text-xs text-[var(--fl-text-primary)]">Note end time</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--fl-panel-medium)] cursor-pointer">
                  <input type="checkbox" checked={inputQuantize.leaveDuration} onChange={(e) => setInputQuantize({ leaveDuration: e.target.checked })} className="accent-[var(--fl-accent-blue)]" />
                  <span className="text-xs text-[var(--fl-text-primary)]">Leave note duration</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--fl-panel-medium)] cursor-pointer">
                  <input type="checkbox" checked={inputQuantize.recordToStepSequencer} onChange={(e) => setInputQuantize({ recordToStepSequencer: e.target.checked })} className="accent-[var(--fl-accent-blue)]" />
                  <span className="text-xs text-[var(--fl-text-primary)]">Record to step seq</span>
                </label>

                <div className="border-t border-[var(--fl-panel-border)] my-1" />
                <div className="px-3 py-1.5 text-[10px] text-[var(--fl-text-dim)] uppercase tracking-wider">Options</div>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--fl-panel-medium)] cursor-pointer">
                  <input type="checkbox" checked={recordingStartsPlayback} onChange={(e) => setRecordingStartsPlayback(e.target.checked)} className="accent-[var(--fl-accent-orange)]" />
                  <span className="text-xs text-[var(--fl-text-primary)]">Recording starts playback</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--fl-panel-medium)] cursor-pointer">
                  <input type="checkbox" checked={disarmOnStop} onChange={(e) => setDisarmOnStop(e.target.checked)} className="accent-[var(--fl-accent-orange)]" />
                  <span className="text-xs text-[var(--fl-text-primary)]">Disarm on stop</span>
                </label>

                <div className="border-t border-[var(--fl-panel-border)] my-1" />
                <button
                  onClick={() => { dumpScoreLogToPattern(); setShowRecordMenu(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs text-[var(--fl-text-primary)] hover:bg-[var(--fl-panel-medium)]"
                >
                  📝 Dump score log to pattern
                </button>
              </div>
            )}
          </div>

          <TransportButton onClick={() => setMetronomeEnabled(!metronomeEnabled)} active={metronomeEnabled} color="blue" title="Metronome (Ctrl+M)">
            <Volume2 size={14} />
          </TransportButton>

          {/* Typing Keyboard to Piano Toggle (Ctrl+T) */}
          <TransportButton onClick={toggleTypingKeyboardEnabled} active={typingKeyboardEnabled} color="blue" title="Typing keyboard to piano (Ctrl+T) — Letter keys play MIDI notes">
            <Keyboard size={14} />
          </TransportButton>

          {/* Separator */}
          <div className="fl-separator h-[30px] mx-1.5" />

          {/* FL Studio Recording Mode Buttons */}
          <div className="flex items-center gap-0">
            {/* Loop Recording */}
            <button
              onClick={toggleLoopRecording}
              className={`w-[30px] h-[30px] flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                loopRecordingEnabled
                  ? 'bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-[inset_0_0_8px_rgba(249,115,22,0.5),0_0_4px_rgba(249,115,22,0.3)]'
                  : 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[#000000b0] text-[var(--fl-text-dim)] shadow-[inset_0_0_0_0.5px_#00000090] hover:text-[var(--fl-accent-orange)]'
              }`}
              title={loopRecordingEnabled ? 'Loop Recording ON (pattern loops)' : 'Loop Recording OFF (pattern extends)'}
            >
              🔄
            </button>

            {/* Blend/Overdub Recording */}
            <button
              onClick={toggleBlendRecording}
              className={`w-[30px] h-[30px] flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                blendRecording
                  ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-white shadow-[inset_0_0_8px_rgba(245,158,11,0.5),0_0_4px_rgba(245,158,11,0.3)]'
                  : 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[#000000b0] text-[var(--fl-text-dim)] shadow-[inset_0_0_0_0.5px_#00000090] hover:text-[var(--fl-accent-amber)]'
              }`}
              title={blendRecording ? 'Blend ON (overdub mode)' : 'Blend OFF (overwrite mode)'}
            >
              🎵
            </button>

            {/* Wait for Input */}
            <button
              onClick={toggleWaitForInput}
              className={`w-[30px] h-[30px] flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                waitForInput
                  ? 'bg-gradient-to-b from-cyan-400 to-cyan-600 text-white shadow-[inset_0_0_8px_rgba(6,182,212,0.5),0_0_4px_rgba(6,182,212,0.3)]'
                  : 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[#000000b0] text-[var(--fl-text-dim)] shadow-[inset_0_0_0_0.5px_#00000090] hover:text-cyan-300'
              }`}
              title={waitForInput ? 'Wait for Input ON (recording starts on MIDI input)' : 'Wait for Input OFF'}
            >
              ⏸
            </button>
          </div>

          {/* Count-in Button with dropdown */}
          <div className="relative group ml-1">
            <button
              onClick={() => setCountInEnabled(!countInEnabled)}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
              className={`w-[30px] h-[30px] flex items-center justify-center transition-all duration-300 ${
                countInEnabled
                  ? 'bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-[inset_0_0_8px_rgba(249,115,22,0.5),0_0_4px_rgba(249,115,22,0.3)]'
                  : 'bg-gradient-to-b from-[var(--fl-panel-medium)] to-[#000000b0] text-[#e1e1e5] shadow-[inset_0_0_0_0.5px_#00000090] hover:text-[var(--fl-accent-orange)]'
              }`}
              title={`Count-in (${countInBars} bar${countInBars > 1 ? 's' : ''}) - Right-click for options`}
            >
              <Timer size={14} />
            </button>
            {/* Right-click dropdown menu */}
            <div className="absolute top-full left-0 mt-1 bg-[var(--fl-panel-bg)] border border-[var(--fl-panel-border)] rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.6)] opacity-0 invisible group-hover:opacity-0 group-hover:invisible z-50 min-w-[100px]"
              style={{ display: 'none' }}
            >
              {[1, 2, 4].map(bars => (
                <button
                  key={bars}
                  onClick={() => setCountInBars(bars)}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--fl-panel-medium)] ${
                    countInBars === bars ? 'text-[var(--fl-accent-orange)]' : 'text-[var(--fl-text-primary)]'
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
            className="w-10 h-[30px] bg-[var(--fl-panel-medium)] border border-[var(--fl-panel-border)] rounded-sm text-[10px] text-[var(--fl-text-primary)] text-center cursor-pointer shadow-[inset_0_0_0_0.5px_#00000090]"
            title="Count-in bars"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </div>

        {/* Separator */}
        <div className="fl-separator h-[30px] mx-2" />

        {/* Tempo LCD Display with Tap Tempo */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={bpm}
            onChange={(e) => handleBpmChange(parseInt(e.target.value) || 120)}
            className="w-[70px] bg-[var(--fl-lcd-bg)] border border-[var(--fl-lcd-border)] rounded-sm px-1.5 py-0.5 font-mono text-lg text-[var(--fl-lcd-text)] text-center shadow-[inset_0_1px_4px_rgba(0,0,0,0.9)]"
            style={{ textShadow: '0 0 6px var(--fl-lcd-text)' }}
            min="20"
            max="999"
          />
          <span className="text-[9px] text-[var(--fl-text-dim)] font-medium">BPM</span>
          {/* Tap Tempo Button */}
          <button
            onClick={handleTapTempo}
            className="px-1.5 py-0.5 bg-gradient-to-b from-[var(--fl-panel-medium)] to-[#000000b0] shadow-[inset_0_0_0_0.5px_#00000090] text-[9px] text-[var(--fl-text-secondary)] hover:text-white active:shadow-[inset_0_0_8px_var(--fl-accent-orange)] font-medium transition-all duration-300"
            title="Tap Tempo - Click repeatedly to set BPM"
          >
            TAP
          </button>
        </div>

        {/* Separator */}
        <div className="fl-separator h-[30px] mx-2" />

        {/* Snap Settings (FL Studio style) & Bars */}
        <div className="flex items-center gap-1">
          <select
            value={snapSetting}
            onChange={(e) => setSnapSetting(e.target.value)}
            className="bg-[var(--fl-panel-medium)] border border-[var(--fl-panel-border)] rounded-sm px-1 py-0.5 text-[11px] text-[var(--fl-text-primary)] cursor-pointer shadow-[inset_0_0_0_0.5px_#00000090]"
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
            className="bg-[var(--fl-panel-medium)] border border-[var(--fl-panel-border)] rounded-sm px-1 py-0.5 text-[11px] text-[var(--fl-text-primary)] cursor-pointer shadow-[inset_0_0_0_0.5px_#00000090]"
          >
            {[1, 2, 4, 8, 16].map(n => <option key={n} value={n}>{n} Bar{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>

        {/* Separator */}
        <div className="fl-separator h-[30px] mx-2" />

        {/* Time Display */}
        <LCDDisplay value={elapsedTime} width="85px" />

        {/* Oscilloscope */}
        <OscilloscopeDisplay />

        {/* Pattern Selector */}
        <div className="ml-2">
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
