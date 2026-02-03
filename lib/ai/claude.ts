import Anthropic from '@anthropic-ai/sdk';

export interface BeatPattern {
  name: string;
  description: string;
  bpm: number;
  steps: PatternStep[];
}

export interface PatternStep {
  padIndex: number;
  stepIndex: number;
  velocity: number;
  probability?: number;
}

export class ClaudeAIService {
  private client: Anthropic | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    }
  }

  async generateBeatPattern(
    prompt: string,
    style: string,
    bpm: number,
    availablePads: { index: number; name: string; category: string }[]
  ): Promise<BeatPattern> {
    if (!this.client) {
      // Return a demo pattern if no API key
      return this.generateDemoPattern(style, bpm, availablePads);
    }

    const systemPrompt = `You are an expert music producer and beat maker. You create drum patterns and beats in various styles. 
You understand rhythm, groove, and how to make beats that feel good.

When generating patterns, consider:
- Musical timing and groove
- Velocity variations for dynamics
- Syncopation and swing
- Genre-specific characteristics
- Humanization through subtle variations`;

    const userPrompt = `Create a ${style} drum pattern based on this request: "${prompt}"

BPM: ${bpm}
Available pads:
${availablePads.map(p => `Pad ${p.index}: ${p.name} (${p.category})`).join('\n')}

Generate a 16-step pattern. Return ONLY valid JSON in this exact format:
{
  "name": "Pattern name",
  "description": "Brief description",
  "bpm": ${bpm},
  "steps": [
    { "padIndex": 0, "stepIndex": 0, "velocity": 0.8, "probability": 1.0 }
  ]
}

Guidelines:
- Kicks typically on beats 1 and 3 (steps 0, 8) for most genres
- Snares/claps on beats 2 and 4 (steps 4, 12)
- Hi-hats can be more frequent (every 2 steps or every step)
- Use velocity 0.6-1.0 for dynamics
- Probability 0.7-1.0 for humanization
- Make it groovy and musical!`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: userPrompt,
        }],
        system: systemPrompt,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        // Extract JSON from response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const pattern = JSON.parse(jsonMatch[0]);
          return pattern;
        }
      }

      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('AI generation error:', error);
      return this.generateDemoPattern(style, bpm);
    }
  }

  private generateDemoPattern(
    style: string,
    bpm: number,
    availablePads: { index: number; name: string; category: string }[]
  ): BeatPattern {
    // Map available pads by category to find which indices to use
    const kickPad = availablePads.find(p => p.category === 'kick');
    const snarePad = availablePads.find(p => p.category === 'snare');
    const hihatPad = availablePads.find(p => p.category === 'hihat');
    const percPad = availablePads.find(p => p.category === 'perc');

    // If we don't have the ideal pads, use whatever is available
    const pad0 = kickPad?.index ?? availablePads[0]?.index ?? 0;
    const pad1 = snarePad?.index ?? availablePads[1]?.index ?? 1;
    const pad2 = hihatPad?.index ?? availablePads[2]?.index ?? 2;
    const pad3 = percPad?.index ?? availablePads[3]?.index ?? 3;

    // Generate a basic pattern based on style using ACTUAL pad indices
    const patterns: { [key: string]: PatternStep[] } = {
      'hip-hop': [
        { padIndex: pad0, stepIndex: 0, velocity: 1.0 },
        { padIndex: pad0, stepIndex: 8, velocity: 0.9 },
        { padIndex: pad1, stepIndex: 4, velocity: 0.95 },
        { padIndex: pad1, stepIndex: 12, velocity: 0.95 },
        { padIndex: pad2, stepIndex: 2, velocity: 0.7 },
        { padIndex: pad2, stepIndex: 6, velocity: 0.7 },
        { padIndex: pad2, stepIndex: 10, velocity: 0.7 },
        { padIndex: pad2, stepIndex: 14, velocity: 0.7 },
      ],
      'trap': [
        { padIndex: pad0, stepIndex: 0, velocity: 1.0 },
        { padIndex: pad0, stepIndex: 6, velocity: 0.8 },
        { padIndex: pad0, stepIndex: 12, velocity: 0.9 },
        { padIndex: pad1, stepIndex: 4, velocity: 0.95 },
        { padIndex: pad2, stepIndex: 1, velocity: 0.6 },
        { padIndex: pad2, stepIndex: 2, velocity: 0.7 },
        { padIndex: pad2, stepIndex: 3, velocity: 0.6 },
        { padIndex: pad2, stepIndex: 5, velocity: 0.7 },
        { padIndex: pad2, stepIndex: 7, velocity: 0.6 },
        { padIndex: pad2, stepIndex: 9, velocity: 0.7 },
        { padIndex: pad2, stepIndex: 11, velocity: 0.6 },
        { padIndex: pad2, stepIndex: 13, velocity: 0.7 },
        { padIndex: pad2, stepIndex: 15, velocity: 0.8 },
      ],
      'house': [
        { padIndex: pad0, stepIndex: 0, velocity: 1.0 },
        { padIndex: pad0, stepIndex: 4, velocity: 1.0 },
        { padIndex: pad0, stepIndex: 8, velocity: 1.0 },
        { padIndex: pad0, stepIndex: 12, velocity: 1.0 },
        { padIndex: pad1, stepIndex: 4, velocity: 0.9 },
        { padIndex: pad1, stepIndex: 12, velocity: 0.9 },
        { padIndex: pad2, stepIndex: 2, velocity: 0.7 },
        { padIndex: pad2, stepIndex: 6, velocity: 0.7 },
        { padIndex: pad2, stepIndex: 10, velocity: 0.7 },
        { padIndex: pad2, stepIndex: 14, velocity: 0.7 },
        { padIndex: pad3, stepIndex: 0, velocity: 0.6 },
        { padIndex: pad3, stepIndex: 8, velocity: 0.6 },
      ],
    };

    const steps = patterns[style] || patterns['hip-hop'];

    // Filter out steps for pads that don't exist
    const validSteps = steps.filter(step =>
      availablePads.some(p => p.index === step.padIndex)
    );

    return {
      name: `${style.charAt(0).toUpperCase() + style.slice(1)} Beat`,
      description: `A classic ${style} drum pattern using your loaded samples`,
      bpm,
      steps: validSteps,
    };
  }
}

export const claudeService = new ClaudeAIService(process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY);

