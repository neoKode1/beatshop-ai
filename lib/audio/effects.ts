import * as Tone from 'tone';

/**
 * Master Effects Chain for Beat Shop AI
 * Provides reverb, delay, and compression for professional sound
 */

export class MasterEffects {
  private static instance: MasterEffects | null = null;

  public reverb: Tone.Reverb | null = null;
  public delay: Tone.FeedbackDelay | null = null;
  public compressor: Tone.Compressor | null = null;
  public limiter: Tone.Limiter | null = null;
  public channel: Tone.Channel | null = null;
  private initialized: boolean = false;

  private constructor() {
    // Don't initialize in constructor - will be lazy loaded
  }

  private initialize() {
    if (this.initialized) return;

    // Create effects chain
    this.reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.15,
    });

    this.delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.3,
      wet: 0.1,
    });

    this.compressor = new Tone.Compressor({
      threshold: -20,
      ratio: 4,
      attack: 0.003,
      release: 0.1,
    });

    this.limiter = new Tone.Limiter(-1);

    this.channel = new Tone.Channel({
      volume: 0,
      pan: 0,
    });

    // Connect the chain: reverb -> delay -> compressor -> limiter -> channel -> destination
    this.reverb.connect(this.delay);
    this.delay.connect(this.compressor);
    this.compressor.connect(this.limiter);
    this.limiter.connect(this.channel);
    this.channel.toDestination();

    this.initialized = true;
  }

  public static getInstance(): MasterEffects {
    if (!MasterEffects.instance) {
      MasterEffects.instance = new MasterEffects();
    }
    return MasterEffects.instance;
  }

  public getInput(): Tone.Reverb | Tone.ToneAudioNode {
    if (!this.initialized || !this.reverb) {
      this.initialize();
    }
    return this.reverb || Tone.getDestination();
  }

  public setReverbWet(wet: number) {
    if (this.reverb) this.reverb.wet.value = wet;
  }

  public setReverbDecay(decay: number) {
    if (this.reverb) this.reverb.decay = decay;
  }

  public setDelayWet(wet: number) {
    if (this.delay) this.delay.wet.value = wet;
  }

  public setDelayTime(time: string) {
    if (this.delay) this.delay.delayTime.value = time;
  }

  public setDelayFeedback(feedback: number) {
    if (this.delay) this.delay.feedback.value = feedback;
  }

  public setMasterVolume(volume: number) {
    if (this.channel) this.channel.volume.value = Tone.gainToDb(volume);
  }

  public dispose() {
    if (this.reverb) this.reverb.dispose();
    if (this.delay) this.delay.dispose();
    if (this.compressor) this.compressor.dispose();
    if (this.limiter) this.limiter.dispose();
    if (this.channel) this.channel.dispose();
    MasterEffects.instance = null;
    this.initialized = false;
  }
}

// Lazy initialization - only create when accessed
export const getMasterEffects = () => MasterEffects.getInstance();

