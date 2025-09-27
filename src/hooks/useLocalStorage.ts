import { useState, useEffect, useCallback } from 'react';
import { Track } from './useAudioPlayer';

const STORAGE_KEY = 'soundwave-uploaded-tracks';
const FOLDERS_STORAGE_KEY = 'soundwave-folders';

export interface StoredTrack extends Omit<Track, 'src'> {
  fileData: string; // Base64 encoded file data
  fileName: string;
  fileSize: number;
  fileType: string;
  folder?: string; // Folder name for organization
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export const useLocalStorage = () => {
  const [storedTracks, setStoredTracks] = useState<StoredTrack[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  // Load tracks and folders from localStorage on initialization
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        // Load tracks
        const storedTracks = localStorage.getItem(STORAGE_KEY);
        if (storedTracks) {
          const tracks: StoredTrack[] = JSON.parse(storedTracks);
          setStoredTracks(tracks);
        }

        // Load folders
        const storedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);
        if (storedFolders) {
          const foldersData: Folder[] = JSON.parse(storedFolders);
          setFolders(foldersData);
        } else {
          // Create default folder if none exist
          const defaultFolder: Folder = {
            id: 'default',
            name: 'All Tracks',
            createdAt: Date.now()
          };
          setFolders([defaultFolder]);
          localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify([defaultFolder]));
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };

    loadStoredData();
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
      folder: storedTrack.folder,
    };
  }, []);

  // Convert all stored tracks to Track objects
  const getTracks = useCallback((): Track[] => {
    return storedTracks.map(convertToTrack);
  }, [storedTracks, convertToTrack]);

  // Get tracks filtered by folder
  const getTracksByFolder = useCallback((folderName?: string): Track[] => {
    if (!folderName) return getTracks();
    return storedTracks
      .filter(track => track.folder === folderName)
      .map(convertToTrack);
  }, [storedTracks, convertToTrack, getTracks]);

  // Folder management functions
  const saveFolders = useCallback(async (foldersData: Folder[]) => {
    try {
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(foldersData));
      setFolders(foldersData);
    } catch (error) {
      console.error('Error saving folders to localStorage:', error);
      throw error;
    }
  }, []);

  const createFolder = useCallback(async (name: string) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      createdAt: Date.now()
    };
    const updatedFolders = [...folders, newFolder];
    await saveFolders(updatedFolders);
    return newFolder;
  }, [folders, saveFolders]);

  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    const updatedFolders = folders.map(folder => 
      folder.id === folderId ? { ...folder, name: newName } : folder
    );
    await saveFolders(updatedFolders);
  }, [folders, saveFolders]);

  const deleteFolder = useCallback(async (folderId: string) => {
    // Move all tracks from this folder to default folder
    const updatedTracks = storedTracks.map(track => 
      track.folder === folders.find(f => f.id === folderId)?.name 
        ? { ...track, folder: undefined }
        : track
    );
    
    // Remove the folder
    const updatedFolders = folders.filter(folder => folder.id !== folderId);
    
    await saveTracks(updatedTracks);
    await saveFolders(updatedFolders);
  }, [folders, storedTracks, saveFolders, saveTracks]);

  const moveTrackToFolder = useCallback(async (trackId: string, folderName?: string) => {
    const updatedTracks = storedTracks.map(track => 
      track.id === trackId ? { ...track, folder: folderName } : track
    );
    await saveTracks(updatedTracks);
  }, [storedTracks, saveTracks]);

  return {
    storedTracks,
    folders,
    saveTracks,
    addTracks,
    removeTrack,
    clearAllTracks,
    getTracks,
    getTracksByFolder,
    convertToTrack,
    createFolder,
    renameFolder,
    deleteFolder,
    moveTrackToFolder,
  };
};
