/**
 * Audio transport orchestrator: play/pause/seek/navigate + repeat.
 * Interruption resume → useAudioInterruptionResume
 * Element lifecycle → useAudioElement
 * Pure helpers → audio-playback-helpers
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  clampVolume,
  getNextRepeatMode,
  getNextTrackIndex,
  getPreviousTrackIndex,
  isAutoplayPolicyError,
  isMobileUserAgent,
  racePlayWithTimeout,
  resolveTrackEndedAction,
  waitForAudioCanPlay,
} from "@/lib/audio-playback-helpers";
import type { RepeatMode, Track } from "@/lib/audio-player-types";
import { useAudioElement } from "./useAudioElement";
import { useAudioInterruptionResume } from "./useAudioInterruptionResume";

export type { Track, AudioPlayerState, RepeatMode } from "@/lib/audio-player-types";

export const useAudioPlayer = (tracks: Track[]) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSeekTimeRef = useRef(0);
  const isMobile = isMobileUserAgent(navigator.userAgent);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const { toast } = useToast();

  const currentTrack = tracks[currentTrackIndex] || null;

  const {
    wasPlayingRef,
    hasUserInteractedRef,
    manuallyPausedRef,
    markUserInteracted,
    markManualPause,
    markPlaying,
    markTrackChangePreservePlayIntent,
    setPauseOrigin,
    onNativePlayEvent,
    onNativePauseEvent,
  } = useAudioInterruptionResume({
    audioRef,
    currentTrack,
    isMobile,
    setIsPlaying,
  });

  const onCleanup = useCallback(() => {
    setPauseOrigin("cleanup");
  }, [setPauseOrigin]);

  useAudioElement({
    audioRef,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setIsLoading,
    onNativePlayEvent,
    onNativePauseEvent,
    onCleanup,
  });

  const ensureTrackSource = useCallback(
    (track: Track) => {
      if (!audioRef.current) {
        return;
      }
      if (!audioRef.current.src || audioRef.current.src !== track.src) {
        console.log(`▶️ PLAY: Setting audio source: ${track.src}`);
        audioRef.current.src = track.src;
        audioRef.current.volume = volume;
        setCurrentTime(0);
      }
    },
    [volume],
  );

  const play = useCallback(async () => {
    if (!audioRef.current || !currentTrack) {
      console.log(
        !currentTrack
          ? `⚠️ PLAY: No current track selected`
          : `⚠️ PLAY: Audio element not available`,
      );
      return;
    }

    console.log(`▶️ PLAY: Starting playback of "${currentTrack.title}" by ${currentTrack.artist}`);
    ensureTrackSource(currentTrack);

    try {
      if (audioRef.current.readyState < 2) {
        console.log(`▶️ PLAY: Audio not ready, waiting for canplay event...`);
        await waitForAudioCanPlay(audioRef.current);
      }

      const playPromise = audioRef.current.play();
      if (playPromise === undefined) {
        return;
      }

      await racePlayWithTimeout(playPromise);
      setIsPlaying(true);
      markPlaying();
      console.log(`▶️ PLAY: Successfully started playback of "${currentTrack.title}"`);
      console.log(`📱 MOBILE: User interaction recorded - future autoplay should work`);
    } catch (error) {
      console.error("❌ PLAY: Error playing audio:", error);
      if (isAutoplayPolicyError(error)) {
        toast({
          title: "Tap to Play",
          description: "Please tap the play button to start audio playback on mobile devices.",
          duration: 3000,
        });
      }
      setIsPlaying(false);
    }
  }, [currentTrack, ensureTrackSource, markPlaying, toast]);

  // Load new track source when selection changes; autoplay if intent was playing.
  useEffect(() => {
    if (!audioRef.current || !currentTrack) {
      return;
    }

    console.log(`🔄 TRACK CHANGE: Loading "${currentTrack.title}" by ${currentTrack.artist}`);
    setPauseOrigin("track-change");
    audioRef.current.pause();
    setIsPlaying(false);
    audioRef.current.src = currentTrack.src;
    audioRef.current.volume = volume;
    setCurrentTime(0);

    if (!wasPlayingRef.current) {
      return;
    }

    if (isMobile && !hasUserInteractedRef.current) {
      toast({
        title: "Tap to Play",
        description: "Please tap the play button to continue playback on mobile devices.",
        duration: 3000,
      });
      return;
    }

    const timer = setTimeout(() => {
      void play();
    }, 100);

    return () => clearTimeout(timer);
  }, [
    currentTrack,
    volume,
    isMobile,
    play,
    toast,
    setPauseOrigin,
    wasPlayingRef,
    hasUserInteractedRef,
  ]);

  const pause = useCallback(() => {
    if (!audioRef.current || !currentTrack) {
      return;
    }
    console.log(`⏸️ PAUSE: Pausing playback of "${currentTrack.title}"`);
    markManualPause();
    audioRef.current.pause();
    setIsPlaying(false);
  }, [currentTrack, markManualPause]);

  const togglePlay = useCallback(async () => {
    markUserInteracted();

    if (isPlaying) {
      if (audioRef.current) {
        markManualPause();
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (!audioRef.current || !currentTrack) {
      await play();
      return;
    }

    try {
      ensureTrackSource(currentTrack);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        markPlaying();
        console.log(`📱 MOBILE: Successfully started playback via direct play() call`);
        return;
      }
    } catch (error) {
      console.log(`📱 MOBILE: Direct play() failed, falling back to regular play function:`, error);
    }

    await play();
  }, [
    currentTrack,
    ensureTrackSource,
    isPlaying,
    markManualPause,
    markPlaying,
    markUserInteracted,
    play,
  ]);

  const changeTrackIndex = useCallback(
    (nextIndex: number, logPrefix: string) => {
      const nextTrack = tracks[nextIndex];
      console.log(
        `${logPrefix}: Moving from "${currentTrack?.title || "Unknown"}" (${currentTrackIndex}) to "${nextTrack?.title || "Unknown"}" (${nextIndex})`,
      );
      markUserInteracted();
      markTrackChangePreservePlayIntent(isPlaying);
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(false);
    },
    [
      currentTrack,
      currentTrackIndex,
      isPlaying,
      markTrackChangePreservePlayIntent,
      markUserInteracted,
      tracks,
    ],
  );

  const next = useCallback(() => {
    changeTrackIndex(getNextTrackIndex(currentTrackIndex, tracks.length), "⏭️ NEXT");
  }, [changeTrackIndex, currentTrackIndex, tracks.length]);

  const previous = useCallback(() => {
    changeTrackIndex(getPreviousTrackIndex(currentTrackIndex, tracks.length), "⏮️ PREVIOUS");
  }, [changeTrackIndex, currentTrackIndex, tracks.length]);

  const handleEnded = useCallback(async () => {
    const track = tracks[currentTrackIndex];
    const action = resolveTrackEndedAction({
      wasPlaying: wasPlayingRef.current,
      manuallyPaused: manuallyPausedRef.current,
      repeatMode,
      currentIndex: currentTrackIndex,
      tracksLength: tracks.length,
    });

    console.log(
      `🏁 TRACK ENDED: "${track?.title}" finished playing (repeat mode: ${repeatMode}) → ${action.type}`,
    );

    if (action.type === "stop") {
      setIsPlaying(false);
      if (action.clearWasPlaying) {
        wasPlayingRef.current = false;
      }
      return;
    }

    if (action.type === "advance") {
      wasPlayingRef.current = true;
      manuallyPausedRef.current = false;
      setCurrentTrackIndex(action.nextIndex);
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current || !track) {
      return;
    }

    try {
      audioRef.current.currentTime = 0;
      if (isMobile && !hasUserInteractedRef.current) {
        setIsPlaying(false);
        wasPlayingRef.current = false;
        toast({
          title: "Tap to Continue",
          description: "Please tap the play button to continue playback on mobile.",
          duration: 3000,
        });
        return;
      }

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("❌ REPEAT ONE: Error replaying audio:", error);
      setIsPlaying(false);
      wasPlayingRef.current = false;
      if (isAutoplayPolicyError(error)) {
        toast({
          title: "Tap to Continue",
          description: "Please tap the play button to continue playback.",
          duration: 3000,
        });
      }
    }
  }, [
    currentTrackIndex,
    hasUserInteractedRef,
    isMobile,
    manuallyPausedRef,
    repeatMode,
    toast,
    tracks,
    wasPlayingRef,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [handleEnded]);

  const seek = useCallback(
    (time: number) => {
      if (!audioRef.current || !currentTrack) {
        return;
      }

      const now = Date.now();
      if (now - lastSeekTimeRef.current > 500) {
        console.log(`⏱️ SEEK: Seeking to ${time}s in "${currentTrack.title}"`);
        lastSeekTimeRef.current = now;
      }

      markUserInteracted();
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    },
    [currentTrack, markUserInteracted],
  );

  const setVolumeLevel = useCallback(
    (vol: number) => {
      const clamped = clampVolume(vol);
      markUserInteracted();
      setVolume(clamped);
      if (audioRef.current) {
        audioRef.current.volume = clamped;
      }
    },
    [markUserInteracted],
  );

  const selectTrack = useCallback(
    (trackIndex: number) => {
      if (trackIndex < 0 || trackIndex >= tracks.length) {
        console.log(`⚠️ SELECT: Invalid track index ${trackIndex}`);
        return;
      }
      changeTrackIndex(trackIndex, "🎵 SELECT");
    },
    [changeTrackIndex, tracks.length],
  );

  const toggleRepeat = useCallback(() => {
    markUserInteracted();
    setRepeatMode((prev) => {
      const nextMode = getNextRepeatMode(prev);
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }
      toast({
        title: nextMode.title,
        description: nextMode.description,
        duration: 2000,
      });
      return nextMode.mode;
    });
  }, [markUserInteracted, toast]);

  return {
    currentTrack,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    repeatMode,
    play,
    pause,
    togglePlay,
    next,
    previous,
    seek,
    setVolume: setVolumeLevel,
    selectTrack,
    toggleRepeat,
  };
};
