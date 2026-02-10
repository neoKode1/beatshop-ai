# Beashopai Developer Notes

**Last Updated:** 2026-02-08
**Project Status:** Active Development — Recording & Playback Fine-Tuning Phase

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
│   │   ├── StepSequencerGrid.tsx # Step sequencer UI
│   │   ├── MIDILearnPanel.tsx # MIDI controller mapping UI
│   │   └── GroovePanel.tsx   # Swing/groove template selector
│   ├── Toolbar/
│   │   └── FLToolbar.tsx     # Transport controls, BPM, recording
│   ├── Toast/
│   │   └── Toast.tsx         # Toast notification system
│   └── MPC/                  # MPC Studio skin components
├── store/
│   └── useBeatStore.ts       # Central Zustand store (~3700 lines)
├── lib/
│   ├── audio/
│   │   ├── audioProcessing.ts # Sample effects (normalize, reverse, etc.)
│   │   ├── audioPlayerService.ts # Centralized audio playback
│   │   ├── grooveTemplates.ts # Swing/groove template definitions
│   │   └── midiService.ts    # Web MIDI API integration
│   └── ai/                   # AI music generation (ACE-Step integration)
└── public/samples/           # Default sample library
```

### State Management
All app state lives in `store/useBeatStore.ts` (~4000 lines). Key state areas:
- **Transport:** `isPlaying`, `isRecording`, `isArmed`, `bpm`, `currentStep`
- **FL Studio Transport:** `rememberSeekTime`, `seekPosition`, `pausePlayback`, `recordingStartsPlayback`, `disarmOnStop`
- **Pads/Tracks:** `pads[]`, `tracks[]`, `steps[]`, `midiNotes[]`
- **Patterns:** `patterns[]`, `currentPatternId`, `arrangementClips[]`
- **Recording:** `recordingSession`, `scoreLogger`, `inputQuantize`
- **MIDI Learn:** `midiLearnMode`, `midiMappings[]`
- **Typing Keyboard:** `typingKeyboardEnabled` — Ctrl+T toggle for MIDI vs shortcuts

---

## 📚 Reference Materials

### butterDAWg FL Studio Clone
Located in `reference/butterDAWg/` — An open-source FL Studio clone (Electron-based) used as our primary reference for FL Studio behavior and architecture.

**Key Source Files:**
| File | Purpose |
|------|---------|
| `src/util/Header.ts` | Transport controls, PAT/SONG toggle, toolbar behavior |
| `src/core/Channel.ts` | Channel class with plugin chain |
| `src/core/Mixer.ts` | Mixer singleton with master/default channels |
| `src/core/Playlist.ts` | Arrangement/timeline management |
| `src/core/Plugin.ts` | Plugin system and Connectable interface |
| `src/core/Sample.ts` | Sample playback and pitch shifting |
| `src/core/Source.ts` | Audio source abstraction |
| `src/globals.ts` | Singleton AudioContext pattern |

**Key Styles:**
| File | Purpose |
|------|---------|
| `styles/Header.css` | Toolbar/transport styling |
| `styles/Playlist.css` | Playlist/arrangement styling |
| `styles/Mixer.css` | Mixer panel styling |
| `styles/Channel.css` | Channel rack styling |
| `styles/general.css` | Base FL Studio theme |

**Patterns adopted from butterDAWg:**
- Connectable interface for audio routing (`getAudioNode()`)
- Channel-based mixer architecture (Source → Channel → Mixer Master → Destination)
- ToneNodeAdapter wrapper for Tone.js ↔ Web Audio interop
- PAT/SONG scope toggle behavior

### FL Studio Online Manual
Reference: `https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/`
Key sections consulted:
- Toolbar panels & icons
- Transport & recording controls
- Typing keyboard to piano (Ctrl+T)
- Global snap panel
- Pattern panel management

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
- ✅ Recording starts playback option
- ✅ Disarm on stop option

### FL Studio Transport Behavior
- ✅ Space = Play / Stop + Rewind (NOT Play/Pause)
- ✅ Ctrl+Space = Pause (keep playhead position)
- ✅ Stop: single-click = stop+rewind, double-click = Panic Mode
- ✅ Stop right-click: "Remember seek time" option
- ✅ Record right-click: Recording filter + options menu
- ✅ PAT/SONG mode toggle (L key)
- ✅ Undo/Redo (Ctrl+Z / Ctrl+Y)

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

### MIDI Learn System
- ✅ Full MIDI Learn UI panel (`MIDILearnPanel.tsx`)
- ✅ Pad and transport control mapping
- ✅ Real-time MIDI message display
- ✅ Device detection and connection status
- ✅ localStorage persistence for mappings

### Groove/Swing Templates
- ✅ Classic templates: MPC 60, MPC 3000, SP-1200, J Dilla
- ✅ Per-step timing and velocity adjustments
- ✅ Groove amount slider (0-100%)
- ✅ Compact and full GroovePanel UI (`GroovePanel.tsx`)
- ✅ Apply groove to pattern action

### UI Feedback System
- ✅ Toast notification system (`Toast.tsx`)
- ✅ Success/Error/Warning/Info toast types
- ✅ Auto-dismiss with configurable duration
- ✅ Integration in audio processing and groove application

---

## 🚧 In Progress / Remaining

| Feature | Status | Notes |
|---------|--------|-------|
| **Typing Keyboard to Piano (Ctrl+T)** | 🔧 In Progress | Toggle letter keys between MIDI notes and shortcuts |
| **Keyboard Event Routing** | 🔧 In Progress | Fix conflicts between PianoKeyboard, PianoRoll, FLToolbar |
| **Dead Code Cleanup** | ⏳ Pending | Remove unused imports, commented-out blocks, unreachable code |
| **FL Studio Workflow Audit** | ⏳ Pending | Full audit against FL Studio manual for behavior gaps |
| **MIDI Learn Mode** | ✅ 100% | Full UI panel with device detection, pad/transport mapping |
| **Swing/Groove Templates** | ✅ 100% | MPC 60, SP-1200, J Dilla templates + GroovePanel UI |
| **Sample Slicing** | ✅ 100% | Transient detection, grid slicing, slice-to-pads via SampleSlicer |
| **Audio Processing UI** | ✅ 100% | Toast notifications for all processing actions |

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

## 🔧 Recent Fixes (2026-02-07) — Count-in, Recording & Playback

### "Tale of Two Clocks" Scheduler Architecture
The sequencer in `FLToolbar.tsx` uses the Chris Wilson "Tale of Two Clocks" pattern:
- **Clock 1 (JS setTimeout, 25ms):** Coarse scheduling — looks 100ms ahead, calls `scheduleNote()` for each 16th note in the window
- **Clock 2 (AudioContext.currentTime):** Sample-accurate timing — all audio events scheduled against this clock
- **Clock 3 (requestAnimationFrame):** Visual sync — processes a queue of events to update cursor/count-in display

Events flow: `scheduler()` → `scheduleNote()` → pushes to `notesInQueueRef` → `visualSync()` reads queue and updates React state.

### Bug Fixes Applied

#### 1. Count-in Overlay Stuck on Screen (FIXED)
**Root cause:** The original `visualSync` checked `isCountingInRef.current` to detect count-in completion, but the scheduler had already flipped this ref before `visualSync` processed the events — a race condition.
**Fix:** Added a sentinel marker (`countInBeat: -1`) pushed to the visual queue when count-in ends. `visualSync` detects this marker in audio-timeline order, eliminating the race.
**Files:** `FLToolbar.tsx` — `scheduleNote()` (negative steps path + legacy path) and `visualSync()`

#### 2. Count-in Overlay Dismisses Late / Cursor at Position 5 (FIXED)
**Root cause:** The `visualSync` while-loop processed the sentinel marker AND all subsequent normal playback events in a single batch. React batched `setCurrentStep(0)` with `setCurrentStep(1)`, `setCurrentStep(2)`, etc., so only the final value (4-5) rendered.
**Fix:** Added `break;` after processing the sentinel marker in `visualSync`, giving React one animation frame to render step 0 and dismiss the overlay before processing normal playback events.
**Files:** `FLToolbar.tsx` — `visualSync()` while-loop

#### 3. Count-in Numbers Skip/Double (FIXED)
**Root cause:** A `useEffect` reset `countInBeatRef.current = 0` when `isCountingIn` changed to `true`. But useEffects fire after React re-renders — by then the scheduler had already incremented the counter to 1. The reset caused beat 0 to fire twice.
**Fix:** Removed the `countInBeatRef.current = 0` from the useEffect. The ref is already correctly initialized in `handlePlayStop` before the scheduler starts.
**Files:** `FLToolbar.tsx` — `useEffect` for `isCountingIn`

#### 4. Recorded Notes Start at Position 5+ (FIXED)
**Root cause:** Direct consequence of Bug #2. When the overlay dismissed late, `currentStep` was already 5, so pad hits recorded at that offset.
**Fix:** Automatically resolved by Bug #2 fix.

#### 5. Tone.js "Time Must Be >= Last Scheduled Time" Error (FIXED)
**Root cause:** The scheduler pre-schedules audio events 100ms ahead. If JS execution is delayed (GC pause, tab throttling), the scheduled time can be in the past by the time `Player.start(time)` executes. Tone.js throws an assertion error.
**Fix:** Clamped scheduled time to `Math.max(scheduledTime, Tone.now())` in both `triggerPad` and `triggerTrack`. This ensures the note plays immediately if the scheduled time has passed, rather than crashing.
**Files:** `useBeatStore.ts` — `triggerPad()` and `triggerTrack()`

#### 6. Default Settings Changed
- **Loop recording:** Changed default from `true` to `false` (user preference)
- **Pattern length:** Changed from 1 bar (16 steps) to 4 bars (64 steps)
- **Files:** `useBeatStore.ts` — initial state and `resetToDefaults()`

#### 7. Build Warning: Deprecated Route Config (FIXED)
- Removed deprecated `export const config = { api: { bodyParser: false } }` (Pages Router pattern)
- Added `export const maxDuration = 60` (App Router route segment config)
- **Files:** `app/api/ai/upload/route.ts`

### Diagnostic Logging Added
Added targeted console logging for debugging playback issues:
- `🔊 [scheduleNote]` — Logs track state at each loop start (step 0): active steps, player loaded status
- `🥁 [scheduleNote]` — Logs each drum trigger during playback
- `✅/⚠️ [addStepToTrack]` — Logs whether recording writes succeed or silently fail
- `🔇/⚠️ [triggerTrack]` — Logs when tracks are muted or have no audio engine

### Current Status (2026-02-08)
✅ Count-in displays full 8-beat count (2 bars of 4), clears before downbeat
✅ First downbeat note is captured correctly during recording
✅ Recording captures notes on quantized time starting at position 1
✅ Playback of both recorded and manually-drawn notes produces sound
✅ Piano roll auto-scrolls to follow cursor during playback/recording
✅ Metronome clicks visually sync with cursor position
✅ Build passes with 0 warnings, 0 errors
🔧 Fine-tuning phase — core recording/playback loop is fully functional

---

## 🔧 Recent Fixes (2026-02-08) — Dual-Write, Count-in Timing, Quantize UI

### Dual Data Structure Architecture & Fix

**The Problem:** The app had two separate MIDI note storage arrays that were disconnected:
1. **Global `midiNotes[]`** (root store state) — Piano roll UI reads/draws from this
2. **Per-track `track.midiNotes[]`** (each Track object) — Scheduler reads from this during playback

Both `addMidiNote()` (manual drawing) and `recordNoteWithQuantize()` (recording) only wrote to the global array. The FLToolbar scheduler only read from per-track arrays. Notes appeared visually but never played.

**The Fix — Dual-Write Pattern:** All 5 MIDI note functions now sync to both arrays:

| Function | What it does |
|---|---|
| `addMidiNote()` | Writes to global + selected instrument track |
| `recordNoteWithQuantize()` | Writes to global + selected instrument track |
| `updateMidiNote()` | Updates in global + all instrument tracks |
| `deleteMidiNote()` | Deletes from global + all instrument tracks |
| `clearMidiNotes()` | Clears global + all instrument tracks |
| `quantizeSelectedNotes()` | Quantizes in global + all instrument tracks |

Target track selection priority: `selectedTrackId` (if instrument) → first instrument track → warning logged.

**Files:** `useBeatStore.ts` — `addMidiNote`, `recordNoteWithQuantize`, `updateMidiNote`, `deleteMidiNote`, `clearMidiNotes`, `quantizeSelectedNotes`

### Count-in: 7 Beats Instead of 8 (FIXED)
**Root cause:** The sentinel marker (`countInBeat: -1`) was pushed at the **same `time`** as the last beat event. In `visualSync`, both were processed in the same while-loop iteration. React batched `setCountInStep(7)` with `setCountInStep(0)` (sentinel reset), so the user never saw the final count.
**Fix:** Sentinel pushed with `time + 0.02` (20ms offset) — processed in the next rAF frame, giving React one frame to render the last beat before dismissing.
**Files:** `FLToolbar.tsx` — `scheduleNote()` sentinel push

### First Downbeat Note Not Captured (FIXED)
**Root cause:** `RecordingEngine` read `isCountingIn` from a ref synced via `useEffect`. The chain: scheduler → visualSync → `setIsCountingIn(false)` → React render → useEffect → ref. This added 1-2 frames (~30-50ms) delay — notes pressed during that window were blocked.
**Fix (2 parts):**
1. **FLToolbar:** Calls `setIsCountingIn(false)` **immediately** via Zustand `set()` when count-in completes (synchronous)
2. **RecordingEngine:** `handleNoteOn`/`handleNoteOff` read from `useBeatStore.getState()` directly. Auto-starts recording session if downbeat note arrives before `useEffect`.
**Files:** `FLToolbar.tsx` — sentinel handler, `RecordingEngine.tsx` — `handleNoteOn`, `handleNoteOff`

### Piano Roll Auto-Scroll (ADDED)
Follows playback cursor with FL Studio-style "page turn" behavior. When cursor approaches right 15% edge, view jumps to position cursor at 25% from left.
**Files:** `PianoRoll.tsx` — `useEffect` watching `currentStep`

### Metronome/Cursor Visual Sync (FIXED)
Added 40ms `VISUAL_LOOKAHEAD` to compensate for React render pipeline latency (rAF → setState → re-render ≈ 30-50ms). Cursor updates process slightly before audio time.
**Files:** `FLToolbar.tsx` — `VISUAL_LOOKAHEAD` constant, `visualSync()` comparison

### Quantize UI Controls (ADDED)
- **Quantize button** in piano roll header (visible when notes are selected)
- **Ctrl+Q keyboard shortcut** for quick quantize
- Uses current snap setting to determine grid resolution
- Supports dual-write pattern — quantized positions sync to both global and per-track arrays
**Files:** `PianoRoll.tsx` — header toolbar, keyboard shortcuts

---

## ⚠️ Known Issues / Gotchas

1. **Tone.js Audio Context:** Must call `Tone.start()` on first user interaction
2. **Store Size:** `useBeatStore.ts` is large (~4000 lines) — consider splitting into domain slices
3. **Keyboard Event Routing:** PianoKeyboard, PianoRoll, and FLToolbar all capture keyboard events — use `typingKeyboardEnabled` toggle (Ctrl+T) to route correctly
4. **butterDAWg Adaptation:** Some patterns from butterDAWg need adaptation for web (e.g., Electron-specific IPC, AudioWorklet modules)
5. **Scheduler Timing:** The "two clocks" pattern requires all audio triggers to clamp time to `Math.max(scheduled, Tone.now())` to handle JS execution delays gracefully
6. **Dual Data Structures:** Always use store functions (`addMidiNote`, `deleteMidiNote`, etc.) to modify notes — never write directly to `midiNotes[]` or `track.midiNotes[]` to avoid desync

---

## 🔑 Key Keyboard Shortcuts (FL Studio Style)

| Key | Action |
|-----|--------|
| Space | Play / Stop + Rewind |
| Ctrl+Space | Pause (keep position) |
| R | Arm / Disarm Recording |
| L | Toggle PAT / SONG Mode |
| Ctrl+T | Toggle Typing Keyboard to Piano |
| Escape | Cancel Recording (revert) |
| Ctrl+M | Toggle Metronome |
| Ctrl+P | Toggle Count-in |
| Ctrl+B | Toggle Blend (Overdub) |
| Ctrl+I | Toggle Wait for Input |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| ? or F1 | Show Shortcuts Panel |

### Typing Keyboard to Piano (Ctrl+T)
FL Studio feature that toggles keyboard event routing:
- **ON (active):** Letter keys (A-Z) play MIDI notes via PianoKeyboard component
- **OFF (default):** Letter keys act as shortcuts (tool switching, transport controls)
- Prevents conflicts between MIDI input and shortcut keys
- Toolbar button shows current state (blue glow when active)

---

## 🎨 FL Studio Design System

### CSS Variables (in `globals.css`)
```css
--fl-panel-bg: #1a1a1a       /* Main panel background */
--fl-panel-darker: #111111    /* Deeper panel background */
--fl-panel-medium: #252525    /* Medium panel background */
--fl-panel-light: #2e2e2e     /* Lighter panel areas */
--fl-accent-orange: #ff6b00   /* Primary accent (PAT mode, notes) */
--fl-accent-amber: #f5a623    /* Secondary accent (cursors, highlights) */
--fl-accent-green: #00ff00    /* SONG mode, LCD text */
--fl-lcd-bg: #0a0f0a          /* LCD display background */
--fl-lcd-text: #00ff00        /* LCD display text */
```

### Button Standards
- All toolbar buttons: **30px height**
- Transport buttons: Gradient `from-medium to-black` with colored glow states
- PAT/SONG toggle: Stacked vertical, orange glow (PAT) / green glow (SONG)

---

## 📞 Contact

For questions about this codebase, check the task list in the conversation or review git history.
