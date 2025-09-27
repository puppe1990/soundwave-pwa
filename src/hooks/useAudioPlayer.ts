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
  const lastSeekTimeRef = useRef(0);
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
    
    console.log(`🎵 AUDIO INIT: Creating new audio element`);

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      console.log(`🎵 AUDIO INIT: Metadata loaded, duration: ${audio.duration}s`);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      console.log(`🎵 AUDIO INIT: Load started`);
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      console.error(`🎵 AUDIO INIT: Audio error:`, e);
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);

    return () => {
      console.log(`🎵 AUDIO INIT: Cleaning up audio element`);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      console.log(`🔄 TRACK CHANGE: Loading "${currentTrack.title}" by ${currentTrack.artist}`);
      
      audioRef.current.pause();
      setIsPlaying(false);
      audioRef.current.src = currentTrack.src;
      audioRef.current.volume = volume;
      setCurrentTime(0);
      
      console.log(`🔄 TRACK CHANGE: Audio source updated for "${currentTrack.title}"`);
    }
  }, [currentTrackIndex, volume]); // Use currentTrackIndex for stability

  const play = useCallback(async () => {
    if (audioRef.current && currentTrack) {
      console.log(`▶️ PLAY: Starting playback of "${currentTrack.title}" by ${currentTrack.artist}`);
      console.log(`▶️ PLAY: Audio readyState: ${audioRef.current.readyState}`);
      console.log(`▶️ PLAY: Audio src: ${audioRef.current.src}`);
      console.log(`▶️ PLAY: Audio paused: ${audioRef.current.paused}`);
      
      // If audio source is not set, set it now
      if (!audioRef.current.src || audioRef.current.src !== currentTrack.src) {
        console.log(`▶️ PLAY: Setting audio source: ${currentTrack.src}`);
        audioRef.current.src = currentTrack.src;
        audioRef.current.volume = volume;
        setCurrentTime(0);
      }
      
      try {
        // Check if audio is ready to play
        if (audioRef.current.readyState < 2) {
          console.log(`▶️ PLAY: Audio not ready, waiting for canplay event...`);
          await new Promise((resolve) => {
            const handleCanPlay = () => {
              audioRef.current?.removeEventListener('canplay', handleCanPlay);
              resolve(void 0);
            };
            audioRef.current?.addEventListener('canplay', handleCanPlay);
          });
        }
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          console.log(`▶️ PLAY: Play promise created, waiting for playback to start...`);
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Play timeout after 10 seconds')), 10000);
          });
          
          await Promise.race([playPromise, timeoutPromise]);
          setIsPlaying(true);
          console.log(`▶️ PLAY: Successfully started playback of "${currentTrack.title}"`);
        }
      } catch (error) {
        console.error('❌ PLAY: Error playing audio:', error);
        console.error('❌ PLAY: Error details:', {
          name: error.name,
          message: error.message,
          readyState: audioRef.current?.readyState,
          src: audioRef.current?.src
        });
        setIsPlaying(false);
      }
    } else if (!currentTrack) {
      console.log(`⚠️ PLAY: No current track selected`);
    } else {
      console.log(`⚠️ PLAY: Audio element not available`);
    }
  }, [currentTrack, volume]);

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
    // Get current values at the time of the event
    const currentRepeatMode = repeatMode;
    const currentIndex = currentTrackIndex;
    const currentTracksLength = tracks.length;
    const track = tracks[currentIndex];
    
    console.log(`🏁 TRACK ENDED: "${track?.title}" finished playing (repeat mode: ${currentRepeatMode})`);
    
    if (currentRepeatMode === 'one') {
      // Repeat current track - don't change track, just restart playback
      console.log(`🔁 REPEAT ONE: Replaying "${track?.title}"`);
      if (audioRef.current && track) {
        try {
          audioRef.current.currentTime = 0;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
            console.log(`🔁 REPEAT ONE: Successfully replayed "${track.title}"`);
          }
        } catch (error) {
          console.error('❌ REPEAT ONE: Error replaying audio:', error);
          setIsPlaying(false);
        }
      }
    } else if (currentRepeatMode === 'all') {
      // Go to next track (will loop back to first if at end)
      const nextIndex = (currentIndex + 1) % currentTracksLength;
      const nextTrack = tracks[nextIndex];
      console.log(`🔄 REPEAT ALL: Moving to next track "${nextTrack?.title}" (${nextIndex})`);
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(false);
    } else {
      // No repeat - go to next track
      const nextIndex = (currentIndex + 1) % currentTracksLength;
      const nextTrack = tracks[nextIndex];
      console.log(`⏭️ NO REPEAT: Moving to next track "${nextTrack?.title}" (${nextIndex})`);
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(false);
    }
  }, [repeatMode, currentTrackIndex, tracks]);

  // Update ended event listener when handleEnded changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.removeEventListener('ended', handleEnded);
      audioRef.current.addEventListener('ended', handleEnded);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
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
      const now = Date.now();
      // Only log every 500ms to reduce spam
      if (now - lastSeekTimeRef.current > 500) {
        const formattedTime = `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;
        console.log(`⏱️ SEEK: Seeking to ${formattedTime} in "${currentTrack.title}"`);
        lastSeekTimeRef.current = now;
      }
      audioRef.current.currentTime = time;
      setCurrentTime(time);
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