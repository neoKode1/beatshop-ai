/**
 * ACE-Step AI Music Generation Service
 * Client-side service for interacting with the generation API
 */

import {
  GenerationParams,
  GenerationJob,
  GeneratedAudio,
  FormatResponse,
  StemSeparationResult,
  DEFAULT_GENERATION_PARAMS,
  JobStatus,
} from './types';

// API base URL - can be configured for different environments
const API_BASE_URL = process.env.NEXT_PUBLIC_ACESTEP_API_URL || '/api/ai';

/**
 * ACE-Step Service for AI music generation
 */
class AceStepService {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Submit a generation job
   */
  async generate(params: GenerationParams): Promise<GenerationJob> {
    const fullParams = { ...DEFAULT_GENERATION_PARAMS, ...params };
    
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullParams),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start generation');
    }

    return response.json();
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<GenerationJob> {
    const response = await fetch(`${API_BASE_URL}/generate/${jobId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get job status');
    }

    return response.json();
  }

  /**
   * Poll for job completion
   */
  pollJobStatus(
    jobId: string,
    onUpdate: (job: GenerationJob) => void,
    onComplete: (job: GenerationJob) => void,
    onError: (error: Error) => void,
    intervalMs: number = 2000
  ): () => void {
    const poll = async () => {
      try {
        const job = await this.getJobStatus(jobId);
        onUpdate(job);

        if (job.status === 'completed') {
          this.stopPolling(jobId);
          onComplete(job);
        } else if (job.status === 'failed') {
          this.stopPolling(jobId);
          onError(new Error(job.error || 'Generation failed'));
        }
      } catch (error) {
        this.stopPolling(jobId);
        onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const interval = setInterval(poll, intervalMs);
    this.pollingIntervals.set(jobId, interval);

    // Return cleanup function
    return () => this.stopPolling(jobId);
  }

  /**
   * Stop polling for a job
   */
  private stopPolling(jobId: string): void {
    const interval = this.pollingIntervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(jobId);
    }
  }

  /**
   * Format/enhance a prompt using LLM
   */
  async formatPrompt(
    topic: string,
    style: string
  ): Promise<FormatResponse> {
    const response = await fetch(`${API_BASE_URL}/format`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, style }),
    });

    if (!response.ok) {
      throw new Error('Failed to format prompt');
    }

    return response.json();
  }

  /**
   * Separate audio into stems using Demucs
   */
  async separateStems(audioUrl: string): Promise<StemSeparationResult> {
    const response = await fetch(`${API_BASE_URL}/stems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to separate stems');
    }

    return response.json();
  }

  /**
   * Upload reference audio for style transfer
   */
  async uploadReferenceAudio(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('audio', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload audio');
    }

    return response.json();
  }

  /**
   * Get generation history
   */
  async getHistory(limit: number = 20): Promise<GeneratedAudio[]> {
    const response = await fetch(`${API_BASE_URL}/history?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to get history');
    }

    return response.json();
  }
}

// Export singleton instance
export const aceStepService = new AceStepService();

