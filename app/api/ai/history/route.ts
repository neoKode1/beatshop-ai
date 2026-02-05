/**
 * Generation History API Route
 * Returns past generated audio files
 */

import { NextRequest, NextResponse } from 'next/server';
import { GeneratedAudio } from '@/lib/ai/types';

// In-memory history (in production, use a database)
const history: GeneratedAudio[] = [];

/**
 * GET /api/ai/history
 * Get generation history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Return most recent first
    const results = history.slice(-limit).reverse();

    return NextResponse.json(results);
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: 'Failed to get history' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/history
 * Add item to history (internal use)
 */
export async function POST(request: NextRequest) {
  try {
    const item: GeneratedAudio = await request.json();
    
    // Add to history
    history.push({
      ...item,
      id: item.id || `gen_${Date.now()}`,
      createdAt: item.createdAt || new Date().toISOString(),
    });

    // Keep only last 100 items
    if (history.length > 100) {
      history.shift();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History save error:', error);
    return NextResponse.json(
      { error: 'Failed to save to history' },
      { status: 500 }
    );
  }
}

// Export history for other routes
export { history };

