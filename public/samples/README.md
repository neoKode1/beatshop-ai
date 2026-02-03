# Audio Samples Folder

Place your WAV, MP3, or OGG audio files here!

## Folder Structure

Organize your samples by category:

- **kicks/** - Kick drum samples
- **snares/** - Snare, clap, and rim shot samples
- **hihats/** - Hi-hat samples (closed and open)
- **percussion/** - Shakers, toms, cowbells, etc.

## Example Files

```
kicks/
  ├── kick-808.wav
  ├── kick-acoustic.wav
  └── kick-heavy.wav

snares/
  ├── snare-tight.wav
  ├── snare-clap.wav
  └── rim-shot.wav

hihats/
  ├── hihat-closed.wav
  └── hihat-open.wav

percussion/
  ├── shaker.wav
  ├── cowbell.wav
  └── tom.wav
```

## After Adding Files

1. Update `components/SampleBrowser/SampleBrowser.tsx`
2. Add entries to the `AUDIO_SAMPLES` array
3. Restart the dev server
4. Your samples will appear in the Sample Browser!

See `AUDIO_SAMPLES_GUIDE.md` in the root folder for detailed instructions.

