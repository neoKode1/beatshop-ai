#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const samplesDir = path.join(__dirname, '../public/samples');
const outputFile = path.join(__dirname, '../lib/data/audioSamples.ts');

// Smart categorization
function getCategoryFromFileName(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.includes('808') || lower.includes('kick')) return 'kick';
  if (lower.includes('snare') || lower.includes('clap')) return 'snare';
  if (lower.includes('hihat') || lower.includes('hat')) return 'hihat';
  if (lower.includes('bass')) return 'bass';
  if (lower.includes('guitar') || lower.includes('key') || lower.includes('piano') || 
      lower.includes('bell') || lower.includes('inst') || lower.includes('pluck') ||
      lower.includes('pad') || lower.includes('lead') || lower.includes('synth') ||
      lower.includes('brass')) return 'melodic';
  return 'perc';
}

const audioExts = ['.wav', '.mp3', '.ogg'];
const samples = [];
let idx = 0;

// Scan folders
fs.readdirSync(samplesDir).forEach(folder => {
  const folderPath = path.join(samplesDir, folder);
  if (!fs.statSync(folderPath).isDirectory()) return;
  
  fs.readdirSync(folderPath).forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (!audioExts.includes(ext)) return;

    const name = path.basename(file, ext)
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    // For Next.js public folder, we need to encode spaces but keep + as literal
    // encodeURIComponent would turn + into %2B which doesn't work with Next.js
    const encodedFile = file.replace(/ /g, '%20');
    const encodedFolder = folder.replace(/ /g, '%20');

    samples.push({
      id: `sample_${idx++}`,
      name,
      type: 'audio',
      url: `/samples/${encodedFolder}/${encodedFile}`,
      category: getCategoryFromFileName(file)
    });
  });
});

// Generate file
const content = `// Auto-generated audio samples - ${samples.length} total
// Generated: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Run 'node scripts/update-audio-samples.js' to regenerate

import { Sample } from '@/store/useBeatStore';

export const AUDIO_SAMPLES: Sample[] = ${JSON.stringify(samples, null, 2)};
`;

fs.writeFileSync(outputFile, content);
console.log(`✅ Generated ${samples.length} samples to ${outputFile}`);

