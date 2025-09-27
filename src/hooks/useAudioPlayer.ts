import { useState, useRef, useEffect, useCallback } from 'react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  src: string;
  cover: string;
  folder?: string; // Optional folder name for organization
}

export interface AudioPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  repeatMode: 'none' | 'one' | 'all';
}

export const useAudioPlayer = (tracks: Track[]) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isReplayingRef = useRef(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');

  const currentTrack = tracks[currentTrackIndex] || null;

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.pause();
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      console.log(`🔄 TRACK CHANGE: Loading "${currentTrack.title}" by ${currentTrack.artist}`);
      console.log(`🔄 TRACK CHANGE: Source: ${currentTrack.src}`);
      
      // Only pause if we're not intentionally replaying the same track
      if (!isReplayingRef.current) {
        console.log(`🔄 TRACK CHANGE: Pausing previous track`);
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log(`🔄 TRACK CHANGE: Skipping pause (replay mode)`);
      }
      
      audioRef.current.src = currentTrack.src;
      audioRef.current.volume = volume;
      setCurrentTime(0);
      isReplayingRef.current = false; // Reset the flag
      console.log(`🔄 TRACK CHANGE: Audio source and volume updated for "${currentTrack.title}"`);
    }
  }, [currentTrack, volume]);

  const play = useCallback(async () => {
    if (audioRef.current && currentTrack) {
      console.log(`▶️ PLAY: Starting playback of "${currentTrack.title}" by ${currentTrack.artist}`);
      try {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          console.log(`▶️ PLAY: Play promise created, waiting for playback to start...`);
          await playPromise;
          setIsPlaying(true);
          console.log(`▶️ PLAY: Successfully started playback of "${currentTrack.title}"`);
        }
      } catch (error) {
        console.error('❌ PLAY: Error playing audio:', error);
        setIsPlaying(false);
      }
    } else if (!currentTrack) {
      console.log(`⚠️ PLAY: No current track selected`);
    } else {
      console.log(`⚠️ PLAY: Audio element not available`);
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current && currentTrack) {
      console.log(`⏸️ PAUSE: Pausing playback of "${currentTrack.title}"`);
      audioRef.current.pause();
      setIsPlaying(false);
      console.log(`⏸️ PAUSE: Successfully paused "${currentTrack.title}"`);
    } else if (!currentTrack) {
      console.log(`⚠️ PAUSE: No current track to pause`);
    } else {
      console.log(`⚠️ PAUSE: Audio element not available`);
    }
  }, [currentTrack]);

  const togglePlay = useCallback(() => {
    if (currentTrack) {
      console.log(`🔄 TOGGLE: ${isPlaying ? 'Pausing' : 'Playing'} "${currentTrack.title}"`);
    }
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause, currentTrack]);

  const next = useCallback(() => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    const currentTrackTitle = currentTrack?.title || 'Unknown';
    const nextTrack = tracks[nextIndex];
    const nextTrackTitle = nextTrack?.title || 'Unknown';
    
    console.log(`⏭️ NEXT: Moving from "${currentTrackTitle}" (${currentTrackIndex}) to "${nextTrackTitle}" (${nextIndex})`);
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(false);
    console.log(`⏭️ NEXT: Track changed to "${nextTrackTitle}"`);
  }, [currentTrackIndex, tracks.length, currentTrack, tracks]);

  // Handle track ended event with repeat logic
  const handleEnded = useCallback(async () => {
    console.log(`🏁 TRACK ENDED: "${currentTrack?.title}" finished playing (repeat mode: ${repeatMode})`);
    
    if (repeatMode === 'one') {
      // Repeat current track
      console.log(`🔁 REPEAT ONE: Replaying "${currentTrack?.title}"`);
      if (audioRef.current) {
        isReplayingRef.current = true; // Set flag to prevent pause in useEffect
        audioRef.current.currentTime = 0;
        try {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
            console.log(`🔁 REPEAT ONE: Successfully replayed "${currentTrack?.title}"`);
          }
        } catch (error) {
          console.error('❌ REPEAT ONE: Error replaying audio:', error);
          setIsPlaying(false);
        }
      }
    } else if (repeatMode === 'all') {
      // Go to next track (will loop back to first if at end)
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      const nextTrack = tracks[nextIndex];
      console.log(`🔄 REPEAT ALL: Moving to next track "${nextTrack?.title}" (${nextIndex})`);
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(false);
    } else {
      // No repeat - go to next track
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      const nextTrack = tracks[nextIndex];
      console.log(`⏭️ NO REPEAT: Moving to next track "${nextTrack?.title}" (${nextIndex})`);
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(false);
    }
  }, [repeatMode, currentTrackIndex, tracks.length, currentTrack, tracks]);

  // Update ended event listener when handleEnded changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.removeEventListener('ended', handleEnded);
      audioRef.current.addEventListener('ended', handleEnded);
    }
  }, [handleEnded]);

  const previous = useCallback(() => {
    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    const currentTrackTitle = currentTrack?.title || 'Unknown';
    const prevTrack = tracks[prevIndex];
    const prevTrackTitle = prevTrack?.title || 'Unknown';
    
    console.log(`⏮️ PREVIOUS: Moving from "${currentTrackTitle}" (${currentTrackIndex}) to "${prevTrackTitle}" (${prevIndex})`);
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(false);
    console.log(`⏮️ PREVIOUS: Track changed to "${prevTrackTitle}"`);
  }, [currentTrackIndex, tracks.length, currentTrack, tracks]);

  const seek = useCallback((time: number) => {
    if (audioRef.current && currentTrack) {
      const formattedTime = `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;
      console.log(`⏱️ SEEK: Seeking to ${formattedTime} in "${currentTrack.title}"`);
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      console.log(`⏱️ SEEK: Successfully seeked to ${formattedTime}`);
    } else if (!currentTrack) {
      console.log(`⚠️ SEEK: No current track to seek in`);
    } else {
      console.log(`⚠️ SEEK: Audio element not available`);
    }
  }, [currentTrack]);

  const setVolumeLevel = useCallback((vol: number) => {
    const clampedVolume = Math.max(0, Math.min(1, vol));
    const volumePercent = Math.round(clampedVolume * 100);
    console.log(`🔊 VOLUME: Setting volume to ${volumePercent}% (${clampedVolume.toFixed(2)})`);
    setVolume(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
      console.log(`🔊 VOLUME: Successfully set audio volume to ${volumePercent}%`);
    }
  }, []);

  const selectTrack = useCallback((trackIndex: number) => {
    if (trackIndex >= 0 && trackIndex < tracks.length) {
      const currentTrackTitle = currentTrack?.title || 'Unknown';
      const selectedTrack = tracks[trackIndex];
      const selectedTrackTitle = selectedTrack?.title || 'Unknown';
      
      console.log(`🎵 SELECT: Changing from "${currentTrackTitle}" (${currentTrackIndex}) to "${selectedTrackTitle}" (${trackIndex})`);
      setCurrentTrackIndex(trackIndex);
      setIsPlaying(false);
      console.log(`🎵 SELECT: Track selected "${selectedTrackTitle}"`);
    } else {
      console.log(`⚠️ SELECT: Invalid track index ${trackIndex}, available tracks: ${tracks.length}`);
    }
  }, [tracks.length, currentTrack, tracks, currentTrackIndex]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      let newMode: 'none' | 'one' | 'all';
      switch (prev) {
        case 'none':
          newMode = 'all';
          break;
        case 'all':
          newMode = 'one';
          break;
        case 'one':
          newMode = 'none';
          break;
        default:
          newMode = 'none';
      }
      console.log(`🔁 REPEAT: Changed from "${prev}" to "${newMode}"`);
      return newMode;
    });
  }, []);

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