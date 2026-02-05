'use client';

import React from 'react';
import { useBeatStore } from '@/store/useBeatStore';
import { MPCSmallButton, MPCJogWheel, MPCLCDDisplay } from './MPCStudioSkin';

const MPCRightPanel: React.FC = () => {
  const {
    bpm,
    currentStep,
    patternLength,
    numBars,
    isPlaying,
    isRecording,
    isArmed,
    togglePlayback,
    toggleRecording,
    // MPC actions
    shiftPressed,
    setShiftPressed,
    currentMode,
    setCurrentMode,
    quantizeEnabled,
    toggleQuantize,
    quantizeCurrentPattern,
    zoomLevel,
    zoomIn,
    zoomOut,
    undo,
    redo,
    overdubEnabled,
    toggleOverdub,
    playFromStart,
    // Pattern selection
    currentPatternIndex,
    selectPattern,
    // Track selection
    selectedTrackId,
    tracks,
  } = useBeatStore();

  const [jogValue, setJogValue] = React.useState(0);

  // Format time display
  const bars = Math.floor(currentStep / 16) + 1;
  const beats = Math.floor((currentStep % 16) / 4) + 1;
  const ticks = (currentStep % 4) + 1;
  const timeDisplay = `${bars.toString().padStart(2, '0')}:${beats}:${ticks.toString().padStart(2, '0')}`;

  // Get current track index for display
  const currentTrackIndex = tracks.findIndex(t => t.id === selectedTrackId) + 1;

  // Handle jog wheel changes for pattern/track navigation
  const handleJogChange = (value: number) => {
    const delta = value - jogValue;
    setJogValue(value);

    if (shiftPressed) {
      // With shift: navigate patterns
      if (delta > 0) {
        selectPattern(Math.min(999, currentPatternIndex + 1));
      } else if (delta < 0) {
        selectPattern(Math.max(1, currentPatternIndex - 1));
      }
    }
  };

  // Handle +/- buttons for BPM or pattern navigation
  const handleMinus = () => {
    if (shiftPressed) {
      selectPattern(Math.max(1, currentPatternIndex - 1));
    } else {
      zoomOut();
    }
  };

  const handlePlus = () => {
    if (shiftPressed) {
      selectPattern(Math.min(999, currentPatternIndex + 1));
    } else {
      zoomIn();
    }
  };

  // Handle quantize button - SHIFT+QUANT applies quantize
  const handleQuantize = () => {
    if (shiftPressed) {
      quantizeCurrentPattern();
    } else {
      toggleQuantize();
    }
  };

  // Handle undo - SHIFT+UNDO = REDO
  const handleUndo = () => {
    if (shiftPressed) {
      redo();
    } else {
      undo();
    }
  };

  return (
    <div className="flex flex-col gap-1 h-full w-full overflow-hidden">
      {/* LCD Display */}
      <MPCLCDDisplay
        line1={timeDisplay}
        line2={`SEQ ${currentPatternIndex.toString().padStart(2, '0')} TRK ${currentTrackIndex.toString().padStart(2, '0')}`}
        line3={currentMode.toUpperCase()}
        subText={`${bpm} BPM • ${numBars} BAR${numBars > 1 ? 'S' : ''}`}
      />

      {/* Navigation Buttons - like MPC Studio */}
      <div className="grid grid-cols-2 gap-0.5">
        <MPCSmallButton label="TRACK" subLabel="SELECT" color="gray" size="xs" onClick={() => setCurrentMode('sampler')} />
        <MPCSmallButton label="SEQ" subLabel="SELECT" color="gray" size="xs" onClick={() => setCurrentMode('main')} />
        <MPCSmallButton label="PROG" subLabel="SELECT" color="gray" size="xs" onClick={() => setCurrentMode('browser')} />
        <MPCSmallButton label="TRACK" subLabel="TYPE" color="gray" size="xs" />
        <MPCSmallButton label="BROWSE" active={currentMode === 'browser'} color={currentMode === 'browser' ? 'cyan' : 'gray'} size="xs" onClick={() => setCurrentMode(currentMode === 'browser' ? 'main' : 'browser')} />
        <MPCSmallButton label="MIXER" active={currentMode === 'mixer'} color={currentMode === 'mixer' ? 'cyan' : 'gray'} size="xs" onClick={() => setCurrentMode(currentMode === 'mixer' ? 'main' : 'mixer')} />
      </div>

      {/* Jog Wheel with +/- buttons */}
      <div className="flex items-center justify-center gap-1 py-1">
        <MPCSmallButton label="-" color="gray" size="xs" onClick={handleMinus} />
        <MPCJogWheel size="sm" value={jogValue} onChange={handleJogChange} />
        <MPCSmallButton label="+" color="gray" size="xs" onClick={handlePlus} />
      </div>

      {/* Mode Buttons Row */}
      <div className="grid grid-cols-3 gap-0.5">
        <MPCSmallButton
          label="SHIFT"
          active={shiftPressed}
          color={shiftPressed ? 'orange' : 'gray'}
          size="xs"
          onClick={() => setShiftPressed(!shiftPressed)}
        />
        <MPCSmallButton label="MODE" color="orange" size="xs" onClick={() => {
          const modes: Array<'main' | 'browser' | 'sampler' | 'mixer' | 'config'> = ['main', 'browser', 'sampler', 'mixer', 'config'];
          const currentIndex = modes.indexOf(currentMode);
          setCurrentMode(modes[(currentIndex + 1) % modes.length]);
        }} />
        <MPCSmallButton label="MAIN" active={currentMode === 'main'} color={currentMode === 'main' ? 'cyan' : 'gray'} size="xs" onClick={() => setCurrentMode('main')} />
      </div>

      {/* Function Buttons */}
      <div className="grid grid-cols-3 gap-0.5">
        <MPCSmallButton label="QUANT" active={quantizeEnabled} color="blue" size="xs" onClick={handleQuantize} />
        <MPCSmallButton label={`ZOOM ${zoomLevel}`} color="gray" size="xs" onClick={() => shiftPressed ? zoomOut() : zoomIn()} />
        <MPCSmallButton label={shiftPressed ? 'REDO' : 'UNDO'} color="gray" size="xs" onClick={handleUndo} />
      </div>

      {/* Transport Controls - Bottom section */}
      <div className="border-t border-gray-600 pt-1 mt-auto">
        {/* Locate slider */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[5px] text-gray-500 uppercase">Locate</span>
          <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${((currentStep % patternLength) / patternLength) * 100}%` }}
            />
          </div>
        </div>

        {/* Transport buttons */}
        <div className="grid grid-cols-5 gap-0.5">
          <MPCSmallButton label="REC" active={isRecording || isArmed} color="red" size="xs" onClick={toggleRecording} />
          <MPCSmallButton label="ODUB" active={overdubEnabled} color="orange" size="xs" onClick={toggleOverdub} />
          <MPCSmallButton label="STOP" color="gray" size="xs" onClick={() => isPlaying && togglePlayback()} />
          <MPCSmallButton label="PLAY" active={isPlaying} color="green" size="xs" onClick={togglePlayback} />
          <MPCSmallButton label="▶" subLabel="START" color="green" size="xs" onClick={playFromStart} />
        </div>
      </div>
    </div>
  );
};

export default MPCRightPanel;

