/**
 * Mobile external-interruption tracking and resume attempts.
 * WHY separate: keeps useAudioPlayer under size budget and isolates
 * visibility/focus/gesture resume from core transport controls.
 */

import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  getResumeDelaysMs,
  getSuccessfulResumeState,
  handleAudioPause,
  shouldAttemptResume,
  type InterruptionState,
  type PauseOrigin,
} from "@/lib/audio-interruption";
import type { Track } from "@/lib/audio-player-types";

interface UseAudioInterruptionResumeOptions {
  audioRef: RefObject<HTMLAudioElement | null>;
  currentTrack: Track | null;
  isMobile: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const useAudioInterruptionResume = ({
  audioRef,
  currentTrack,
  isMobile,
  setIsPlaying,
}: UseAudioInterruptionResumeOptions) => {
  const wasPlayingRef = useRef(false);
  const hasUserInteractedRef = useRef(false);
  const manuallyPausedRef = useRef(false);
  const pauseOriginRef = useRef<PauseOrigin>("none");
  const externalInterruptionRef = useRef(false);

  const getInterruptionState = useCallback(
    (): InterruptionState => ({
      wasPlaying: wasPlayingRef.current,
      manuallyPaused: manuallyPausedRef.current,
      externalInterruption: externalInterruptionRef.current,
      hasUserInteracted: hasUserInteractedRef.current,
      pauseOrigin: pauseOriginRef.current,
      audioEnded: false,
    }),
    [],
  );

  const applyInterruptionState = useCallback((state: InterruptionState) => {
    wasPlayingRef.current = state.wasPlaying;
    manuallyPausedRef.current = state.manuallyPaused;
    externalInterruptionRef.current = state.externalInterruption;
    pauseOriginRef.current = state.pauseOrigin;
  }, []);

  const markUserInteracted = useCallback(() => {
    hasUserInteractedRef.current = true;
  }, []);

  const markManualPause = useCallback(() => {
    pauseOriginRef.current = "manual";
    wasPlayingRef.current = false;
    manuallyPausedRef.current = true;
    externalInterruptionRef.current = false;
  }, []);

  const markPlaying = useCallback(() => {
    hasUserInteractedRef.current = true;
    manuallyPausedRef.current = false;
    wasPlayingRef.current = true;
    externalInterruptionRef.current = false;
    pauseOriginRef.current = "none";
  }, []);

  const markTrackChangePreservePlayIntent = useCallback((isPlaying: boolean) => {
    wasPlayingRef.current = isPlaying;
    manuallyPausedRef.current = false;
  }, []);

  const setPauseOrigin = useCallback((origin: PauseOrigin) => {
    pauseOriginRef.current = origin;
  }, []);

  const onNativePlayEvent = useCallback(() => {
    wasPlayingRef.current = true;
    manuallyPausedRef.current = false;
    externalInterruptionRef.current = false;
    pauseOriginRef.current = "none";
  }, []);

  const onNativePauseEvent = useCallback(
    (audioEnded: boolean) => {
      const nextState = handleAudioPause(getInterruptionState(), {
        pauseOrigin: pauseOriginRef.current,
        audioEnded,
      });
      applyInterruptionState(nextState);

      if (nextState.externalInterruption) {
        console.log(`📱 INTERRUPTION: External audio interruption detected`);
      }
    },
    [applyInterruptionState, getInterruptionState],
  );

  const attemptResumeAfterInterruption = useCallback(async () => {
    if (!audioRef.current || !currentTrack) {
      return;
    }

    const canResume = () =>
      shouldAttemptResume({
        isMobile,
        externalInterruption: externalInterruptionRef.current,
        manuallyPaused: manuallyPausedRef.current,
        hasUserInteracted: hasUserInteractedRef.current,
        isPageVisible: !document.hidden,
        isAudioPaused: audioRef.current!.paused,
        hasCurrentTrack: Boolean(currentTrack),
      });

    for (const delay of getResumeDelaysMs()) {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      if (!canResume()) {
        return;
      }

      console.log(
        `📱 RESUME: Attempting to resume "${currentTrack.title}" after external interruption`,
      );

      try {
        await audioRef.current.play();
        setIsPlaying(true);
        applyInterruptionState(getSuccessfulResumeState(getInterruptionState()));
        console.log(`📱 RESUME: Playback restored for "${currentTrack.title}"`);
        return;
      } catch (error) {
        console.log(
          `📱 RESUME: Resume attempt failed, waiting for next visibility/focus or tap`,
          error,
        );
      }
    }
  }, [
    applyInterruptionState,
    audioRef,
    currentTrack,
    getInterruptionState,
    isMobile,
    setIsPlaying,
  ]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const handleResumeSignal = () => {
      if (!document.hidden) {
        void attemptResumeAfterInterruption();
      }
    };

    const handleUserGestureResume = () => {
      if (externalInterruptionRef.current && !manuallyPausedRef.current) {
        void attemptResumeAfterInterruption();
      }
    };

    window.addEventListener("focus", handleResumeSignal);
    window.addEventListener("pageshow", handleResumeSignal);
    document.addEventListener("visibilitychange", handleResumeSignal);
    document.addEventListener("touchstart", handleUserGestureResume, { passive: true });
    document.addEventListener("pointerdown", handleUserGestureResume);

    return () => {
      window.removeEventListener("focus", handleResumeSignal);
      window.removeEventListener("pageshow", handleResumeSignal);
      document.removeEventListener("visibilitychange", handleResumeSignal);
      document.removeEventListener("touchstart", handleUserGestureResume);
      document.removeEventListener("pointerdown", handleUserGestureResume);
    };
  }, [attemptResumeAfterInterruption, isMobile]);

  return {
    wasPlayingRef,
    hasUserInteractedRef,
    manuallyPausedRef,
    pauseOriginRef,
    externalInterruptionRef,
    getInterruptionState,
    applyInterruptionState,
    attemptResumeAfterInterruption,
    markUserInteracted,
    markManualPause,
    markPlaying,
    markTrackChangePreservePlayIntent,
    setPauseOrigin,
    onNativePlayEvent,
    onNativePauseEvent,
  };
};
