#!/usr/bin/env node

/**
 * Generate Sample List Helper
 * 
 * This script scans the public/samples folder and generates
 * the code you need to add to AUDIO_SAMPLES array.
 * 
 * Usage:
 *   node scripts/generate-sample-list.js
 */

const fs = require('fs');
const path = require('path');

const samplesDir = path.join(__dirname, '../public/samples');

// Category mapping based on folder names and file names
const categoryMap = {
  'kicks': 'kick',
  'snares': 'snare',
  'hihats': 'hihat',
  'percussion': 'perc',
  'loops': 'melodic',
  'bass': 'bass',
  'synths': 'synth',
  'fx': 'fx',
};

// Smart categorization based on file name
function getCategoryFromFileName(fileName, folderName) {
  const lowerName = fileName.toLowerCase();

  // Check file name for category hints
  if (lowerName.includes('808') || lowerName.includes('kick')) return 'kick';
  if (lowerName.includes('snare') || lowerName.includes('clap')) return 'snare';
  if (lowerName.includes('hihat') || lowerName.includes('hat')) return 'hihat';
  if (lowerName.includes('bass')) return 'bass';
  if (lowerName.includes('guitar') || lowerName.includes('key') || lowerName.includes('piano') ||
      lowerName.includes('bell') || lowerName.includes('inst') || lowerName.includes('pluck') ||
      lowerName.includes('pad') || lowerName.includes('lead') || lowerName.includes('synth') ||
      lowerName.includes('brass')) return 'melodic';

  // Check folder name
  if (categoryMap[folderName.toLowerCase()]) {
    return categoryMap[folderName.toLowerCase()];
  }

  // Default to percussion
  return 'perc';
}

// Supported audio formats
const audioExtensions = ['.wav', '.mp3', '.ogg'];

function scanFolder(folderPath, category) {
  const samples = [];
  
  try {
    const files = fs.readdirSync(folderPath);
    
    files.forEach((file, index) => {
      const ext = path.extname(file).toLowerCase();
      
      if (audioExtensions.includes(ext)) {
        const baseName = path.basename(file, ext);
        const cleanName = baseName
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        const id = `${category}_${index + 1}`;
        const url = `/samples/${path.basename(folderPath)}/${file}`;
        const smartCategory = getCategoryFromFileName(file, path.basename(folderPath));

        samples.push({
          id,
          name: cleanName,
          url,
          category: smartCategory
        });
      }
    });
  } catch (err) {
    // Folder doesn't exist, skip
  }
  
  return samples;
}

function generateCode() {
  console.log('// Generated Sample List\n');
  console.log('const AUDIO_SAMPLES: Sample[] = [');
  
  const folders = fs.readdirSync(samplesDir);
  
  folders.forEach(folder => {
    const folderPath = path.join(samplesDir, folder);
    
    if (fs.statSync(folderPath).isDirectory()) {
      const samples = scanFolder(folderPath, folder);
      
      if (samples.length > 0) {
        console.log(`  // ${folder.charAt(0).toUpperCase() + folder.slice(1)}`);
        
        samples.forEach(sample => {
          console.log(`  {`);
          console.log(`    id: '${sample.id}',`);
          console.log(`    name: '${sample.name}',`);
          console.log(`    type: 'audio',`);
          console.log(`    url: '${sample.url}',`);
          console.log(`    category: '${sample.category}'`);
          console.log(`  },`);
        });
        
        console.log('');
      }
    }
  });
  
  console.log('];\n');
}

console.log('='.repeat(60));
console.log('Audio Sample List Generator');
console.log('='.repeat(60));
console.log('');

generateCode();

console.log('='.repeat(60));
console.log('Copy the code above and paste it into:');
console.log('components/SampleBrowser/SampleBrowser.tsx');
console.log('Replace the AUDIO_SAMPLES array with this code.');
console.log('='.repeat(60));

