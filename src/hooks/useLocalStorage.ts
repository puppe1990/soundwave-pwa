import { useState, useEffect, useCallback } from 'react';
import { Track } from './useAudioPlayer';

const STORAGE_KEY = 'soundwave-uploaded-tracks';

export interface StoredTrack extends Omit<Track, 'src'> {
  fileData: string; // Base64 encoded file data
  fileName: string;
  fileSize: number;
  fileType: string;
}

export const useLocalStorage = () => {
  const [storedTracks, setStoredTracks] = useState<StoredTrack[]>([]);

  // Load tracks from localStorage on initialization
  useEffect(() => {
    const loadStoredTracks = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const tracks: StoredTrack[] = JSON.parse(stored);
          setStoredTracks(tracks);
        }
      } catch (error) {
        console.error('Error loading stored tracks:', error);
      }
    };

    loadStoredTracks();
  }, []);

  // Save tracks to localStorage
  const saveTracks = useCallback(async (tracks: StoredTrack[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
      setStoredTracks(tracks);
    } catch (error) {
      console.error('Error saving tracks to localStorage:', error);
      throw error;
    }
  }, []);

  // Add new tracks to storage
  const addTracks = useCallback(async (newTracks: StoredTrack[]) => {
    const updatedTracks = [...storedTracks, ...newTracks];
    await saveTracks(updatedTracks);
  }, [storedTracks, saveTracks]);

  // Remove a track from storage
  const removeTrack = useCallback(async (trackId: string) => {
    const updatedTracks = storedTracks.filter(track => track.id !== trackId);
    await saveTracks(updatedTracks);
  }, [storedTracks, saveTracks]);

  // Clear all stored tracks
  const clearAllTracks = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setStoredTracks([]);
  }, []);

  // Convert StoredTrack back to Track with blob URL
  const convertToTrack = useCallback((storedTrack: StoredTrack): Track => {
    // Create blob from base64 data
    const byteCharacters = atob(storedTrack.fileData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: storedTrack.fileType });
    const audioUrl = URL.createObjectURL(blob);

    return {
      id: storedTrack.id,
      title: storedTrack.title,
      artist: storedTrack.artist,
      album: storedTrack.album,
      duration: storedTrack.duration,
      src: audioUrl,
      cover: storedTrack.cover,
    };
  }, []);

  // Convert all stored tracks to Track objects
  const getTracks = useCallback((): Track[] => {
    return storedTracks.map(convertToTrack);
  }, [storedTracks, convertToTrack]);

  return {
    storedTracks,
    saveTracks,
    addTracks,
    removeTrack,
    clearAllTracks,
    getTracks,
    convertToTrack,
  };
};
