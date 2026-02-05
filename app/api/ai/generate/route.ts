/**
 * AI Music Generation API Route
 * Handles generation requests to ACE-Step backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { GenerationParams, GenerationJob } from '@/lib/ai/types';
import { getJob, setJob } from '@/lib/ai/jobStore';

// ACE-Step backend URL (Phase server)
const ACESTEP_BACKEND_URL = process.env.ACESTEP_BACKEND_URL || 'http://localhost:3001';

/**
 * POST /api/ai/generate
 * Submit a new generation job
 */
export async function POST(request: NextRequest) {
  try {
    const params: GenerationParams = await request.json();

    // Validate required parameters
    if (!params.prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Generate a unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create initial job record
    const job: GenerationJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      message: 'Starting generation...',
      createdAt: new Date().toISOString(),
    };

    setJob(jobId, job);

    // Forward request to ACE-Step backend (Phase server)
    // In development/demo mode, we'll simulate the generation
    const isDemoMode = !process.env.ACESTEP_BACKEND_URL;

    if (isDemoMode) {
      // Demo mode: simulate generation
      simulateGeneration(jobId, params);
    } else {
      // Production mode: forward to ACE-Step backend
      forwardToBackend(jobId, params);
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to start generation' },
      { status: 500 }
    );
  }
}

/**
 * Simulate generation for demo/development mode
 */
async function simulateGeneration(jobId: string, params: GenerationParams) {
  const job = getJob(jobId);
  if (!job) return;

  // Update to processing
  job.status = 'processing';
  job.message = 'Generating music...';
  job.progress = 10;

  // Simulate progress over time
  const stages = [
    { progress: 30, message: 'Analyzing prompt...' },
    { progress: 50, message: 'Generating audio...' },
    { progress: 70, message: 'Processing vocals...' },
    { progress: 90, message: 'Finalizing...' },
  ];

  for (const stage of stages) {
    await sleep(1500);
    job.progress = stage.progress;
    job.message = stage.message;
  }

  // Complete with demo audio
  await sleep(1000);
  job.status = 'completed';
  job.progress = 100;
  job.message = 'Generation complete!';
  job.completedAt = new Date().toISOString();

  // Use existing sample files for demo mode
  // In production, this would be the actual generated audio from ACE-Step
  const demoAudioFiles = [
    '/samples/loops/looperman-l-6985427-0416964-dreamy-synth-melody.wav',
    '/samples/loops/looperman-l-7540627-0416967-epic-orchestra-loop.wav',
  ];
  // Pick a random demo file
  const randomIndex = Math.floor(Math.random() * demoAudioFiles.length);
  job.audioUrls = [demoAudioFiles[randomIndex]];
}

/**
 * Forward generation request to ACE-Step backend
 */
async function forwardToBackend(jobId: string, params: GenerationParams) {
  const job = getJob(jobId);
  if (!job) return;

  try {
    job.status = 'processing';
    job.message = 'Connecting to ACE-Step...';

    const response = await fetch(`${ACESTEP_BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        jobId,
      }),
    });

    if (!response.ok) {
      throw new Error('Backend request failed');
    }

    const result = await response.json();
    
    // Poll for completion
    pollBackendStatus(jobId, result.backendJobId);
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
  }
}

/**
 * Poll ACE-Step backend for job status
 */
async function pollBackendStatus(jobId: string, backendJobId: string) {
  const job = getJob(jobId);
  if (!job) return;

  const maxAttempts = 120; // 4 minutes max
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        `${ACESTEP_BACKEND_URL}/api/generate/status/${backendJobId}`
      );
      const status = await response.json();

      job.progress = status.progress || job.progress;
      job.message = status.message || job.message;

      if (status.status === 'completed') {
        job.status = 'completed';
        job.audioUrls = status.audioUrls;
        job.completedAt = new Date().toISOString();
        return;
      } else if (status.status === 'failed') {
        job.status = 'failed';
        job.error = status.error;
        return;
      }
    } catch (error) {
      console.error('Polling error:', error);
    }

    await sleep(2000);
    attempts++;
  }

  job.status = 'failed';
  job.error = 'Generation timed out';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Job store is now in lib/ai/jobStore.ts

