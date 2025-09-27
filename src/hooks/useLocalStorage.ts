import { useState, useEffect, useCallback } from 'react';
import { Track } from './useAudioPlayer';

const STORAGE_KEY = 'soundwave-uploaded-tracks';
const FOLDERS_STORAGE_KEY = 'soundwave-folders';

export interface StoredTrack extends Omit<Track, 'src'> {
  filePath?: string; // File path (for File System Access API)
  fileHandle?: FileSystemFileHandle; // File handle (for File System Access API)
  fileName: string;
  fileSize: number;
  fileType: string;
  folder?: string; // Folder name for organization
  createdAt: number; // Timestamp when track was uploaded
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export const useLocalStorage = () => {
  const [storedTracks, setStoredTracks] = useState<StoredTrack[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load tracks and folders from localStorage on initialization
  useEffect(() => {
    if (isInitialized) return;
    
    const loadStoredData = async () => {
      try {
        console.log('🔄 Loading stored data from localStorage...');
        
        // Load tracks
        const storedTracks = localStorage.getItem(STORAGE_KEY);
        if (storedTracks) {
          const tracks: StoredTrack[] = JSON.parse(storedTracks);
          console.log(`📁 Found ${tracks.length} stored tracks`);
          
          // Migrate old tracks without createdAt field
          const migratedTracks = tracks.map(track => ({
            ...track,
            createdAt: track.createdAt || Date.now() - Math.random() * 1000000 // Random timestamp for old tracks
          }));
          setStoredTracks(migratedTracks);
          console.log('✅ Tracks loaded and migrated successfully');
        } else {
          console.log('📁 No stored tracks found');
        }

        // Load folders
        const storedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);
        if (storedFolders) {
          const foldersData: Folder[] = JSON.parse(storedFolders);
          setFolders(foldersData);
          console.log(`📂 Found ${foldersData.length} folders:`, foldersData.map(f => f.name));
        } else {
          // Create default folder if none exist
          const defaultFolder: Folder = {
            id: 'default',
            name: 'All Tracks',
            createdAt: Date.now()
          };
          setFolders([defaultFolder]);
          localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify([defaultFolder]));
          console.log('📂 Created default folder');
        }
        
        setIsInitialized(true);
        console.log('✅ useLocalStorage initialized');
      } catch (error) {
        console.error('❌ Error loading stored data:', error);
        setIsInitialized(true); // Set to true even on error to prevent infinite retries
      }
    };

    loadStoredData();
  }, [isInitialized]);

  // Save tracks to localStorage
  const saveTracks = useCallback(async (tracks: StoredTrack[]) => {
    try {
      console.log(`💾 Saving ${tracks.length} tracks to localStorage...`);
      
      // Check estimated size before saving
      const estimatedSize = JSON.stringify(tracks).length;
      console.log(`📊 Estimated storage size: ${Math.round(estimatedSize / 1024)}KB`);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
      setStoredTracks([...tracks]); // Force new array reference to trigger re-render
      console.log('✅ Tracks saved successfully');
      console.log(`📊 setStoredTracks called with ${tracks.length} tracks`);
    } catch (error) {
      console.error('❌ Error saving tracks to localStorage:', error);
      
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.log('⚠️ Storage quota exceeded, attempting cleanup...');
        // Try to clean up old tracks if quota is exceeded
        const sortedTracks = tracks.sort((a, b) => b.createdAt - a.createdAt);
        const reducedTracks = sortedTracks.slice(0, Math.floor(tracks.length * 0.3)); // Keep 30% of tracks
        
        try {
          console.log(`🧹 Reduced tracks from ${tracks.length} to ${reducedTracks.length}`);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedTracks));
          setStoredTracks(reducedTracks);
          throw new Error('Storage quota exceeded. Some older tracks were removed to make space.');
        } catch (retryError) {
          console.log('🧹 Clearing all tracks due to persistent quota error');
          // If still failing, clear all tracks
          localStorage.removeItem(STORAGE_KEY);
          setStoredTracks([]);
          throw new Error('Storage quota exceeded. All tracks have been cleared. Please try uploading smaller files.');
        }
      }
      
      throw error;
    }
  }, []);

  // Add new tracks to storage
  const addTracks = useCallback(async (newTracks: StoredTrack[]) => {
    console.log(`➕ Adding ${newTracks.length} new tracks to storage...`);
    console.log(`📊 Current storedTracks count: ${storedTracks.length}`);
    const updatedTracks = [...storedTracks, ...newTracks];
    console.log(`📊 Total tracks after adding: ${updatedTracks.length}`);
    await saveTracks(updatedTracks);
    console.log(`📊 storedTracks state after save: ${storedTracks.length}`);
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

  // Convert StoredTrack back to Track with file URL
  const convertToTrack = useCallback(async (storedTrack: StoredTrack): Promise<Track> => {
    let audioUrl = '';
    
    try {
      if (storedTrack.fileHandle) {
        // Use File System Access API
        const file = await storedTrack.fileHandle.getFile();
        audioUrl = URL.createObjectURL(file);
        console.log(`🔗 Created URL from file handle: ${storedTrack.fileName}`);
      } else if (storedTrack.filePath) {
        // Fallback to file path (may not work in all browsers)
        audioUrl = storedTrack.filePath;
        console.log(`🔗 Using file path: ${storedTrack.filePath}`);
      } else {
        console.warn(`⚠️ No file reference found for track: ${storedTrack.fileName}`);
        audioUrl = ''; // Will show error in player
      }
    } catch (error) {
      console.error(`❌ Error accessing file for track ${storedTrack.fileName}:`, error);
      audioUrl = ''; // Will show error in player
    }

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
  const getTracks = useCallback(async (): Promise<Track[]> => {
    console.log(`🔄 getTracks called with ${storedTracks.length} storedTracks`);
    const trackPromises = storedTracks.map(convertToTrack);
    return Promise.all(trackPromises);
  }, [storedTracks, convertToTrack]);

  // Get tracks filtered by folder
  const getTracksByFolder = useCallback(async (folderName?: string): Promise<Track[]> => {
    console.log(`🔍 Getting tracks for folder: ${folderName || 'All Tracks'}`);
    console.log(`🔍 storedTracks state length: ${storedTracks.length}`);
    console.log(`🔍 Available tracks:`, storedTracks.map(t => ({ id: t.id, title: t.title, folder: t.folder })));
    
    if (!folderName || folderName === 'All Tracks') {
      // For "All Tracks", return all tracks regardless of folder
      const allTracks = await getTracks();
      console.log(`📁 Returning ${allTracks.length} tracks for All Tracks`);
      return allTracks;
    }
    
    const filteredTracks = storedTracks.filter(track => track.folder === folderName);
    console.log(`🔍 Filtered tracks for "${folderName}":`, filteredTracks.map(t => ({ id: t.id, title: t.title, folder: t.folder })));
    
    const trackPromises = filteredTracks.map(convertToTrack);
    const convertedTracks = await Promise.all(trackPromises);
    console.log(`📂 Found ${convertedTracks.length} tracks in folder "${folderName}"`);
    return convertedTracks;
  }, [storedTracks, convertToTrack, getTracks]);

  // Folder management functions
  const saveFolders = useCallback(async (foldersData: Folder[]) => {
    try {
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(foldersData));
      setFolders(foldersData);
    } catch (error) {
      console.error('Error saving folders to localStorage:', error);
      
      // Handle quota exceeded error for folders
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Clear folders and recreate default
        localStorage.removeItem(FOLDERS_STORAGE_KEY);
        const defaultFolder: Folder = {
          id: 'default',
          name: 'All Tracks',
          createdAt: Date.now()
        };
        setFolders([defaultFolder]);
        throw new Error('Storage quota exceeded. Folders have been reset to default.');
      }
      
      throw error;
    }
  }, []);

  const createFolder = useCallback(async (name: string) => {
    console.log(`📂 Creating new folder: "${name}"`);
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      createdAt: Date.now()
    };
    const updatedFolders = [...folders, newFolder];
    await saveFolders(updatedFolders);
    console.log(`✅ Folder "${name}" created successfully`);
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

  // Get storage usage information
  const getStorageInfo = useCallback(() => {
    try {
      const tracksData = localStorage.getItem(STORAGE_KEY);
      const foldersData = localStorage.getItem(FOLDERS_STORAGE_KEY);
      
      const tracksSize = tracksData ? new Blob([tracksData]).size : 0;
      const foldersSize = foldersData ? new Blob([foldersData]).size : 0;
      const totalSize = tracksSize + foldersSize;
      
      return {
        tracksCount: storedTracks.length,
        foldersCount: folders.length,
        totalSize,
        tracksSize,
        foldersSize,
        estimatedQuota: 5 * 1024 * 1024, // 5MB typical localStorage limit
        usagePercentage: (totalSize / (5 * 1024 * 1024)) * 100
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }, [storedTracks, folders]);

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
    getStorageInfo,
  };
};
