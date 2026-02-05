/**
 * Groove Templates - Classic MPC and SP-1200 style swing/groove patterns
 * 
 * Each template defines microtiming offsets for a 16-step pattern (1 bar in 4/4).
 * Values are in milliseconds, with negative = early, positive = late.
 */

export interface GrooveTemplate {
  id: string;
  name: string;
  description: string;
  category: 'mpc' | 'sp1200' | 'custom' | 'classic';
  // Microtiming offsets for each of 16 steps (in ms, -50 to +50)
  offsets: number[];
  // Velocity multipliers for each step (0.5 - 1.5, 1.0 = no change)
  velocities?: number[];
}

// MPC 60 had a distinct 66.6% swing feel (triplet-based)
const MPC60_SWING: number[] = [
  0,    // 1 (downbeat - always on)
  0,    // 1e
  15,   // 1& (swung late)
  0,    // 1a
  0,    // 2
  0,    // 2e
  15,   // 2&
  0,    // 2a
  0,    // 3
  0,    // 3e
  15,   // 3&
  0,    // 3a
  0,    // 4
  0,    // 4e
  15,   // 4&
  0,    // 4a
];

// MPC 3000 - Tighter swing, cleaner quantize feel
const MPC3000_SWING: number[] = [
  0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 12, 0,
];

// SP-1200 - Famous gritty, loose timing (J Dilla, Pete Rock, etc.)
const SP1200_LOOSE: number[] = [
  0, -3, 18, 2, 0, -2, 20, 3, 0, -4, 17, 1, 0, -3, 19, 2,
];

// SP-1200 with stronger "drunk" feel
const SP1200_DRUNK: number[] = [
  0, -5, 25, 5, -2, -8, 28, 7, 0, -6, 22, 4, -3, -4, 26, 6,
];

// Classic 16th note swing (57%)
const SWING_57: number[] = [
  0, 0, 7, 0, 0, 0, 7, 0, 0, 0, 7, 0, 0, 0, 7, 0,
];

// Heavy triplet swing (67% - classic shuffle)
const SWING_67: number[] = [
  0, 0, 22, 0, 0, 0, 22, 0, 0, 0, 22, 0, 0, 0, 22, 0,
];

// Lazy hip-hop feel (J Dilla style)
const DILLA_LAZY: number[] = [
  0, 8, 18, -5, 3, 12, 22, -8, 0, 6, 20, -3, 5, 10, 19, -6,
];

// Velocities for humanization patterns
const ACCENT_2_4: number[] = [
  0.9, 0.7, 1.1, 0.8, 0.9, 0.7, 1.1, 0.8, 0.9, 0.7, 1.1, 0.8, 0.9, 0.7, 1.1, 0.8,
];

export const GROOVE_TEMPLATES: GrooveTemplate[] = [
  {
    id: 'mpc60',
    name: 'MPC 60',
    description: 'Classic Akai MPC 60 swing - the original hip-hop groove',
    category: 'mpc',
    offsets: MPC60_SWING,
    velocities: ACCENT_2_4,
  },
  {
    id: 'mpc3000',
    name: 'MPC 3000',
    description: 'Cleaner MPC 3000 swing - tighter, more modern feel',
    category: 'mpc',
    offsets: MPC3000_SWING,
  },
  {
    id: 'sp1200',
    name: 'SP-1200 Classic',
    description: 'E-mu SP-1200 loose timing - gritty boom-bap feel',
    category: 'sp1200',
    offsets: SP1200_LOOSE,
  },
  {
    id: 'sp1200-drunk',
    name: 'SP-1200 Drunk',
    description: 'Exaggerated SP-1200 "drunk" swing - maximum slop',
    category: 'sp1200',
    offsets: SP1200_DRUNK,
  },
  {
    id: 'swing-57',
    name: 'Swing 57%',
    description: 'Light 16th note swing - subtle groove',
    category: 'classic',
    offsets: SWING_57,
  },
  {
    id: 'swing-67',
    name: 'Swing 67%',
    description: 'Triplet shuffle - classic R&B/Soul feel',
    category: 'classic',
    offsets: SWING_67,
  },
  {
    id: 'dilla',
    name: 'J Dilla Style',
    description: 'Lazy, human feel - off-kilter neo-soul groove',
    category: 'custom',
    offsets: DILLA_LAZY,
  },
  {
    id: 'straight',
    name: 'Straight (No Swing)',
    description: 'Machine-like quantized timing - no swing',
    category: 'classic',
    offsets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
];

/**
 * Apply a groove template to the current pattern
 * @param template The groove template to apply
 * @param amount 0-100%, interpolates between straight and full template
 */
export function calculateGrooveOffset(
  template: GrooveTemplate,
  stepIndex: number,
  amount: number = 100
): number {
  const normalizedStep = stepIndex % 16;
  const offset = template.offsets[normalizedStep] || 0;
  return Math.round(offset * (amount / 100));
}

export function calculateGrooveVelocity(
  template: GrooveTemplate,
  stepIndex: number,
  baseVelocity: number,
  amount: number = 100
): number {
  if (!template.velocities) return baseVelocity;
  const normalizedStep = stepIndex % 16;
  const multiplier = template.velocities[normalizedStep] || 1.0;
  const adjustedMultiplier = 1 + (multiplier - 1) * (amount / 100);
  return Math.max(0.1, Math.min(1.0, baseVelocity * adjustedMultiplier));
}

