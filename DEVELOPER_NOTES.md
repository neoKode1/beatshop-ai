# Beashopai Developer Notes

**Last Updated:** 2026-02-05  
**Project Status:** Active Development - ~85% Feature Complete

---

## 🎯 Project Overview

Beashopai is a professional beat machine/DAW application that emulates **FL Studio** and **Akai MPC Studio** functionality. Built with React/Next.js, TypeScript, Tone.js for audio, Zustand for state management, and Tailwind CSS for styling.

**Goal:** Create an intuitive beat-making experience for FL Studio users transitioning to our web-based platform.

---

## 🏗️ Architecture

### Key Directories
```
├── components/
│   ├── BeatMachine/          # Core beat machine components
│   │   ├── BeatMachine.tsx   # Main layout controller
│   │   ├── PadGrid.tsx       # 4x4 MPC-style drum pads
│   │   ├── PianoRoll.tsx     # FL Studio-style MIDI editor
│   │   ├── PianoKeyboard.tsx # Chromatic keyboard
│   │   ├── FLSampler.tsx     # Sample editor with waveform
│   │   ├── RecordingEngine.tsx # MIDI recording system
│   │   └── StepSequencerGrid.tsx # Step sequencer UI
│   ├── Toolbar/
│   │   └── FLToolbar.tsx     # Transport controls, BPM, recording
│   └── MPC/                  # MPC Studio skin components
├── store/
│   └── useBeatStore.ts       # Central Zustand store (~3600 lines)
├── lib/
│   ├── audio/
│   │   ├── audioProcessing.ts # Sample effects (normalize, reverse, etc.)
│   │   ├── audioPlayerService.ts # Centralized audio playback
│   │   └── midiService.ts    # Web MIDI API integration (IN PROGRESS)
│   └── ai/                   # AI music generation (ACE-Step integration)
└── public/samples/           # Default sample library
```

### State Management
All app state lives in `store/useBeatStore.ts`. Key state areas:
- **Transport:** `isPlaying`, `isRecording`, `isArmed`, `bpm`, `currentStep`
- **Pads/Tracks:** `pads[]`, `tracks[]`, `steps[]`, `midiNotes[]`
- **Patterns:** `patterns[]`, `currentPatternId`, `arrangementClips[]`
- **Recording:** `recordingSession`, `scoreLogger`, `inputQuantize`
- **MIDI Learn:** `midiLearnMode`, `midiMappings[]` (IN PROGRESS)

---

## ✅ Completed Features

### Recording System (FL Studio Style)
- ✅ ARM/Record workflow (R to arm, Space to start)
- ✅ Loop Recording (pattern loops during record)
- ✅ Blend Recording (overdub mode)
- ✅ Count-in with metronome
- ✅ Cancel Recording (Escape to revert)
- ✅ Recording Filter Menu (right-click Record button)
- ✅ Score Logger (3-minute buffer, dump to pattern)
- ✅ Input Quantization options

### Piano Roll
- ✅ All tools: Draw, Paint, Delete, Mute, Select, Slice, Chord Stamp
- ✅ Multi-select, copy/paste, keyboard shortcuts
- ✅ Ghost notes from other channels
- ✅ Snap to Scale (Major, Minor, Pentatonic, etc.)
- ✅ Note Properties Panel (velocity, pan, pitch)
- ✅ Zoom controls

### Step Sequencer
- ✅ Per-step probability (0-100%)
- ✅ Per-step microtiming (-50 to +50ms)
- ✅ Fill steps, rotate steps, reverse
- ✅ Right-click for step properties

### Audio Processing
- ✅ Normalize, Remove DC, Reverse
- ✅ Flip Polarity, Swap Stereo, Fade Stereo
- ✅ Crossfade Loop, Fade In/Out
- ✅ Audio Export (pattern & arrangement)

### MPC Features
- ✅ Note Repeat with rate selection
- ✅ 16 Level mode (velocity mapping)
- ✅ Pad Mute, Track Mute, Erase modes
- ✅ Latch mode, Full/Half Level
- ✅ Undo/Redo system

---

## 🚧 In Progress / Remaining

| Feature | Status | Notes |
|---------|--------|-------|
| **MIDI Learn Mode** | 70% | Store actions done, UI component needed |
| **Swing/Groove Templates** | Not started | MPC 60, SP-1200 templates |
| **Sample Slicing** | Not started | Transient detection, auto-chop |
| **Audio Processing UI** | 90% | Buttons wired, need visual feedback |

---

## 🔧 Running the Project

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## 📝 Console Logging Convention

The app uses emoji-prefixed console logs for debugging:
- 🎹 MIDI events
- 🔴 Recording events
- ⏸️/▶️ Transport events
- 📝 Score Logger events
- 🎛️ Audio processing
- ✅/❌ Success/Error states
- 🚨 Panic mode

---

## ⚠️ Known Issues / Gotchas

1. **Tone.js Audio Context:** Must call `Tone.start()` on first user interaction
2. **Transport Position:** Reset to 0 when stopping, or recording starts at wrong step
3. **Store Size:** `useBeatStore.ts` is large (~3600 lines) - consider splitting
4. **MIDI Service:** `midiService.ts` created but not yet integrated into UI

---

## 🔑 Key Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| R | Arm Recording |
| Escape | Cancel Recording |
| Ctrl+M | Toggle Metronome |
| Ctrl+B | Toggle Blend (Overdub) |
| ? or F1 | Show Shortcuts Panel |
| Q/W/E/R, A/S/D/F | Trigger Pads 1-8 |

---

## 📞 Contact

For questions about this codebase, check the task list in the conversation or review git history.

