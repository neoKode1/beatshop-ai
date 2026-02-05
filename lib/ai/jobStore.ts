/**
 * Shared Job Store for AI Generation
 * Uses a global variable to persist jobs across API route invocations
 */

import { GenerationJob } from './types';

// Use globalThis to persist across module reloads in development
declare global {
  // eslint-disable-next-line no-var
  var __aiJobStore: Map<string, GenerationJob> | undefined;
}

// Initialize or reuse the global job store
if (!globalThis.__aiJobStore) {
  globalThis.__aiJobStore = new Map<string, GenerationJob>();
}

export const jobStore = globalThis.__aiJobStore;

/**
 * Get a job by ID
 */
export function getJob(jobId: string): GenerationJob | undefined {
  return jobStore.get(jobId);
}

/**
 * Set/update a job
 */
export function setJob(jobId: string, job: GenerationJob): void {
  jobStore.set(jobId, job);
}

/**
 * Delete a job
 */
export function deleteJob(jobId: string): boolean {
  return jobStore.delete(jobId);
}

/**
 * Get all jobs
 */
export function getAllJobs(): GenerationJob[] {
  return Array.from(jobStore.values());
}

/**
 * Clear old jobs (older than specified hours)
 */
export function clearOldJobs(hoursOld: number = 24): number {
  const cutoff = Date.now() - (hoursOld * 60 * 60 * 1000);
  let cleared = 0;
  
  for (const [jobId, job] of jobStore.entries()) {
    const createdAt = new Date(job.createdAt).getTime();
    if (createdAt < cutoff) {
      jobStore.delete(jobId);
      cleared++;
    }
  }
  
  return cleared;
}

