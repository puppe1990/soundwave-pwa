import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  const wasPlayingRef = useRef(false); // Track if audio was playing before track change
  const hasUserInteractedRef = useRef(false); // Track if user has interacted with audio
  const manuallyPausedRef = useRef(false); // Track if user manually paused (vs natural track end)
  const pauseOriginRef = useRef<'none' | 'manual' | 'track-change' | 'cleanup'>('none');
  const externalInterruptionRef = useRef(false);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const { toast } = useToast();

  const currentTrack = tracks[currentTrackIndex] || null;

  const attemptResumeAfterInterruption = useCallback(async () => {
    if (!isMobile || !audioRef.current || !currentTrack) {
      return;
    }

    if (!externalInterruptionRef.current || manuallyPausedRef.current || !hasUserInteractedRef.current) {
      return;
    }

    if (document.hidden || !audioRef.current.paused) {
      return;
    }

    console.log(`📱 RESUME: Attempting to resume "${currentTrack.title}" after external interruption`);

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      wasPlayingRef.current = true;
      manuallyPausedRef.current = false;
      externalInterruptionRef.current = false;
      console.log(`📱 RESUME: Playback restored for "${currentTrack.title}"`);
    } catch (error) {
      console.log(`📱 RESUME: Resume attempt failed, waiting for next visibility/focus event`, error);
    }
  }, [currentTrack, isMobile]);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    
    // Use explicit playback control instead of browser-managed resume behavior.
    audio.preload = 'none';
    audio.controls = false;
    
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

    const handlePlayEvent = () => {
      setIsPlaying(true);
      wasPlayingRef.current = true;
      manuallyPausedRef.current = false;
      externalInterruptionRef.current = false;
      pauseOriginRef.current = 'none';
    };

    const handlePauseEvent = () => {
      setIsPlaying(false);

      if (audio.ended) {
        pauseOriginRef.current = 'none';
        return;
      }

      if (pauseOriginRef.current === 'manual') {
        wasPlayingRef.current = false;
        manuallyPausedRef.current = true;
        externalInterruptionRef.current = false;
        pauseOriginRef.current = 'none';
        return;
      }

      if (pauseOriginRef.current === 'track-change' || pauseOriginRef.current === 'cleanup') {
        pauseOriginRef.current = 'none';
        return;
      }

      if (wasPlayingRef.current && !manuallyPausedRef.current) {
        externalInterruptionRef.current = true;
        console.log(`📱 INTERRUPTION: External audio interruption detected`);
      }

      pauseOriginRef.current = 'none';
    };

    const handleError = (e: Event) => {
      console.error(`🎵 AUDIO INIT: Audio error:`, e);
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('play', handlePlayEvent);
    audio.addEventListener('pause', handlePauseEvent);
    audio.addEventListener('error', handleError);

    return () => {
      console.log(`🎵 AUDIO INIT: Cleaning up audio element`);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('play', handlePlayEvent);
      audio.removeEventListener('pause', handlePauseEvent);
      audio.removeEventListener('error', handleError);
      pauseOriginRef.current = 'cleanup';
      audio.pause();
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void attemptResumeAfterInterruption();
      }
    };

    const handleWindowFocus = () => {
      void attemptResumeAfterInterruption();
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pageshow', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pageshow', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attemptResumeAfterInterruption, isMobile]);

  const play = useCallback(async () => {
    if (audioRef.current && currentTrack) {
      console.log(`▶️ PLAY: Starting playback of "${currentTrack.title}" by ${currentTrack.artist}`);
      console.log(`▶️ PLAY: Audio readyState: ${audioRef.current.readyState}`);
      console.log(`▶️ PLAY: Audio src: ${audioRef.current.src}`);
      console.log(`▶️ PLAY: Audio paused: ${audioRef.current.paused}`);
      console.log(`▶️ PLAY: Has user interacted: ${hasUserInteractedRef.current}`);
      
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
          hasUserInteractedRef.current = true; // Mark that user has successfully played audio
          manuallyPausedRef.current = false; // Clear manual pause flag when playing
          wasPlayingRef.current = true; // Mark that we're playing
          console.log(`▶️ PLAY: Successfully started playback of "${currentTrack.title}"`);
          console.log(`📱 MOBILE: User interaction recorded - future autoplay should work`);
        }
      } catch (error) {
        console.error('❌ PLAY: Error playing audio:', error);
        console.error('❌ PLAY: Error details:', {
          name: error.name,
          message: error.message,
          readyState: audioRef.current?.readyState,
          src: audioRef.current?.src
        });
        
        // Check if this is a mobile autoplay policy error
        if (error.name === 'NotAllowedError' || error.message.includes('autoplay')) {
          console.log(`📱 MOBILE: Autoplay blocked, showing user guidance`);
          toast({
            title: "Tap to Play",
            description: "Please tap the play button to start audio playback on mobile devices.",
            duration: 3000,
          });
        }
        
        setIsPlaying(false);
      }
    } else if (!currentTrack) {
      console.log(`⚠️ PLAY: No current track selected`);
    } else {
      console.log(`⚠️ PLAY: Audio element not available`);
    }
  }, [currentTrack, volume, toast]);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      console.log(`🔄 TRACK CHANGE: Loading "${currentTrack.title}" by ${currentTrack.artist}`);
      
      pauseOriginRef.current = 'track-change';
      audioRef.current.pause();
      setIsPlaying(false);
      audioRef.current.src = currentTrack.src;
      audioRef.current.volume = volume;
      setCurrentTime(0);
      
      console.log(`🔄 TRACK CHANGE: Audio source updated for "${currentTrack.title}"`);
      
      // Auto-play if audio was playing before track change
      if (wasPlayingRef.current) {
        console.log(`🔄 TRACK CHANGE: Auto-playing "${currentTrack.title}" (was playing before)`);
        
        // For mobile, check if user has interacted before attempting autoplay
        if (isMobile && !hasUserInteractedRef.current) {
          console.log(`📱 MOBILE TRACK CHANGE: User hasn't interacted, can't autoplay`);
          toast({
            title: "Tap to Play",
            description: "Please tap the play button to continue playback on mobile devices.",
            duration: 3000,
          });
        } else {
          setTimeout(() => {
            void play();
          }, 100);
        }
      }
    }
  }, [currentTrack, volume, isMobile, play, toast]);

  const pause = useCallback(() => {
    if (audioRef.current && currentTrack) {
      console.log(`⏸️ PAUSE: Pausing playback of "${currentTrack.title}"`);
      pauseOriginRef.current = 'manual';
      audioRef.current.pause();
      setIsPlaying(false);
      wasPlayingRef.current = false; // Clear the wasPlaying flag when manually pausing
      manuallyPausedRef.current = true; // Mark that user manually paused
      externalInterruptionRef.current = false;
      console.log(`⏸️ PAUSE: Successfully paused "${currentTrack.title}"`);
    } else if (!currentTrack) {
      console.log(`⚠️ PAUSE: No current track to pause`);
    } else {
      console.log(`⚠️ PAUSE: Audio element not available`);
    }
  }, [currentTrack]);

  const togglePlay = useCallback(async () => {
    if (currentTrack) {
      console.log(`🔄 TOGGLE: ${isPlaying ? 'Pausing' : 'Playing'} "${currentTrack.title}"`);
    }
    
    // Mark that user has interacted with audio controls
    hasUserInteractedRef.current = true;
    
    if (isPlaying) {
      // Pause the audio
      if (audioRef.current) {
        pauseOriginRef.current = 'manual';
        audioRef.current.pause();
        setIsPlaying(false);
        wasPlayingRef.current = false; // Clear the wasPlaying flag when manually pausing
        manuallyPausedRef.current = true; // Mark that user manually paused
        externalInterruptionRef.current = false;
        console.log(`⏸️ TOGGLE: Paused "${currentTrack?.title}"`);
      }
    } else {
      // For mobile devices, ensure we call play() directly in the user gesture context
      if (audioRef.current && currentTrack) {
        try {
          // Set audio source if not already set
          if (!audioRef.current.src || audioRef.current.src !== currentTrack.src) {
            audioRef.current.src = currentTrack.src;
            audioRef.current.volume = volume;
            setCurrentTime(0);
          }
          
          // Try to play immediately in the user gesture context
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
            manuallyPausedRef.current = false; // Clear manual pause flag when playing
            wasPlayingRef.current = true; // Mark that we're playing
            console.log(`📱 MOBILE: Successfully started playback via direct play() call`);
            console.log(`📱 MOBILE: User interaction recorded - future autoplay should work`);
            return;
          }
        } catch (error) {
          console.log(`📱 MOBILE: Direct play() failed, falling back to regular play function:`, error);
          // Fall back to the regular play function
          await play();
        }
      } else {
        await play();
      }
    }
  }, [isPlaying, currentTrack, volume, play]);

  const next = useCallback(() => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    const currentTrackTitle = currentTrack?.title || 'Unknown';
    const nextTrack = tracks[nextIndex];
    const nextTrackTitle = nextTrack?.title || 'Unknown';
    
    console.log(`⏭️ NEXT: Moving from "${currentTrackTitle}" (${currentTrackIndex}) to "${nextTrackTitle}" (${nextIndex})`);
    
    // Mark that user has interacted with audio controls
    hasUserInteractedRef.current = true;
    
    // Store current play state before changing track
    wasPlayingRef.current = isPlaying;
    manuallyPausedRef.current = false; // Clear manual pause flag when changing tracks
    console.log(`⏭️ NEXT: Storing play state: ${wasPlayingRef.current ? 'playing' : 'paused'}`);
    
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(false);
    console.log(`⏭️ NEXT: Track changed to "${nextTrackTitle}"`);
  }, [currentTrackIndex, currentTrack, tracks, isPlaying]);

  // Handle track ended event with repeat logic
  const handleEnded = useCallback(async () => {
    // Get current values at the time of the event
    const currentRepeatMode = repeatMode;
    const currentIndex = currentTrackIndex;
    const currentTracksLength = tracks.length;
    const track = tracks[currentIndex];
    
    console.log(`🏁 TRACK ENDED: "${track?.title}" finished playing (repeat mode: ${currentRepeatMode})`);
    console.log(`🏁 TRACK ENDED: wasPlayingRef: ${wasPlayingRef.current}, manuallyPaused: ${manuallyPausedRef.current}`);
    
    // Only auto-play if the user was playing and didn't manually pause
    // wasPlayingRef tracks if user was playing before track ended
    // manuallyPausedRef tracks if user manually paused (vs natural track end)
    if (wasPlayingRef.current && !manuallyPausedRef.current) {
      if (currentRepeatMode === 'one') {
        // Repeat current track - don't change track, just restart playback
        console.log(`🔁 REPEAT ONE: Replaying "${track?.title}"`);
        if (audioRef.current && track) {
          try {
            audioRef.current.currentTime = 0;
            
            // For mobile devices, we need to handle autoplay restrictions
            if (isMobile) {
              console.log(`📱 MOBILE REPEAT: Attempting to replay on mobile device`);
              
              // Check if user has interacted before attempting autoplay
              if (hasUserInteractedRef.current) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                  await playPromise;
                  setIsPlaying(true);
                  console.log(`📱 MOBILE REPEAT: Successfully replayed "${track.title}"`);
                }
              } else {
                // User hasn't interacted yet, can't autoplay on mobile
                console.log(`📱 MOBILE REPEAT: User hasn't interacted, can't autoplay`);
                setIsPlaying(false);
                wasPlayingRef.current = false;
                
                // Show toast to guide user
                toast({
                  title: "Tap to Continue",
                  description: "Please tap the play button to continue playback on mobile.",
                  duration: 3000,
                });
              }
            } else {
              // Desktop - normal autoplay
              const playPromise = audioRef.current.play();
              if (playPromise !== undefined) {
                await playPromise;
                setIsPlaying(true);
                console.log(`🔁 REPEAT ONE: Successfully replayed "${track.title}"`);
              }
            }
          } catch (error) {
            console.error('❌ REPEAT ONE: Error replaying audio:', error);
            console.error('❌ REPEAT ONE: Error details:', {
              name: error.name,
              message: error.message,
              isMobile: isMobile,
              hasUserInteracted: hasUserInteractedRef.current
            });
            
            setIsPlaying(false);
            wasPlayingRef.current = false; // Clear flag on error
            
            // Show appropriate message based on error type
            if (error.name === 'NotAllowedError' || error.message.includes('autoplay')) {
              toast({
                title: "Tap to Continue",
                description: "Please tap the play button to continue playback.",
                duration: 3000,
              });
            }
          }
        }
      } else if (currentRepeatMode === 'all') {
        // Go to next track (will loop back to first if at end)
        const nextIndex = (currentIndex + 1) % currentTracksLength;
        const nextTrack = tracks[nextIndex];
        console.log(`🔄 REPEAT ALL: Moving to next track "${nextTrack?.title}" (${nextIndex})`);
        
        // Store that we want to continue playing after track change
        wasPlayingRef.current = true;
        manuallyPausedRef.current = false;
        
        setCurrentTrackIndex(nextIndex);
        setIsPlaying(false);
        
        // For mobile, we might need to wait for user interaction
        if (isMobile && !hasUserInteractedRef.current) {
          console.log(`📱 MOBILE REPEAT ALL: User hasn't interacted, will need manual play`);
        }
      } else {
        // No repeat - go to next track
        const nextIndex = (currentIndex + 1) % currentTracksLength;
        const nextTrack = tracks[nextIndex];
        console.log(`⏭️ NO REPEAT: Moving to next track "${nextTrack?.title}" (${nextIndex})`);
        
        // Store that we want to continue playing after track change
        wasPlayingRef.current = true;
        manuallyPausedRef.current = false;
        
        setCurrentTrackIndex(nextIndex);
        setIsPlaying(false);
        
        // For mobile, we might need to wait for user interaction
        if (isMobile && !hasUserInteractedRef.current) {
          console.log(`📱 MOBILE NO REPEAT: User hasn't interacted, will need manual play`);
        }
      }
    } else {
      console.log(`🏁 TRACK ENDED: User manually paused or not playing, not auto-playing`);
      setIsPlaying(false);
      // Clear the manually paused flag when track ends naturally (user didn't pause manually)
      if (!manuallyPausedRef.current) {
        wasPlayingRef.current = false; // Clear the wasPlaying flag when track ends naturally
      }
    }
  }, [repeatMode, currentTrackIndex, tracks, isMobile, toast]);

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
    
    // Mark that user has interacted with audio controls
    hasUserInteractedRef.current = true;
    
    // Store current play state before changing track
    wasPlayingRef.current = isPlaying;
    manuallyPausedRef.current = false; // Clear manual pause flag when changing tracks
    console.log(`⏮️ PREVIOUS: Storing play state: ${wasPlayingRef.current ? 'playing' : 'paused'}`);
    
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(false);
    console.log(`⏮️ PREVIOUS: Track changed to "${prevTrackTitle}"`);
  }, [currentTrackIndex, currentTrack, tracks, isPlaying]);

  const seek = useCallback((time: number) => {
    if (audioRef.current && currentTrack) {
      const now = Date.now();
      // Only log every 500ms to reduce spam
      if (now - lastSeekTimeRef.current > 500) {
        const formattedTime = `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;
        console.log(`⏱️ SEEK: Seeking to ${formattedTime} in "${currentTrack.title}"`);
        lastSeekTimeRef.current = now;
      }
      
      // Mark that user has interacted with audio controls
      hasUserInteractedRef.current = true;
      
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
    
    // Mark that user has interacted with audio controls
    hasUserInteractedRef.current = true;
    
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
      
      // Mark that user has interacted with audio controls
      hasUserInteractedRef.current = true;
      
      // Store current play state before changing track
      wasPlayingRef.current = isPlaying;
      manuallyPausedRef.current = false; // Clear manual pause flag when changing tracks
      console.log(`🎵 SELECT: Storing play state: ${wasPlayingRef.current ? 'playing' : 'paused'}`);
      
      setCurrentTrackIndex(trackIndex);
      setIsPlaying(false);
      console.log(`🎵 SELECT: Track selected "${selectedTrackTitle}"`);
    } else {
      console.log(`⚠️ SELECT: Invalid track index ${trackIndex}, available tracks: ${tracks.length}`);
    }
  }, [currentTrack, tracks, currentTrackIndex, isPlaying]);

  const toggleRepeat = useCallback(() => {
    // Mark that user has interacted with audio controls
    hasUserInteractedRef.current = true;
    
    setRepeatMode(prev => {
      let newMode: 'none' | 'one' | 'all';
      let toastTitle: string;
      let toastDescription: string;
      
      switch (prev) {
        case 'none':
          newMode = 'all';
          toastTitle = '🔁 Repeat All';
          toastDescription = 'Playlist will repeat continuously';
          break;
        case 'all':
          newMode = 'one';
          toastTitle = '🔁 Repeat One';
          toastDescription = 'Current track will repeat';
          break;
        case 'one':
          newMode = 'none';
          toastTitle = '🔁 Repeat Off';
          toastDescription = 'Normal playback mode';
          break;
        default:
          newMode = 'none';
          toastTitle = '🔁 Repeat Off';
          toastDescription = 'Normal playback mode';
      }
      
      console.log(`🔁 REPEAT: Changed from "${prev}" to "${newMode}"`);
      
      // Add haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        // Light haptic feedback for repeat mode change
        navigator.vibrate(50);
      }
      
      // Show toast notification with enhanced visual feedback
      toast({
        title: toastTitle,
        description: toastDescription,
        duration: 2000,
      });
      
      return newMode;
    });
  }, [toast]);

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
