import * as Tone from 'tone';

/**
 * Master Effects Chain for BeatShop AI
 * Provides complete mastering chain: EQ, Compression, Effects, Limiting
 */

export class MasterEffects {
  private static instance: MasterEffects | null = null;

  // Effects chain components
  public eq3: Tone.EQ3 | null = null;
  public distortion: Tone.Distortion | null = null;
  public reverb: Tone.Reverb | null = null;
  public delay: Tone.FeedbackDelay | null = null;
  public compressor: Tone.Compressor | null = null;
  public limiter: Tone.Limiter | null = null;
  public stereoWidener: Tone.StereoWidener | null = null;
  public channel: Tone.Channel | null = null;
  public meter: Tone.Meter | null = null;  // For volume metering
  // Modulation effects
  public chorus: Tone.Chorus | null = null;
  public phaser: Tone.Phaser | null = null;
  public flanger: Tone.FeedbackDelay | null = null; // Flanger is short delay with feedback
  public bitcrusher: Tone.BitCrusher | null = null;
  private initialized: boolean = false;

  private constructor() {
    // Don't initialize in constructor - will be lazy loaded
  }

  private initialize() {
    if (this.initialized) return;

    console.log('🎛️ Initializing Master Effects Chain...');

    // Create effects chain
    // 1. EQ (3-band: Low, Mid, High)
    this.eq3 = new Tone.EQ3({
      low: 0,
      mid: 0,
      high: 0,
      lowFrequency: 400,
      highFrequency: 2500,
    });

    // 2. Distortion
    this.distortion = new Tone.Distortion({
      distortion: 0,
      wet: 0,
    });

    // 3. Chorus (modulation)
    this.chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.7,
      wet: 0,
    }).start();

    // 4. Phaser (modulation)
    this.phaser = new Tone.Phaser({
      frequency: 0.5,
      octaves: 3,
      baseFrequency: 350,
      wet: 0,
    });

    // 5. Flanger (short delay with modulation)
    this.flanger = new Tone.FeedbackDelay({
      delayTime: 0.005,
      feedback: 0.5,
      wet: 0,
    });

    // 6. Bitcrusher
    this.bitcrusher = new Tone.BitCrusher(16); // Start at full quality (1-16)
    this.bitcrusher.wet.value = 0;

    // 7. Reverb
    this.reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.15,
    });

    // 8. Delay
    this.delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.3,
      wet: 0.1,
    });

    // 9. Compressor
    this.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
    });

    // 10. Stereo Widener
    this.stereoWidener = new Tone.StereoWidener({
      width: 0.5,
    });

    // 11. Limiter (brick wall)
    this.limiter = new Tone.Limiter(-1);

    // 12. Master Channel (volume control)
    this.channel = new Tone.Channel({
      volume: Tone.gainToDb(0.8),
      pan: 0,
    });

    // 13. Meter (for volume visualization)
    this.meter = new Tone.Meter(0.8);

    // Connect the chain: EQ -> Distortion -> Chorus -> Phaser -> Flanger -> Bitcrusher -> Reverb -> Delay -> Compressor -> Stereo -> Limiter -> Channel -> Meter -> Destination
    this.eq3.connect(this.distortion);
    this.distortion.connect(this.chorus);
    this.chorus.connect(this.phaser);
    this.phaser.connect(this.flanger);
    this.flanger.connect(this.bitcrusher);
    this.bitcrusher.connect(this.reverb);
    this.reverb.connect(this.delay);
    this.delay.connect(this.compressor);
    this.compressor.connect(this.stereoWidener);
    this.stereoWidener.connect(this.limiter);
    this.limiter.connect(this.channel);
    this.channel.connect(this.meter);
    this.meter.toDestination();

    this.initialized = true;
    console.log('✅ Master Effects Chain initialized!');
  }

  public static getInstance(): MasterEffects {
    if (!MasterEffects.instance) {
      MasterEffects.instance = new MasterEffects();
    }
    return MasterEffects.instance;
  }

  public getInput(): Tone.ToneAudioNode {
    if (!this.initialized || !this.eq3) {
      this.initialize();
    }
    return this.eq3 || Tone.getDestination();
  }

  // ===== METER (for stereo volume visualization) =====
  public getMeterLevel(): { left: number; right: number } {
    if (!this.initialized) {
      this.initialize();
    }
    if (this.meter) {
      const levels = this.meter.getValue();
      // Tone.Meter returns dB values, convert to 0-1 range
      // -60dB = 0, 0dB = 1
      const convertDb = (db: number) => Math.max(0, Math.min(1, (db + 60) / 60));

      if (Array.isArray(levels)) {
        // Stereo: [left, right]
        return {
          left: convertDb(levels[0]),
          right: convertDb(levels[1] ?? levels[0]),
        };
      } else {
        // Mono fallback
        const level = convertDb(levels);
        return { left: level, right: level };
      }
    }
    return { left: 0, right: 0 };
  }

  // ===== VOLUME CONTROL =====
  public setMasterVolume(volume: number) {
    // Ensure effects chain is initialized
    if (!this.initialized) {
      this.initialize();
    }
    if (this.channel) {
      // Handle both gain (0-1) and dB values
      // If volume is <= 0 and looks like dB (negative or zero), use directly
      // Otherwise, convert gain to dB
      const dbValue = volume <= 0 ? volume : Tone.gainToDb(Math.max(0.001, volume));
      this.channel.volume.value = dbValue;
      console.log(`🔊 Master Volume: ${dbValue.toFixed(1)} dB`);
    }
  }

  // Helper to ensure initialization before any operation
  private ensureInit() {
    if (!this.initialized) {
      this.initialize();
    }
  }

  // ===== COMPRESSOR CONTROLS =====
  public setCompressorThreshold(threshold: number) {
    this.ensureInit();
    if (this.compressor) {
      this.compressor.threshold.value = threshold;
      console.log(`🎚️ Compressor Threshold: ${threshold.toFixed(1)} dB`);
    }
  }

  public setCompressorRatio(ratio: number) {
    this.ensureInit();
    if (this.compressor) {
      this.compressor.ratio.value = ratio;
      console.log(`🎚️ Compressor Ratio: ${ratio.toFixed(1)}:1`);
    }
  }

  public setCompressorAttack(attack: number) {
    this.ensureInit();
    if (this.compressor) {
      this.compressor.attack.value = attack;
      console.log(`🎚️ Compressor Attack: ${(attack * 1000).toFixed(1)} ms`);
    }
  }

  public setCompressorRelease(release: number) {
    this.ensureInit();
    if (this.compressor) {
      this.compressor.release.value = release;
      console.log(`🎚️ Compressor Release: ${(release * 1000).toFixed(1)} ms`);
    }
  }

  // ===== EQ CONTROLS =====
  public setEqLow(gain: number) {
    this.ensureInit();
    if (this.eq3) {
      this.eq3.low.value = gain;
      console.log(`🎛️ EQ Low: ${gain > 0 ? '+' : ''}${gain.toFixed(1)} dB`);
    }
  }

  public setEqMid(gain: number) {
    this.ensureInit();
    if (this.eq3) {
      this.eq3.mid.value = gain;
      console.log(`🎛️ EQ Mid: ${gain > 0 ? '+' : ''}${gain.toFixed(1)} dB`);
    }
  }

  public setEqHigh(gain: number) {
    this.ensureInit();
    if (this.eq3) {
      this.eq3.high.value = gain;
      console.log(`🎛️ EQ High: ${gain > 0 ? '+' : ''}${gain.toFixed(1)} dB`);
    }
  }

  // ===== DISTORTION CONTROL =====
  public setDistortion(amount: number) {
    this.ensureInit();
    if (this.distortion) {
      // Map 0-1 to distortion amount (0-1) and wet/dry mix
      this.distortion.distortion = amount;
      this.distortion.wet.value = amount;
      console.log(`🔥 Distortion: ${(amount * 100).toFixed(0)}%`);
    }
  }

  // ===== REVERB CONTROLS =====
  public setReverbWet(wet: number) {
    this.ensureInit();
    if (this.reverb) {
      this.reverb.wet.value = wet;
      console.log(`🌊 Reverb: ${(wet * 100).toFixed(0)}%`);
    }
  }

  public setReverbDecay(decay: number) {
    this.ensureInit();
    if (this.reverb) {
      this.reverb.decay = decay;
    }
  }

  // ===== DELAY CONTROLS =====
  public setDelayWet(wet: number) {
    this.ensureInit();
    if (this.delay) {
      this.delay.wet.value = wet;
      console.log(`⏱️ Delay: ${(wet * 100).toFixed(0)}%`);
    }
  }

  public setDelayTime(time: string) {
    this.ensureInit();
    if (this.delay) {
      this.delay.delayTime.value = time;
    }
  }

  public setDelayFeedback(feedback: number) {
    this.ensureInit();
    if (this.delay) {
      this.delay.feedback.value = feedback;
    }
  }

  // ===== STEREO WIDTH CONTROL =====
  public setStereoWidth(width: number) {
    this.ensureInit();
    if (this.stereoWidener) {
      // Map 0-1 to 0-1 (0 = mono, 0.5 = normal, 1 = wide)
      this.stereoWidener.width.value = width;
      console.log(`↔️ Stereo Width: ${(width * 100).toFixed(0)}%`);
    }
  }

  // ===== LIMITER CONTROL =====
  public setLimiterThreshold(threshold: number) {
    this.ensureInit();
    if (this.limiter) {
      this.limiter.threshold.value = threshold;
      console.log(`🧱 Limiter Threshold: ${threshold.toFixed(1)} dB`);
    }
  }

  // ===== CHORUS CONTROL =====
  public setChorus(amount: number) {
    this.ensureInit();
    if (this.chorus) {
      this.chorus.wet.value = amount;
      console.log(`🌀 Chorus: ${(amount * 100).toFixed(0)}%`);
    }
  }

  // ===== PHASER CONTROL =====
  public setPhaser(amount: number) {
    this.ensureInit();
    if (this.phaser) {
      this.phaser.wet.value = amount;
      console.log(`🔄 Phaser: ${(amount * 100).toFixed(0)}%`);
    }
  }

  // ===== FLANGER CONTROL =====
  public setFlanger(amount: number) {
    this.ensureInit();
    if (this.flanger) {
      this.flanger.wet.value = amount;
      // Modulate delay time slightly for flanger effect
      this.flanger.delayTime.value = 0.003 + (amount * 0.007);
      console.log(`〰️ Flanger: ${(amount * 100).toFixed(0)}%`);
    }
  }

  // ===== BITCRUSHER CONTROL =====
  public setBitcrusher(amount: number) {
    this.ensureInit();
    if (this.bitcrusher) {
      // Map 0-1 to bits 16-1 (0 = no crush, 1 = max crush)
      const bits = Math.max(1, Math.round(16 - (amount * 15)));
      this.bitcrusher.bits.value = bits;
      this.bitcrusher.wet.value = amount;
      console.log(`📻 Bitcrusher: ${bits} bits (${(amount * 100).toFixed(0)}%)`);
    }
  }

  public dispose() {
    console.log('🗑️ Disposing Master Effects Chain...');
    if (this.eq3) this.eq3.dispose();
    if (this.distortion) this.distortion.dispose();
    if (this.chorus) this.chorus.dispose();
    if (this.phaser) this.phaser.dispose();
    if (this.flanger) this.flanger.dispose();
    if (this.bitcrusher) this.bitcrusher.dispose();
    if (this.reverb) this.reverb.dispose();
    if (this.delay) this.delay.dispose();
    if (this.compressor) this.compressor.dispose();
    if (this.stereoWidener) this.stereoWidener.dispose();
    if (this.limiter) this.limiter.dispose();
    if (this.channel) this.channel.dispose();
    MasterEffects.instance = null;
    this.initialized = false;
  }
}

// Lazy initialization - only create when accessed
export const getMasterEffects = () => MasterEffects.getInstance();

