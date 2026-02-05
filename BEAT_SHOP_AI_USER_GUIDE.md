# Beat Shop AI - Complete User Guide

## 🎛️ Overview

Beat Shop AI is a professional-grade beat making application with:
- 16-pad MPC-style drum machine
- Chromatic piano keyboard
- 16/32/64-step sequencer
- Live recording with count-in
- AI-powered music generation (Phase integration)
- Master effects chain (EQ, Compression, Reverb, Delay, etc.)
- Sound synthesis (Generate new sounds from scratch!)

---

## ⚡ Quick Start: Make a Beat in 60 Seconds

1. **Drag a kick** from Sample Browser → Pad 1
2. **Drag a snare** → Pad 2
3. **Drag a hi-hat** → Pad 3
4. **Click steps** in the sequencer: Kick on 1, 5, 9, 13 | Snare on 5, 13 | Hi-hat on every step
5. **Press Play** (▶ or Spacebar)
6. **Adjust BPM** with the slider (default 120)
7. **Add effects** with Master Controls knobs

🎉 You've made a beat!

---

## 🖱️ Complete Button & Click Audit

### Toolbar (Top Bar)

| Button | Icon | Action |
|--------|------|--------|
| **Play** | ▶ | Start playback from current position |
| **Pause** | ⏸ | Pause playback |
| **Stop** | ⏹ | Stop and reset to beginning |
| **Record** | 🔴 | Start recording with 4-beat count-in |
| **BPM Slider** | 60-200 | Adjust tempo |
| **Metronome** | 🔊 | Toggle click track on/off |
| **Metronome Volume** | Slider | Adjust click volume |
| **Swing** | Slider | Add groove (0-100%) |
| **Pattern Length** | 16/32/64 | Set number of steps |
| **Time Signature** | 4/4, 3/4, etc. | Change time signature |

### Sample Browser (Left Panel)

| Element | Action |
|---------|--------|
| **Category Tabs** | Filter samples by type (Kick, Snare, etc.) |
| **Sample Name** | Click to preview sound |
| **Drag Sample** | Drag to Pad, Sequencer, or Piano |
| **Folder Icon** | Upload your own sample folders |
| **Folder Expand** | Click chevron to show/hide contents |
| **Delete Folder** | Trash icon removes uploaded folder |

### Pad Grid (Center)

| Action | Result |
|--------|--------|
| **Click Pad** | Trigger sound + select pad |
| **Drag Sample to Pad** | Load sample + create drum track |
| **Keyboard Q-Y** | Trigger pads 1-16 |
| **During Recording** | Hits are recorded to current step |

### Step Sequencer (Below Pads)

| Element | Action |
|---------|--------|
| **Step Cell** | Click to toggle on/off |
| **Track Name** | Shows sample name |
| **▶ Button** | Preview that track's sound |
| **Volume Slider** | Adjust track volume |
| **S Button** | Solo (only hear this track) |
| **M Button** | Mute (silence this track) |
| **Drop Zone** | Drag sample here to add new track |
| **Arrow Keys** | Navigate between steps/tracks |

### Piano Keyboard

| Action | Result |
|--------|--------|
| **Drag Sample to Keyboard** | Load for chromatic playback |
| **Click Key** | Play note at that pitch |
| **Keyboard A-B** | Play white keys |
| **Keyboard W-P** | Play black keys |
| **During Recording** | Notes recorded with timing |

### Waveform Editor (Bottom Panel)

| Tab | Purpose |
|-----|---------|
| **Edit (🎵)** | Modify existing sample |
| **Generate (🪄)** | Create new synth sounds |

**Edit Mode Controls:**
| Control | Range | Effect |
|---------|-------|--------|
| Attack | 0-2s | Fade-in time |
| Decay | 0-2s | Time to sustain level |
| Sustain | 0-100% | Held volume level |
| Release | 0-4s | Fade-out time |
| Filter Cutoff | 20-20kHz | Brightness |
| Filter Q | 0.1-20 | Resonance |
| Pitch | -24 to +24 | Semitone shift |
| Reverse | Toggle | Play backwards |

**Generate Mode Controls:**
| Control | Options | Effect |
|---------|---------|--------|
| Oscillator | Sine, Square, Saw, Triangle | Wave shape |
| Base Note | C1-C4, E2, G2, A2 | Starting pitch |
| Duration | 0.25-4s | Sound length |
| Preview | Button | Hear before saving |
| Create | Button | Generate and assign to pad |

### Master Controls (Left Side)

| Knob | Range | Effect |
|------|-------|--------|
| Master Volume | 0-100% | Overall output |
| Compressor Threshold | -60 to 0dB | Dynamics control |
| Compressor Ratio | 1:1 to 20:1 | Compression amount |
| EQ Low | -12 to +12dB | Bass boost/cut |
| EQ Mid | -12 to +12dB | Mids boost/cut |
| EQ High | -12 to +12dB | Treble boost/cut |
| Reverb | 0-100% | Room ambience |
| Delay | 0-100% | Echo effect |
| Distortion | 0-100% | Saturation |
| Stereo Width | 0-200% | Mono to wide |
| Limiter | -20 to 0dB | Prevent clipping |

### AI Generator Panel (Right Side)

| Tab | Purpose |
|-----|---------|
| **Generate** | Create music from text prompts |
| **Stems** | Separate audio into tracks |
| **History** | View previous generations |

---

## 🎹 Getting Started

### 1. Loading Samples

**From Sample Browser (Left Panel):**
- Browse 358+ audio samples organized by category
- **Drag & Drop** any sample onto a pad to load it
- Click sample name to preview before loading
- Upload your own folders via the folder icon

**Categories:**
- Kick, Snare, Hi-Hat, Percussion
- Bass, Synth, FX, Melodic
- 11 built-in synthesizers

### 2. Playing Pads

**Mouse:** Click any pad to trigger the sound

**Keyboard Shortcuts:**
```
Q  W  E  R     (Pads 1-4)
A  S  D  F     (Pads 5-8)
Z  X  C  V     (Pads 9-12)
T  G  B  Y     (Pads 13-16)
```

---

## 🎚️ Step Sequencer

The step sequencer shows all tracks with their step patterns.

### Adding Tracks

**Method 1: Drag to Pads**
- Drag a sample from the Sample Browser onto any drum pad
- A drum track is automatically created

**Method 2: Drag to Sequencer (NEW!)**
- Drag any sample directly to the step sequencer drop zone
- Drop on the "Drag sample here to add track" area at the bottom
- Drum samples create drum tracks, melodic/synth samples create instrument tracks

**Method 3: Piano Recording**
- Load a sample on the piano keyboard and record
- An instrument track is automatically created

### Basic Usage
1. Add tracks using any method above
2. Click steps in the grid to toggle them on/off
3. Press **Play** to hear your pattern

### Controls Per Row
- **▶ Play Button** - Preview that instrument
- **Volume Slider** - Adjust individual volume
- **S Button** - Solo (only hear this track)
- **M Button** - Mute (silence this track)

### Keyboard Navigation
- **← →** Navigate between steps
- **↑ ↓** Navigate between pads/tracks
- **Space/Enter** Toggle focused step
- **1-9** Jump to specific step
- **Q/W/E/R...** Toggle step for that pad at focused position

---

## 🔴 Recording

### Live Recording (MPC-Style)

1. **Load samples** onto pads
2. **Click Record button** (circle icon in toolbar)
3. **Count-in plays:** 1, 2, 3, 4 (with metronome)
4. **Recording starts** on beat 5
5. **Hit pads or keyboard** - your hits are recorded to the current step
6. **Click Record again** to stop

**Tips:**
- Enable metronome for timing reference
- Hits are quantized to the 16th-note grid
- Works with both pads (Q/W/E/R keys) and piano keyboard

---

## 🎹 Piano Keyboard Mode

Switch to Piano mode using the **Piano** tab at the top.

### Loading a Sample for Chromatic Playback
1. **Drag any sample** onto the piano keyboard area
2. The sample loads and shows a green indicator
3. **Play chromatically** - each key plays the sample at different pitches

### Keyboard Mapping
```
White Keys: A S D F G H J K L ; ' Z C B
Black Keys: W E   T Y U   O P   X V
```

### Recording with Piano
1. Load a sample onto the keyboard
2. Click Record
3. After count-in, play notes
4. An **instrument track** is automatically created
5. Notes are recorded with timing and duration

---

## 🎛️ Master Controls

Located on the left side of the drum machine:

### Volume & Dynamics
- **Master Volume** - Overall output level
- **Compressor** - Threshold, Ratio, Attack, Release

### EQ (3-Band)
- **Low** - Bass frequencies
- **Mid** - Middle frequencies  
- **High** - Treble frequencies

### Effects
- **Reverb** - Room ambience
- **Delay** - Echo effect
- **Distortion** - Saturation/overdrive
- **Stereo Width** - Mono to wide stereo

### Limiter
- **Threshold** - Prevents clipping

---

## 🔊 Waveform Editor

Click on any pad to select it and reveal the Waveform Editor below.

### Two Modes

**Edit Mode (🎵)** - Modify existing samples
**Generate Mode (🪄)** - Create new synth sounds from scratch

### Edit Mode: ADSR Envelope
- **Attack** - How quickly sound reaches full volume (0-2s)
- **Decay** - Time to reach sustain level (0-2s)
- **Sustain** - Volume level while held (0-100%)
- **Release** - Fade out time after release (0-4s)

### Edit Mode: Filter
- **Cutoff** - Frequency cutoff point (20Hz-20kHz)
- **Resonance (Q)** - Emphasis at cutoff (0.1-20)

### Edit Mode: Pitch & Effects
- **Pitch** - Shift up/down by semitones (-24 to +24)
- **Reverse** - Play sample backwards

### Generate Mode: Create New Sounds

This powerful feature lets you synthesize new sounds without any samples!

1. **Click any pad** (even an empty one)
2. **Switch to Generate tab** (🪄 icon)
3. **Select oscillator type:**
   - **Sine** - Pure, smooth tone (good for sub bass)
   - **Square** - Hollow, buzzy (good for leads)
   - **Sawtooth** - Bright, rich (good for pads, leads)
   - **Triangle** - Soft, mellow (good for bass, pads)
4. **Choose base note:** C1, C2, C3, C4, E2, G2, A2
5. **Set duration:** 0.25s to 4s
6. **Shape with ADSR:** Attack, Decay, Sustain, Release
7. **Apply filter:** Cutoff and Resonance
8. **Click Preview** to hear your sound
9. **Click Create** to generate and assign to the selected pad

**Pro Tip:** Use Generate mode to create custom kicks, basses, and synth stabs without needing any sample files!

---

## 🤖 AI Generator (Phase Integration)

Access via the **AI Generator** tab in the right panel (wand icon).

### Generate Tab
1. Enter a **prompt** describing the music you want
2. Set **duration** (8 seconds to 4 minutes)
3. Adjust **BPM** (syncs with your beatmaker)
4. Toggle **Instrumental** for no vocals
5. Click **Generate**

### Advanced Parameters
- Key signature (C Major, A Minor, etc.)
- Time signature (4/4, 3/4, etc.)
- Quality steps (higher = better but slower)
- Reference audio upload for style transfer

### Stems Tab
Separate any audio into:
- Vocals
- Drums
- Bass
- Other instruments

### Presets
Quick-start presets for:
- Drum loops
- Bass lines
- Melodic patterns
- Full beats

---

## ⌨️ Complete Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Space** | Play/Pause |
| **Q-Y** | Trigger pads 1-16 |
| **A-B** | Play piano keys |
| **← →** | Navigate steps |
| **↑ ↓** | Navigate pads |
| **1-9** | Jump to step |
| **Enter** | Toggle step |

---

## 💾 Saving & Projects

- **Auto-save** is enabled by default
- Projects save to browser localStorage
- Use **Project Manager** (folder icon) for manual save/load

---

## 🎯 Pro Tips

1. **Layer sounds** - Use multiple pads with similar samples for thickness
2. **Use Solo** - Isolate tracks to fine-tune individual sounds
3. **Swing** - Add groove with the swing control
4. **Record in sections** - Build patterns piece by piece
5. **Use the metronome** - Essential for tight recordings

