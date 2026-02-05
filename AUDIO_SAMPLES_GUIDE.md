# Adding Audio Samples to BeatShop AI

BeatShop AI now supports **both synthesizers and audio files (WAV/MP3)**!

## 📁 Folder Structure

Create a `public/samples/` folder in your project:

```
Beashopai/
├── public/
│   └── samples/
│       ├── kicks/
│       │   ├── kick-808.wav
│       │   ├── kick-acoustic.wav
│       │   └── kick-heavy.wav
│       ├── snares/
│       │   ├── snare-tight.wav
│       │   └── snare-clap.wav
│       ├── hihats/
│       │   ├── hihat-closed.wav
│       │   └── hihat-open.wav
│       └── percussion/
│           ├── shaker.wav
│           └── cowbell.wav
```

## 🎵 Adding Your Samples

### Step 1: Add Audio Files

1. Place your WAV or MP3 files in the `public/samples/` folder
2. Organize them by category (kicks, snares, hihats, etc.)

### Step 2: Update the Sample List

Open `components/SampleBrowser/SampleBrowser.tsx` and add your samples to the `AUDIO_SAMPLES` array:

```typescript
const AUDIO_SAMPLES: Sample[] = [
  // Kicks
  { 
    id: 'kick_808_audio', 
    name: 'Kick 808 (Audio)', 
    type: 'audio', 
    url: '/samples/kicks/kick-808.wav', 
    category: 'kick' 
  },
  { 
    id: 'kick_heavy', 
    name: 'Kick Heavy', 
    type: 'audio', 
    url: '/samples/kicks/kick-heavy.wav', 
    category: 'kick' 
  },
  
  // Snares
  { 
    id: 'snare_tight', 
    name: 'Snare Tight', 
    type: 'audio', 
    url: '/samples/snares/snare-tight.wav', 
    category: 'snare' 
  },
  
  // Hi-Hats
  { 
    id: 'hihat_closed', 
    name: 'Hi-Hat Closed', 
    type: 'audio', 
    url: '/samples/hihats/hihat-closed.wav', 
    category: 'hihat' 
  },
  
  // Add more samples here...
];
```

## 📋 Sample Properties

Each sample needs these properties:

- **id**: Unique identifier (e.g., `'kick_808_audio'`)
- **name**: Display name (e.g., `'Kick 808 (Audio)'`)
- **type**: Must be `'audio'` for WAV/MP3 files
- **url**: Path to the file (e.g., `'/samples/kicks/kick-808.wav'`)
- **category**: One of: `'kick'`, `'snare'`, `'hihat'`, `'perc'`, `'bass'`, `'synth'`, `'fx'`, `'melodic'`

## 🎹 Categories

Available categories:
- **kick** - Kick drums
- **snare** - Snares, claps, rim shots
- **hihat** - Hi-hats (closed and open)
- **perc** - Percussion (shakers, toms, cowbells, etc.)
- **bass** - Bass sounds
- **synth** - Synthesizer sounds
- **fx** - Sound effects
- **melodic** - Melodic instruments

## 🔊 Supported Formats

- **WAV** (recommended for best quality)
- **MP3** (smaller file size)
- **OGG** (also supported by Tone.js)

## 💡 Tips

1. **Keep files small** - Aim for 1-2 seconds max for drum hits
2. **Normalize audio** - Make sure all samples have similar volume levels
3. **Use 44.1kHz or 48kHz** - Standard sample rates work best
4. **Mono is fine** - Drum samples don't need to be stereo

## 🎯 Example: Adding a Complete Drum Kit

```typescript
const AUDIO_SAMPLES: Sample[] = [
  // Kicks
  { id: 'kick1', name: 'Kick 1', type: 'audio', url: '/samples/kick1.wav', category: 'kick' },
  { id: 'kick2', name: 'Kick 2', type: 'audio', url: '/samples/kick2.wav', category: 'kick' },
  
  // Snares
  { id: 'snare1', name: 'Snare 1', type: 'audio', url: '/samples/snare1.wav', category: 'snare' },
  { id: 'clap1', name: 'Clap 1', type: 'audio', url: '/samples/clap1.wav', category: 'snare' },
  
  // Hi-Hats
  { id: 'hh_closed', name: 'HH Closed', type: 'audio', url: '/samples/hh-closed.wav', category: 'hihat' },
  { id: 'hh_open', name: 'HH Open', type: 'audio', url: '/samples/hh-open.wav', category: 'hihat' },
  
  // Percussion
  { id: 'shaker1', name: 'Shaker', type: 'audio', url: '/samples/shaker.wav', category: 'perc' },
  { id: 'cowbell1', name: 'Cowbell', type: 'audio', url: '/samples/cowbell.wav', category: 'perc' },
];
```

## 🚀 Where to Find Free Samples

- **Freesound.org** - Huge library of free samples
- **Splice** - Free tier available
- **99Sounds** - Free sample packs
- **Bedroom Producers Blog** - Free sample packs
- **Samples From Mars** - Free sample packs

## ✅ Testing Your Samples

1. Restart the dev server after adding samples
2. Click the category in the Sample Browser
3. Click "Preview" to test the sound
4. Drag and drop onto a pad
5. Click the pad or use keyboard to trigger

Enjoy making beats! 🎵

