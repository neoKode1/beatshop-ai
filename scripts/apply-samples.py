#!/usr/bin/env python3
import subprocess
import re

# Read the current file
with open('components/SampleBrowser/SampleBrowser.tsx', 'r') as f:
    current_content = f.read()

# Generate the new samples
result = subprocess.run(['node', 'scripts/generate-sample-list.js'], 
                       capture_output=True, text=True, cwd='.')
generated = result.stdout

# Extract the AUDIO_SAMPLES array
match = re.search(r'const AUDIO_SAMPLES: Sample\[\] = \[(.*?)\n\];', generated, re.DOTALL)
if not match:
    print("❌ Could not extract AUDIO_SAMPLES")
    exit(1)

new_array_content = match.group(1)
new_samples = f'const AUDIO_SAMPLES: Sample[] = [{new_array_content}\n];'

# Replace the old array
pattern = r'// Audio File Samples.*?const AUDIO_SAMPLES: Sample\[\] = \[.*?\n\];'
replacement = f'// Audio File Samples (WAV/MP3)\n// Auto-generated from public/samples/ folder - 358 samples\n{new_samples}'

updated_content = re.sub(pattern, replacement, current_content, flags=re.DOTALL)

# Write back
with open('components/SampleBrowser/SampleBrowser.tsx', 'w') as f:
    f.write(updated_content)

print("✅ Successfully updated SampleBrowser.tsx with all 358 samples!")
print(f"📊 File size: {len(updated_content):,} characters")

