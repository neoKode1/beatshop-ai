'use client';

import React from 'react';
import { MPCSmallButton } from './MPCStudioSkin';
import { useBeatStore } from '@/store/useBeatStore';

// Pad Bank Button - matches MPC Studio A-H layout
const PadBankButton: React.FC<{ letter: string; active?: boolean; onClick?: () => void }> = ({
  letter,
  active = false,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`w-full h-[14px] text-[7px] font-bold rounded-sm ${
      active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-900 text-gray-500 hover:bg-gray-800'
    } border border-gray-700/50 transition-all active:scale-95`}
  >
    {letter}
  </button>
);

const MPCLeftPanel: React.FC = () => {
  // Connect to store
  const {
    noteRepeatEnabled,
    toggleNoteRepeat,
    setNoteRepeatRate,
    noteRepeatRate,
    latchEnabled,
    toggleLatch,
    fullLevelEnabled,
    toggleFullLevel,
    halfLevelEnabled,
    toggleHalfLevel,
    sixteenLevelEnabled,
    toggle16Level,
    padMuteMode,
    togglePadMuteMode,
    trackMuteMode,
    toggleTrackMuteMode,
    eraseMode,
    toggleEraseMode,
    activePadBank,
    setActivePadBank,
    copyPattern,
    deleteSelectedNotes,
    currentMode,
    setCurrentMode,
  } = useBeatStore();

  // Note divisions for touch strip (like real MPC)
  const noteDivisions = ['1/32', '1/16', '1/8', '1/4', '1/32T', '1/16T', '1/8T', '1/4T'];
  const [selectedDivision, setSelectedDivision] = React.useState('1/16');

  const handleDivisionClick = (division: string) => {
    setSelectedDivision(division);
    // Convert display format to rate format for store
    const rateMap: Record<string, string> = {
      '1/32': '1/32', '1/16': '1/16', '1/8': '1/8', '1/4': '1/4',
      '1/32T': '1/32T', '1/16T': '1/16T', '1/8T': '1/8T', '1/4T': '1/4T'
    };
    setNoteRepeatRate(rateMap[division] || '1/16');
  };

  return (
    <div className="flex gap-1.5 h-full overflow-hidden">
      {/* Left Column - Buttons */}
      <div className="flex flex-col gap-0.5 w-[50px] flex-shrink-0">
        {/* Note Repeat Section */}
        <MPCSmallButton label="NOTE" subLabel="REPEAT" active={noteRepeatEnabled} color="orange" size="xs" onClick={toggleNoteRepeat} />
        <MPCSmallButton label="LATCH" active={latchEnabled} color={latchEnabled ? 'orange' : 'gray'} size="xs" onClick={toggleLatch} />
        <MPCSmallButton label="TOUCH" subLabel="STRIP" color="gray" size="xs" />
        <MPCSmallButton label="CONFIG" active={currentMode === 'config'} color={currentMode === 'config' ? 'cyan' : 'gray'} size="xs" onClick={() => setCurrentMode(currentMode === 'config' ? 'main' : 'config')} />

        {/* Pad Bank Label */}
        <div className="text-[5px] text-gray-500 uppercase tracking-wider text-center mt-0.5 border-t border-b border-gray-600 py-0.5">
          Pad Bank
        </div>

        {/* Pad Banks A-H in 2 columns (arranged like MPC: A/E, B/F, C/G, D/H) */}
        <div className="grid grid-cols-2 gap-0.5">
          {(['A', 'E', 'B', 'F', 'C', 'G', 'D', 'H'] as const).map((letter) => (
            <PadBankButton
              key={letter}
              letter={letter}
              active={activePadBank === letter}
              onClick={() => setActivePadBank(letter as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')}
            />
          ))}
        </div>

        {/* Function Buttons */}
        <div className="flex flex-col gap-0.5 mt-0.5 flex-1">
          <MPCSmallButton label="FULL LEVEL" active={fullLevelEnabled} color="red" size="xs" onClick={toggleFullLevel} />
          <MPCSmallButton label="HALF LEVEL" active={halfLevelEnabled} color={halfLevelEnabled ? 'orange' : 'gray'} size="xs" onClick={toggleHalfLevel} />
          <MPCSmallButton label="COPY" color="gray" size="xs" onClick={copyPattern} />
          <MPCSmallButton label="DELETE" color="gray" size="xs" onClick={deleteSelectedNotes} />
          <MPCSmallButton label="PAD MUTE" active={padMuteMode} color={padMuteMode ? 'orange' : 'gray'} size="xs" onClick={togglePadMuteMode} />
          <MPCSmallButton label="TRACK MUTE" active={trackMuteMode} color={trackMuteMode ? 'orange' : 'gray'} size="xs" onClick={toggleTrackMuteMode} />
          <MPCSmallButton label="16 LEVEL" active={sixteenLevelEnabled} color="blue" size="xs" onClick={() => toggle16Level()} />
          <MPCSmallButton label="ERASE" active={eraseMode} color="red" size="xs" onClick={toggleEraseMode} />
        </div>
      </div>

      {/* Right Column - Touch Strip with note divisions */}
      <div className="flex flex-col items-center w-[22px] flex-shrink-0">
        <div
          className="flex-1 w-full rounded-sm flex flex-col justify-between py-0.5"
          style={{
            background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
            border: '1px solid #333',
          }}
        >
          {noteDivisions.map((div) => (
            <button
              key={div}
              onClick={() => handleDivisionClick(div)}
              className={`flex items-center justify-center px-0.5 py-0.5 rounded-xs transition-all ${
                selectedDivision === div || noteRepeatRate === div
                  ? 'bg-orange-500/30 border-orange-500/50'
                  : 'hover:bg-gray-700/50'
              }`}
            >
              <span className={`text-[5px] font-mono leading-none ${
                selectedDivision === div || noteRepeatRate === div
                  ? 'text-orange-400'
                  : 'text-gray-500'
              }`}>
                {div}
              </span>
            </button>
          ))}
          {/* Touch indicator LED */}
          <div className="flex justify-center mt-0.5">
            <div
              className="w-2 h-2 rounded-sm"
              style={{
                background: noteRepeatEnabled
                  ? 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)'
                  : 'linear-gradient(180deg, #444 0%, #333 100%)',
                boxShadow: noteRepeatEnabled ? '0 0 6px #f97316' : 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MPCLeftPanel;

