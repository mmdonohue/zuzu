import { useEffect, useRef, useCallback } from 'react';
import { tonePlayer, PresetTone, ToneConfig } from '@/utils/tonePlayer';

/**
 * React hook for using the tone player
 * 
 * Automatically initializes on mount and cleans up on unmount.
 * Provides memoized callback functions for playing tones.
 * 
 * @param autoInitialize - Whether to initialize audio context on mount (default: true)
 * @returns Tone player functions and status
 */
export const useTonePlayer = (autoInitialize: boolean = true) => {
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (autoInitialize && !isInitializedRef.current) {
      // Initialize on first user interaction (click anywhere)
      const initOnInteraction = () => {
        if (!tonePlayer.isReady()) {
          tonePlayer.initialize();
          isInitializedRef.current = true;
          // Remove listener after first interaction
          document.removeEventListener('click', initOnInteraction);
          document.removeEventListener('keydown', initOnInteraction);
        }
      };

      document.addEventListener('click', initOnInteraction, { once: true });
      document.addEventListener('keydown', initOnInteraction, { once: true });

      return () => {
        document.removeEventListener('click', initOnInteraction);
        document.removeEventListener('keydown', initOnInteraction);
      };
    }
  }, [autoInitialize]);

  const playPreset = useCallback((preset: PresetTone) => {
    tonePlayer.playPreset(preset);
  }, []);

  const playTone = useCallback((config: ToneConfig) => {
    tonePlayer.playTone(config);
  }, []);

  const playSequence = useCallback((tones: (PresetTone | ToneConfig)[], delayBetween?: number) => {
    tonePlayer.playSequence(tones, delayBetween);
  }, []);

  const playChord = useCallback((frequencies: number[], config?: Partial<ToneConfig>) => {
    tonePlayer.playChord(frequencies, config);
  }, []);

  const manualInitialize = useCallback(() => {
    if (!tonePlayer.isReady()) {
      tonePlayer.initialize();
      isInitializedRef.current = true;
    }
  }, []);

  return {
    playPreset,
    playTone,
    playSequence,
    playChord,
    initialize: manualInitialize,
    isReady: tonePlayer.isReady(),
  };
};

/**
 * Hook for playing tones on specific events with automatic initialization
 * 
 * Example usage:
 * ```tsx
 * const playBuyTone = useToneOnEvent('buy');
 * 
 * // Later in your code
 * playBuyTone(); // Plays the buy tone
 * ```
 */
export const useToneOnEvent = (preset: PresetTone) => {
  const { playPreset } = useTonePlayer();
  
  return useCallback(() => {
    playPreset(preset);
  }, [playPreset, preset]);
};
