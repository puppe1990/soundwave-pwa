/**
 * Pure helpers for HTMLAudioElement playback and playlist navigation.
 * No React — unit-testable without a DOM audio stack when given fakes.
 */

import type { RepeatMode } from "./audio-player-types";

const MOBILE_UA_PATTERN = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export const isMobileUserAgent = (userAgent: string): boolean => MOBILE_UA_PATTERN.test(userAgent);

export const isAutoplayPolicyError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as { name?: string; message?: string };
  return err.name === "NotAllowedError" || Boolean(err.message?.includes("autoplay"));
};

export const clampVolume = (vol: number): number => Math.max(0, Math.min(1, vol));

export const getNextTrackIndex = (currentIndex: number, tracksLength: number): number => {
  if (tracksLength <= 0) {
    return 0;
  }
  return (currentIndex + 1) % tracksLength;
};

export const getPreviousTrackIndex = (currentIndex: number, tracksLength: number): number => {
  if (tracksLength <= 0) {
    return 0;
  }
  return currentIndex === 0 ? tracksLength - 1 : currentIndex - 1;
};

export type TrackEndedAction =
  | { type: "replay-current" }
  | { type: "advance"; nextIndex: number }
  | { type: "stop"; clearWasPlaying: boolean };

/**
 * Decide what happens when a track ends, given repeat mode and pause flags.
 *
 * @example
 * resolveTrackEndedAction({ wasPlaying: true, manuallyPaused: false, repeatMode: "one", currentIndex: 0, tracksLength: 3 })
 * // → { type: "replay-current" }
 */
export const resolveTrackEndedAction = (input: {
  wasPlaying: boolean;
  manuallyPaused: boolean;
  repeatMode: RepeatMode;
  currentIndex: number;
  tracksLength: number;
}): TrackEndedAction => {
  if (!input.wasPlaying || input.manuallyPaused) {
    return { type: "stop", clearWasPlaying: !input.manuallyPaused };
  }

  if (input.repeatMode === "one") {
    return { type: "replay-current" };
  }

  // "all" and "none" both advance; "none" still moves forward in this player.
  return {
    type: "advance",
    nextIndex: getNextTrackIndex(input.currentIndex, input.tracksLength),
  };
};

export const getNextRepeatMode = (
  current: RepeatMode,
): { mode: RepeatMode; title: string; description: string } => {
  switch (current) {
    case "none":
      return {
        mode: "all",
        title: "🔁 Repeat All",
        description: "Playlist will repeat continuously",
      };
    case "all":
      return {
        mode: "one",
        title: "🔁 Repeat One",
        description: "Current track will repeat",
      };
    case "one":
    default:
      return {
        mode: "none",
        title: "🔁 Repeat Off",
        description: "Normal playback mode",
      };
  }
};

/** Wait until the element can play, or resolve immediately if already ready. */
export const waitForAudioCanPlay = (audio: HTMLAudioElement): Promise<void> => {
  if (audio.readyState >= 2) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const handleCanPlay = () => {
      audio.removeEventListener("canplay", handleCanPlay);
      resolve();
    };
    audio.addEventListener("canplay", handleCanPlay);
  });
};

export const PLAY_TIMEOUT_MS = 10_000;

export const racePlayWithTimeout = (
  playPromise: Promise<void>,
  timeoutMs: number = PLAY_TIMEOUT_MS,
): Promise<void> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Play timeout after ${timeoutMs} milliseconds`)), timeoutMs);
  });

  return Promise.race([playPromise, timeoutPromise]);
};
