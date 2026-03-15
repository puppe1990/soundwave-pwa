import { useState, useEffect, useCallback } from 'react';
import { Track } from './useAudioPlayer';
import { indexedDBService } from '@/lib/indexedDB';

const STORAGE_KEY = 'soundwave-uploaded-tracks';
const FOLDERS_STORAGE_KEY = 'soundwave-folders';

export interface StoredTrack extends Omit<Track, 'src'> {
  filePath?: string; // File path (for File System Access API)
  fileHandle?: FileSystemFileHandle; // File handle (for File System Access API)
  originalFilePath?: string; // Original file path from user's system
  fileData?: string; // Base64 encoded file data for persistence (legacy)
  audioFileId?: string; // ID for audio file stored in IndexedDB
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
  const [isLoading, setIsLoading] = useState(true);

  // Migrate legacy tracks from localStorage to IndexedDB
  const migrateLegacyTracks = useCallback(async () => {
    try {
      const legacyTracks = localStorage.getItem(STORAGE_KEY);
      if (legacyTracks) {
        const tracks: StoredTrack[] = JSON.parse(legacyTracks);
        console.log(`🔄 Migrating ${tracks.length} legacy tracks from localStorage...`);
        
        for (const track of tracks) {
          // Skip tracks that don't have base64 data
          if (track.fileData) {
            try {
              // Convert base64 to blob
              const response = await fetch(track.fileData);
              const blob = await response.blob();
              
              // Store in IndexedDB
              const audioFileId = `audio-${track.id}`;
              await indexedDBService.storeAudioFile(audioFileId, blob);
              
              // Update track with audioFileId
              track.audioFileId = audioFileId;
              delete track.fileData; // Remove legacy base64 data
            } catch (error) {
              console.warn(`⚠️ Failed to migrate track ${track.id}:`, error);
            }
          }
        }
        
        // Store migrated tracks in IndexedDB
        await indexedDBService.storeTracks(tracks);
        setStoredTracks(tracks);
        
        // Clear localStorage
        localStorage.removeItem(STORAGE_KEY);
        console.log(`✅ Migrated ${tracks.length} tracks to IndexedDB`);
      }
    } catch (error) {
      console.error('❌ Error migrating legacy tracks:', error);
    }
  }, []);

  // Load tracks and folders from IndexedDB on initialization
  useEffect(() => {
    if (isInitialized) return;
    
    const loadStoredData = async () => {
      try {
        console.log('🔄 Loading stored data from IndexedDB...');
        
        // Initialize IndexedDB
        await indexedDBService.init();
        
        // Load tracks from IndexedDB
        const tracks = await indexedDBService.getTracks();
        console.log(`📁 Found ${tracks.length} stored tracks in IndexedDB`);
        
        // Migrate tracks without createdAt field
        const migratedTracks = tracks.map(track => ({
          ...track,
          createdAt: track.createdAt || Date.now() - Math.random() * 1000000
        }));
        setStoredTracks(migratedTracks);
        
        // Load folders from IndexedDB
        let foldersData = await indexedDBService.getFolders();
        
        if (foldersData.length === 0) {
          // Try migrating from localStorage
          const legacyFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);
          if (legacyFolders) {
            foldersData = JSON.parse(legacyFolders);
            await indexedDBService.storeFolders(foldersData);
            console.log(`📂 Migrated ${foldersData.length} folders from localStorage`);
          } else {
            // Create default folder
            const defaultFolder: Folder = {
              id: 'default',
              name: 'All Tracks',
              createdAt: Date.now()
            };
            foldersData = [defaultFolder];
            await indexedDBService.storeFolders(foldersData);
            console.log('📂 Created default folder');
          }
        }
        
        setFolders(foldersData);
        console.log(`📂 Found ${foldersData.length} folders:`, foldersData.map(f => f.name));
        
        // Migrate legacy localStorage tracks if they exist
        if (tracks.length === 0) {
          await migrateLegacyTracks();
        }
        
        setIsInitialized(true);
        setIsLoading(false);
        console.log('✅ useLocalStorage initialized with IndexedDB');
      } catch (error) {
        console.error('❌ Error loading stored data:', error);
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, [isInitialized, migrateLegacyTracks]);

  // Save tracks to IndexedDB
  const saveTracks = useCallback(async (tracks: StoredTrack[]) => {
    try {
      console.log(`💾 Saving ${tracks.length} tracks to IndexedDB...`);
      
      await indexedDBService.storeTracks(tracks);
      
      // Reload tracks from IndexedDB to ensure state is in sync
      const savedTracks = await indexedDBService.getTracks();
      setStoredTracks(savedTracks);
      console.log('✅ Tracks saved successfully to IndexedDB');
      console.log(`📊 setStoredTracks called with ${savedTracks.length} tracks from IndexedDB`);
    } catch (error) {
      console.error('❌ Error saving tracks to IndexedDB:', error);
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
    const trackToRemove = storedTracks.find(track => track.id === trackId);
    if (trackToRemove?.audioFileId) {
      await indexedDBService.deleteAudioFile(trackToRemove.audioFileId);
    }
    
    const updatedTracks = storedTracks.filter(track => track.id !== trackId);
    await saveTracks(updatedTracks);
  }, [storedTracks, saveTracks]);

  // Clear all stored tracks
  const clearAllTracks = useCallback(async () => {
    await indexedDBService.clearAllTracks();
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
      } else if (storedTrack.audioFileId) {
        // Use IndexedDB stored blob
        const blob = await indexedDBService.getAudioFile(storedTrack.audioFileId);
        if (blob) {
          audioUrl = URL.createObjectURL(blob);
          console.log(`🔗 Created URL from IndexedDB blob: ${storedTrack.fileName}`);
        } else {
          console.warn(`⚠️ Audio file not found in IndexedDB: ${storedTrack.audioFileId}`);
          audioUrl = '';
        }
      } else if (storedTrack.fileData) {
        // Legacy: Use stored base64 data
        audioUrl = storedTrack.fileData;
        console.log(`🔗 Using legacy base64 data for: ${storedTrack.fileName}`);
      } else if (storedTrack.filePath) {
        // Fallback to file path (may not work in all browsers)
        audioUrl = storedTrack.filePath;
        console.log(`🔗 Using file path: ${storedTrack.filePath}`);
      } else {
        console.warn(`⚠️ No file reference found for track: ${storedTrack.fileName}`);
        audioUrl = ''; // Will show error in player
      }
      
      // Log the original file path for debugging
      if (storedTrack.originalFilePath) {
        console.log(`📁 Original file path stored: ${storedTrack.originalFilePath}`);
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
  const getTracksByFolder = useCallback(async (folderName?: string, forceRefresh: boolean = false): Promise<Track[]> => {
    // Don't return tracks if still loading
    if (isLoading || !isInitialized) {
      console.log(`⏳ Still loading IndexedDB, returning empty tracks for: ${folderName || 'All Tracks'}`);
      return [];
    }
    
    console.log(`🔍 Getting tracks for folder: ${folderName || 'All Tracks'}`);
    
    // If force refresh, get fresh tracks from IndexedDB
    let tracksToUse = storedTracks;
    if (forceRefresh) {
      console.log(`🔄 Force refreshing tracks from IndexedDB...`);
      tracksToUse = await indexedDBService.getTracks();
      console.log(`🔄 Fresh tracks loaded: ${tracksToUse.length}`);
    }
    
    console.log(`🔍 storedTracks state length: ${storedTracks.length}`);
    console.log(`🔍 tracksToUse length: ${tracksToUse.length}`);
    console.log(`🔍 Available tracks:`, tracksToUse.map(t => ({ id: t.id, title: t.title, folder: t.folder })));
    
    if (!folderName || folderName === 'All Tracks') {
      // For "All Tracks", return all tracks regardless of folder
      const trackPromises = tracksToUse.map(convertToTrack);
      const allTracks = await Promise.all(trackPromises);
      console.log(`📁 Returning ${allTracks.length} tracks for All Tracks`);
      return allTracks;
    }
    
    const filteredTracks = tracksToUse.filter(track => track.folder === folderName);
    console.log(`🔍 Filtered tracks for "${folderName}":`, filteredTracks.map(t => ({ id: t.id, title: t.title, folder: t.folder })));
    
    const trackPromises = filteredTracks.map(convertToTrack);
    const convertedTracks = await Promise.all(trackPromises);
    console.log(`📂 Found ${convertedTracks.length} tracks in folder "${folderName}"`);
    return convertedTracks;
  }, [storedTracks, convertToTrack, isLoading, isInitialized]);

  // Folder management functions
  const saveFolders = useCallback(async (foldersData: Folder[]) => {
    try {
      await indexedDBService.storeFolders(foldersData);
      setFolders(foldersData);
    } catch (error) {
      console.error('Error saving folders to IndexedDB:', error);
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
  const getStorageInfo = useCallback(async () => {
    try {
      const storageInfo = await indexedDBService.getStorageInfo();
      
      return {
        tracksCount: storageInfo.tracksCount,
        foldersCount: storageInfo.foldersCount,
        audioFilesCount: storageInfo.audioFilesCount,
        totalSize: storageInfo.estimatedSize,
        tracksSize: 0, // Not relevant for IndexedDB
        foldersSize: 0, // Not relevant for IndexedDB
        estimatedQuota: Number.MAX_SAFE_INTEGER, // IndexedDB has much larger quota
        usagePercentage: 0 // Not easily calculable for IndexedDB
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        tracksCount: storedTracks.length,
        foldersCount: folders.length,
        audioFilesCount: 0,
        totalSize: 0,
        tracksSize: 0,
        foldersSize: 0,
        estimatedQuota: Number.MAX_SAFE_INTEGER,
        usagePercentage: 0
      };
    }
  }, [storedTracks, folders]);

  return {
    storedTracks,
    folders,
    isLoading,
    isInitialized,
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
