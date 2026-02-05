# Track-Based Sequencer Implementation Plan

## Current Problem
- User loads a sample on Piano Keyboard
- Records notes while playing
- Expects a new track to appear in Step Sequencer with that sample
- Currently: MIDI notes go to separate piano roll, not step sequencer

## Desired Behavior (Like Ableton/FL Studio)
1. Load sample on Piano Keyboard → Creates new instrument track
2. Record notes → Notes appear in step sequencer as a new row
3. Each track has its own instrument/sample
4. Tracks can be drums OR melodic instruments
5. All tracks visible in one unified step sequencer view

## Implementation Strategy

### Option 1: Extend Current Pad System (RECOMMENDED)
**Pros:**
- Minimal changes to existing code
- Reuses existing Step/Pad infrastructure
- Faster to implement

**Cons:**
- Limited to 16 tracks (can be extended)
- Pads are designed for one-shots, not chromatic playback

**Implementation:**
1. When user loads sample on Piano Keyboard:
   - Find first empty pad (or create new pad beyond 16)
   - Assign sample to that pad
   - Set pad to "chromatic" mode
2. When recording on Piano:
   - Convert MIDI notes to steps in the sequencer
   - Each note creates a step at the quantized position
   - Store pitch information in the step

### Option 2: Create New Track System (BETTER LONG-TERM)
**Pros:**
- Clean separation between drums and instruments
- Unlimited tracks
- Better for complex arrangements
- More professional DAW-like

**Cons:**
- Requires significant refactoring
- More complex implementation
- Need to update UI components

**Implementation:**
1. Create new `Track` interface:
   ```typescript
   interface Track {
     id: string;
     name: string;
     type: 'drum' | 'instrument';
     sample: Sample | null;
     volume: number;
     muted: boolean;
     solo: boolean;
     steps: Step[]; // For drum tracks
     midiNotes: MidiNote[]; // For instrument tracks
   }
   ```

2. Update store to use tracks instead of pads
3. Update StepSequencer to render tracks
4. Update PianoKeyboard to create new track when recording

## Recommended Approach: Hybrid Solution

**Phase 1 (Quick Fix):**
- When user loads sample on Piano and starts recording
- Automatically assign sample to next available pad (pad 16+)
- Convert recorded MIDI notes to step grid
- Show in step sequencer as new row

**Phase 2 (Future Enhancement):**
- Implement full track system
- Support unlimited tracks
- Better MIDI editing in step sequencer

## Next Steps
1. Modify PianoKeyboard to auto-assign sample to pad when recording starts
2. Convert MIDI notes to step grid after recording
3. Update StepSequencer to show all pads (not just first 16)
4. Add "Add Track" button to create new instrument tracks

