#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const samplesDir = path.join(__dirname, '../public/samples');

// Smart categorization based on file name
function getCategoryFromFileName(fileName) {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('808') || lowerName.includes('kick')) return 'kick';
  if (lowerName.includes('snare') || lowerName.includes('clap')) return 'snare';
  if (lowerName.includes('hihat') || lowerName.includes('hat')) return 'hihat';
  if (lowerName.includes('bass')) return 'bass';
  if (lowerName.includes('guitar') || lowerName.includes('key') || lowerName.includes('piano') || 
      lowerName.includes('bell') || lowerName.includes('inst') || lowerName.includes('pluck') ||
      lowerName.includes('pad') || lowerName.includes('lead') || lowerName.includes('synth') ||
      lowerName.includes('brass')) return 'melodic';
  
  return 'perc';
}

const audioExtensions = ['.wav', '.mp3', '.ogg'];
const allSamples = [];
let sampleIndex = 0;

// Scan all folders
const folders = fs.readdirSync(samplesDir);

folders.forEach(folder => {
  const folderPath = path.join(samplesDir, folder);
  
  if (fs.statSync(folderPath).isDirectory()) {
    const files = fs.readdirSync(folderPath);
    
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      
      if (audioExtensions.includes(ext)) {
        const baseName = path.basename(file, ext);
        const cleanName = baseName
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        const category = getCategoryFromFileName(file);
        const url = `/samples/${folder}/${file}`;
        
        allSamples.push({
          id: `sample_${sampleIndex++}`,
          name: cleanName,
          type: 'audio',
          url,
          category
        });
      }
    });
  }
});

// Generate TypeScript file
const output = `// Auto-generated audio samples from public/samples/
// Total samples: ${allSamples.length}
// Generated: ${new Date().toISOString()}

import { Sample } from '@/store/useBeatStore';

export const AUDIO_SAMPLES: Sample[] = ${JSON.stringify(allSamples, null, 2)};
`;

// Write to file
const outputPath = path.join(__dirname, '../lib/audio/audioSamples.ts');
fs.writeFileSync(outputPath, output);

console.log(`✅ Generated ${allSamples.length} samples to lib/audio/audioSamples.ts`);

