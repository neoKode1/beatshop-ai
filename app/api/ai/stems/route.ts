/**
 * Stem Separation API Route
 * Separates audio into vocals, drums, bass, and other stems
 */

import { NextRequest, NextResponse } from 'next/server';
import { StemSeparationResult } from '@/lib/ai/types';

// Demucs backend URL (Phase server)
const DEMUCS_BACKEND_URL = process.env.DEMUCS_BACKEND_URL || process.env.ACESTEP_BACKEND_URL;

/**
 * POST /api/ai/stems
 * Separate audio into stems
 */
export async function POST(request: NextRequest) {
  try {
    const { audioUrl } = await request.json();

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Audio URL is required' },
        { status: 400 }
      );
    }

    // Check if we have a backend configured
    if (!DEMUCS_BACKEND_URL) {
      // Demo mode: return mock stems
      const mockResult: StemSeparationResult = {
        vocals: audioUrl.replace('.mp3', '_vocals.mp3'),
        drums: audioUrl.replace('.mp3', '_drums.mp3'),
        bass: audioUrl.replace('.mp3', '_bass.mp3'),
        other: audioUrl.replace('.mp3', '_other.mp3'),
        original: audioUrl,
      };
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return NextResponse.json({
        success: true,
        message: 'Demo mode: stem separation simulated',
        stems: mockResult,
      });
    }

    // Forward to Demucs backend
    const response = await fetch(`${DEMUCS_BACKEND_URL}/api/stems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioUrl }),
    });

    if (!response.ok) {
      throw new Error('Stem separation backend request failed');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Stem separation error:', error);
    return NextResponse.json(
      { error: 'Failed to separate stems' },
      { status: 500 }
    );
  }
}

