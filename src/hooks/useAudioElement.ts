/**
 * Owns HTMLAudioElement lifecycle and core media events on a shared ref.
 * Transport (play/pause) and interruption policy live elsewhere.
 */

import { useEffect, type RefObject } from "react";

interface UseAudioElementOptions {
  audioRef: RefObject<HTMLAudioElement | null>;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsLoading: (loading: boolean) => void;
  onNativePlayEvent: () => void;
  onNativePauseEvent: (audioEnded: boolean) => void;
  onCleanup: () => void;
}

export const useAudioElement = ({
  audioRef,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  setIsLoading,
  onNativePlayEvent,
  onNativePauseEvent,
  onCleanup,
}: UseAudioElementOptions): void => {
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Explicit control — avoid browser-managed resume fighting our policy.
    audio.preload = "none";
    audio.controls = false;

    console.log(`🎵 AUDIO INIT: Creating new audio element`);

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      console.log(`🎵 AUDIO INIT: Metadata loaded, duration: ${audio.duration}s`);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      console.log(`🎵 AUDIO INIT: Load started`);
    };

    const handleCanPlayThrough = () => setIsLoading(false);

    const handlePlayEvent = () => {
      setIsPlaying(true);
      onNativePlayEvent();
    };

    const handlePauseEvent = () => {
      setIsPlaying(false);
      onNativePauseEvent(audio.ended);
    };

    const handleError = (e: Event) => {
      console.error(`🎵 AUDIO INIT: Audio error:`, e);
      setIsLoading(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("play", handlePlayEvent);
    audio.addEventListener("pause", handlePauseEvent);
    audio.addEventListener("error", handleError);

    return () => {
      console.log(`🎵 AUDIO INIT: Cleaning up audio element`);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("play", handlePlayEvent);
      audio.removeEventListener("pause", handlePauseEvent);
      audio.removeEventListener("error", handleError);
      onCleanup();
      audio.pause();
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [
    audioRef,
    onCleanup,
    onNativePauseEvent,
    onNativePlayEvent,
    setCurrentTime,
    setDuration,
    setIsLoading,
    setIsPlaying,
  ]);
};
