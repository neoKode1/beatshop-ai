/**
 * Prompt Format/Enhancement API Route
 * Uses LLM to enhance user prompts with lyrics, title, and tags
 */

import { NextRequest, NextResponse } from 'next/server';
import { FormatResponse } from '@/lib/ai/types';

// Anthropic API for prompt enhancement (same as existing Claude service)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * POST /api/ai/format
 * Format and enhance a music prompt
 */
export async function POST(request: NextRequest) {
  try {
    const { topic, style } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // If no API key, return a generated response based on the input
    if (!ANTHROPIC_API_KEY) {
      const mockResponse: FormatResponse = generateMockResponse(topic, style);
      return NextResponse.json(mockResponse);
    }

    // Use Claude to generate enhanced prompt, lyrics, and tags
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Generate a song based on this topic: "${topic}"
Style: ${style || 'any genre'}

Respond in JSON format with:
- title: A catchy song title
- lyrics: Song lyrics with [Verse], [Chorus], [Bridge] sections
- tags: Array of 3-5 style/genre tags
- enhancedPrompt: A detailed music production prompt describing instruments, mood, tempo

Only respond with valid JSON, no other text.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Claude API request failed');
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error('No response from Claude');
    }

    // Parse the JSON response
    const parsed: FormatResponse = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Format error:', error);
    
    // Return mock response on error
    const { topic, style } = await request.json().catch(() => ({ topic: '', style: '' }));
    return NextResponse.json(generateMockResponse(topic || 'music', style));
  }
}

/**
 * Generate a mock response for demo/fallback
 */
function generateMockResponse(topic: string, style: string): FormatResponse {
  const styles = style?.toLowerCase() || '';
  
  let tags: string[] = ['electronic', 'modern', 'groovy'];
  if (styles.includes('trap')) tags = ['trap', 'hip-hop', '808s', 'hard'];
  else if (styles.includes('house')) tags = ['house', 'dance', 'four-on-the-floor', 'uplifting'];
  else if (styles.includes('lofi') || styles.includes('lo-fi')) tags = ['lo-fi', 'chill', 'relaxed', 'jazzy'];
  else if (styles.includes('rock')) tags = ['rock', 'guitar', 'energetic', 'powerful'];
  else if (styles.includes('jazz')) tags = ['jazz', 'smooth', 'instrumental', 'sophisticated'];

  return {
    title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Vibes`,
    lyrics: `[Verse 1]
${topic}, flowing through the night
Every moment feels so right
${style || 'Music'} taking me away
In this groove I want to stay

[Chorus]
Feel the rhythm, feel the beat
${topic} makes my heart complete
Moving to the sound we make
This is music, can't be fake

[Verse 2]
Waves of sound surround us all
Rising high, we'll never fall
${style || 'The melody'} guides the way
Tomorrow starts today`,
    tags,
    enhancedPrompt: `Create a ${style || 'modern electronic'} track about ${topic}. 
Include punchy drums, atmospheric synths, and a catchy melodic hook. 
The mood should be ${tags.includes('chill') ? 'relaxed and smooth' : 'energetic and uplifting'}. 
Add subtle bass movement and dynamic builds.`,
  };
}

