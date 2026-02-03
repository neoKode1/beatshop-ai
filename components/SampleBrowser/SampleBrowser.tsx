'use client';

import React, { useState } from 'react';
import { useBeatStore, Sample, SynthType } from '@/store/useBeatStore';
import { Music, Drum, Zap } from 'lucide-react';
import * as Tone from 'tone';
import { DrumSynthesizer, BassSynthesizer } from '@/lib/audio/synthesizers';
import { AUDIO_SAMPLES } from '@/lib/data/audioSamples';

// Tone.js Synthesizer Samples
const SYNTH_SAMPLES: Sample[] = [
  { id: 'kick1', name: 'Kick 808', type: 'synth', synthType: 'kick808', category: 'kick' },
  { id: 'kick2', name: 'Kick Acoustic', type: 'synth', synthType: 'kickAcoustic', category: 'kick' },
  { id: 'snare1', name: 'Snare', type: 'synth', synthType: 'snare', category: 'snare' },
  { id: 'snare2', name: 'Clap', type: 'synth', synthType: 'clap', category: 'snare' },
  { id: 'snare3', name: 'Rim Shot', type: 'synth', synthType: 'rimShot', category: 'snare' },
  { id: 'hihat1', name: 'Hi-Hat Closed', type: 'synth', synthType: 'hihatClosed', category: 'hihat' },
  { id: 'hihat2', name: 'Hi-Hat Open', type: 'synth', synthType: 'hihatOpen', category: 'hihat' },
  { id: 'perc1', name: 'Shaker', type: 'synth', synthType: 'shaker', category: 'perc' },
  { id: 'perc2', name: 'Tom', type: 'synth', synthType: 'tom', category: 'perc' },
  { id: 'perc3', name: 'Cowbell', type: 'synth', synthType: 'cowbell', category: 'perc' },
  { id: 'bass1', name: 'Sub Bass', type: 'synth', synthType: 'subBass', category: 'bass', pitch: 'C1' },
];

// Audio samples imported from auto-generated file
// To regenerate: node scripts/update-audio-samples.js

// Combine all samples (11 synths + 358 audio samples = 369 total)
const ALL_SAMPLES = [...SYNTH_SAMPLES, ...AUDIO_SAMPLES];

const SampleBrowser: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [draggedSample, setDraggedSample] = useState<Sample | null>(null);
  const assignSampleToPad = useBeatStore(state => state.assignSampleToPad);

  const categories = [
    { id: 'all', name: 'All', icon: Music },
    { id: 'kick', name: 'Kicks', icon: Drum },
    { id: 'snare', name: 'Snares', icon: Drum },
    { id: 'hihat', name: 'Hi-Hats', icon: Drum },
    { id: 'perc', name: 'Percussion', icon: Drum },
    { id: 'bass', name: 'Bass', icon: Music },
    { id: 'synth', name: 'Synths', icon: Music },
    { id: 'melodic', name: 'Loops', icon: Music },
    { id: 'fx', name: 'FX', icon: Zap },
  ];

  const filteredSamples = selectedCategory === 'all'
    ? ALL_SAMPLES
    : ALL_SAMPLES.filter(s => s.category === selectedCategory);

  const previewSample = async (sample: Sample) => {
    await Tone.start();

    if (sample.type === 'synth' && sample.synthType) {
      // Create temporary synth for preview
      let synth: any;
      switch (sample.synthType) {
        case 'kick808': synth = DrumSynthesizer.createKick808(); break;
        case 'kickAcoustic': synth = DrumSynthesizer.createKickAcoustic(); break;
        case 'snare': synth = DrumSynthesizer.createSnare(); break;
        case 'clap': synth = DrumSynthesizer.createClap(); break;
        case 'hihatClosed': synth = DrumSynthesizer.createHiHatClosed(); break;
        case 'hihatOpen': synth = DrumSynthesizer.createHiHatOpen(); break;
        case 'rimShot': synth = DrumSynthesizer.createRimShot(); break;
        case 'tom': synth = DrumSynthesizer.createTom(); break;
        case 'shaker': synth = DrumSynthesizer.createShaker(); break;
        case 'cowbell': synth = DrumSynthesizer.createCowbell(); break;
        case 'subBass': synth = BassSynthesizer.createSubBass(); break;
        default: synth = DrumSynthesizer.createKick808();
      }

      // Trigger the synth
      const time = Tone.now();
      if (synth instanceof Tone.NoiseSynth || synth instanceof Tone.MetalSynth) {
        synth.triggerAttackRelease('16n', time, 0.8);
      } else {
        synth.triggerAttackRelease(sample.pitch || 'C2', '16n', time, 0.8);
      }

      // Dispose after playing
      setTimeout(() => synth.dispose(), 1000);
    } else if (sample.type === 'audio' && sample.url) {
      // Preview audio file
      const player = new Tone.Player(sample.url).toDestination();
      await player.load(sample.url);
      player.start();

      // Dispose after playing
      setTimeout(() => player.dispose(), 3000);
    }
  };

  const handleDragStart = (e: React.DragEvent, sample: Sample) => {
    setDraggedSample(sample);
    e.dataTransfer.setData('application/json', JSON.stringify(sample));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedSample(null);
  };

  return (
    <div className="sample-browser h-full flex flex-col">
      <div className="p-4 border-b-2 border-gray-900/50">
        <h2 className="text-lg font-semibold mb-3 text-gray-300">Sample Library</h2>
        
        {/* Category Filter */}
        <div className="space-y-1">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all font-semibold ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                <Icon size={16} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sample List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredSamples.map(sample => (
          <div
            key={sample.id}
            draggable
            onDragStart={(e) => handleDragStart(e, sample)}
            onDragEnd={handleDragEnd}
            className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:from-gray-700/80 hover:to-gray-800/80 rounded-lg p-3 cursor-move transition-all border border-gray-700/50 hover:border-purple-500/70 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-200">{sample.name}</div>
                <div className="text-xs text-gray-500 uppercase font-semibold">{sample.category}</div>
              </div>
              <button
                onClick={() => previewSample(sample)}
                className="px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 rounded text-xs font-bold text-white shadow-md transition-all"
              >
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t-2 border-gray-900/50 bg-gradient-to-b from-[#1F1F1F] to-[#1A1A1A]">
        <p className="text-xs text-gray-500">
          💡 Drag samples to pads, sequencer, or click a pad to select
        </p>
      </div>
    </div>
  );
};

export default SampleBrowser;

