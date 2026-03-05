/**
 * Tone Player Utility
 * 
 * Creates audio feedback for trading events and UI interactions.
 * Supports multiple simultaneous tones and various waveform types.
 */

type ToneConfig = {
  frequency: number;
  volume: number; // 0.0 to 1.0
  duration: number; // in seconds
  fadeIn?: number; // fade in duration in seconds
  fadeOut?: number; // fade out duration in seconds
  waveform?: OscillatorType; // 'sine' | 'square' | 'sawtooth' | 'triangle'
  detune?: number; // slight pitch adjustment in cents
};

type PresetTone = 'buy' | 'sell' | 'profit' | 'loss' | 'warning' | 'success' | 'info';

class TonePlayer {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  // Preset configurations for common events
  private presets: Record<PresetTone, ToneConfig> = {
    buy: {
      frequency: 523.25, // C5
      volume: 0.15,
      duration: 0.3,
      fadeIn: 0.05,
      fadeOut: 0.1,
      waveform: 'sine',
    },
    sell: {
      frequency: 392.00, // G4
      volume: 0.15,
      duration: 0.3,
      fadeIn: 0.05,
      fadeOut: 0.1,
      waveform: 'sine',
    },
    profit: {
      frequency: 659.25, // E5
      volume: 0.2,
      duration: 0.4,
      fadeIn: 0.05,
      fadeOut: 0.15,
      waveform: 'triangle',
      detune: 5,
    },
    loss: {
      frequency: 293.66, // D4
      volume: 0.18,
      duration: 0.5,
      fadeIn: 0.1,
      fadeOut: 0.2,
      waveform: 'sawtooth',
      detune: -5,
    },
    warning: {
      frequency: 440.00, // A4
      volume: 0.12,
      duration: 0.2,
      fadeIn: 0.02,
      fadeOut: 0.08,
      waveform: 'square',
    },
    success: {
      frequency: 783.99, // G5
      volume: 0.18,
      duration: 0.35,
      fadeIn: 0.05,
      fadeOut: 0.12,
      waveform: 'sine',
      detune: 3,
    },
    info: {
      frequency: 523.25, // C5
      volume: 0.08,
      duration: 0.15,
      fadeIn: 0.02,
      fadeOut: 0.05,
      waveform: 'triangle',
    },
  };

  /**
   * Initialize the audio context (call once on user interaction)
   */
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
      console.log('TonePlayer initialized');
    } catch (error) {
      console.error('Failed to initialize TonePlayer:', error);
    }
  }

  /**
   * Play a preset tone
   */
  playPreset(preset: PresetTone): void {
    const config = this.presets[preset];
    this.playTone(config);
  }

  /**
   * Play a custom tone with specific configuration
   */
  playTone(config: ToneConfig): void {
    if (!this.audioContext) {
      console.warn('AudioContext not initialized. Call initialize() first.');
      return;
    }

    const {
      frequency,
      volume,
      duration,
      fadeIn = 0.05,
      fadeOut = 0.1,
      waveform = 'sine',
      detune = 0,
    } = config;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Configure oscillator
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (detune !== 0) {
      oscillator.detune.value = detune;
    }

    // Configure envelope (fade in/out)
    gainNode.gain.setValueAtTime(0.0001, now);
    
    // Fade in
    if (fadeIn > 0) {
      gainNode.gain.exponentialRampToValueAtTime(volume, now + fadeIn);
    } else {
      gainNode.gain.setValueAtTime(volume, now);
    }

    // Sustain at volume
    const sustainEnd = now + duration - fadeOut;
    gainNode.gain.setValueAtTime(volume, sustainEnd);

    // Fade out
    if (fadeOut > 0) {
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    }

    // Connect and start
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);

    // Clean up
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }

  /**
   * Play a sequence of tones (e.g., for a melody)
   */
  playSequence(tones: (PresetTone | ToneConfig)[], delayBetween: number = 0.1): void {
    let currentDelay = 0;

    tones.forEach((tone) => {
      setTimeout(() => {
        if (typeof tone === 'string') {
          this.playPreset(tone);
        } else {
          this.playTone(tone);
        }
      }, currentDelay * 1000);

      const duration = typeof tone === 'string' 
        ? this.presets[tone].duration 
        : tone.duration;
      currentDelay += duration + delayBetween;
    });
  }

  /**
   * Play a chord (multiple simultaneous tones)
   */
  playChord(frequencies: number[], config: Partial<ToneConfig> = {}): void {
    const defaultConfig: ToneConfig = {
      frequency: 440,
      volume: 0.1,
      duration: 0.5,
      fadeIn: 0.05,
      fadeOut: 0.15,
      waveform: 'sine',
      ...config,
    };

    frequencies.forEach((frequency) => {
      this.playTone({ ...defaultConfig, frequency });
    });
  }

  /**
   * Get the current preset configuration (useful for customization)
   */
  getPreset(preset: PresetTone): ToneConfig {
    return { ...this.presets[preset] };
  }

  /**
   * Update a preset configuration
   */
  updatePreset(preset: PresetTone, config: Partial<ToneConfig>): void {
    this.presets[preset] = { ...this.presets[preset], ...config };
  }

  /**
   * Check if audio is initialized and ready
   */
  isReady(): boolean {
    return this.isInitialized && this.audioContext !== null;
  }

  /**
   * Cleanup (optional, for component unmount)
   */
  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const tonePlayer = new TonePlayer();

// Export types for consumers
export type { ToneConfig, PresetTone };
