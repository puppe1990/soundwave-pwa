// IndexedDB service for storing audio files and metadata
import { StoredTrack, Folder } from '@/hooks/useLocalStorage';

const DB_NAME = 'SoundwaveDB';
const DB_VERSION = 1;
const TRACKS_STORE = 'tracks';
const FOLDERS_STORE = 'folders';
const AUDIO_FILES_STORE = 'audioFiles';

interface AudioFileData {
  id: string;
  blob: Blob;
  createdAt: number;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to open database', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB: Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create tracks store
        if (!db.objectStoreNames.contains(TRACKS_STORE)) {
          const tracksStore = db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
          tracksStore.createIndex('folder', 'folder', { unique: false });
          tracksStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('🗄️ IndexedDB: Created tracks store');
        }

        // Create folders store
        if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
          db.createObjectStore(FOLDERS_STORE, { keyPath: 'id' });
          console.log('🗄️ IndexedDB: Created folders store');
        }

        // Create audio files store
        if (!db.objectStoreNames.contains(AUDIO_FILES_STORE)) {
          const audioStore = db.createObjectStore(AUDIO_FILES_STORE, { keyPath: 'id' });
          audioStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('🗄️ IndexedDB: Created audio files store');
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Audio Files Operations
  async storeAudioFile(id: string, blob: Blob): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_FILES_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_FILES_STORE);
      
      const audioData: AudioFileData = {
        id,
        blob,
        createdAt: Date.now()
      };
      
      const request = store.put(audioData);
      
      request.onsuccess = () => {
        console.log(`🔗 IndexedDB: Stored audio file: ${id}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error(`❌ IndexedDB: Failed to store audio file: ${id}`, request.error);
        reject(request.error);
      };
    });
  }

  async getAudioFile(id: string): Promise<Blob | null> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_FILES_STORE], 'readonly');
      const store = transaction.objectStore(AUDIO_FILES_STORE);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const result = request.result as AudioFileData | undefined;
        if (result) {
          console.log(`🔗 IndexedDB: Retrieved audio file: ${id}`);
          resolve(result.blob);
        } else {
          console.warn(`⚠️ IndexedDB: Audio file not found: ${id}`);
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error(`❌ IndexedDB: Failed to get audio file: ${id}`, request.error);
        reject(request.error);
      };
    });
  }

  async deleteAudioFile(id: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_FILES_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_FILES_STORE);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log(`🗑️ IndexedDB: Deleted audio file: ${id}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error(`❌ IndexedDB: Failed to delete audio file: ${id}`, request.error);
        reject(request.error);
      };
    });
  }

  // Tracks Operations
  async storeTracks(tracks: StoredTrack[]): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TRACKS_STORE], 'readwrite');
      const store = transaction.objectStore(TRACKS_STORE);
      
      // Clear existing tracks
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Add all tracks
        let completed = 0;
        const total = tracks.length;
        
        if (total === 0) {
          console.log('💾 IndexedDB: Stored 0 tracks');
          resolve();
          return;
        }
        
        tracks.forEach(track => {
          const addRequest = store.add(track);
          
          addRequest.onsuccess = () => {
            completed++;
            if (completed === total) {
              console.log(`💾 IndexedDB: Stored ${total} tracks`);
              resolve();
            }
          };
          
          addRequest.onerror = () => {
            console.error(`❌ IndexedDB: Failed to store track: ${track.id}`, addRequest.error);
            reject(addRequest.error);
          };
        });
      };
      
      clearRequest.onerror = () => {
        console.error('❌ IndexedDB: Failed to clear tracks', clearRequest.error);
        reject(clearRequest.error);
      };
    });
  }

  async getTracks(): Promise<StoredTrack[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TRACKS_STORE], 'readonly');
      const store = transaction.objectStore(TRACKS_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const tracks = request.result as StoredTrack[];
        console.log(`📁 IndexedDB: Retrieved ${tracks.length} tracks`);
        resolve(tracks);
      };
      
      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to get tracks', request.error);
        reject(request.error);
      };
    });
  }

  async deleteTrack(trackId: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TRACKS_STORE], 'readwrite');
      const store = transaction.objectStore(TRACKS_STORE);
      const request = store.delete(trackId);
      
      request.onsuccess = () => {
        console.log(`🗑️ IndexedDB: Deleted track: ${trackId}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error(`❌ IndexedDB: Failed to delete track: ${trackId}`, request.error);
        reject(request.error);
      };
    });
  }

  async clearAllTracks(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TRACKS_STORE, AUDIO_FILES_STORE], 'readwrite');
      const tracksStore = transaction.objectStore(TRACKS_STORE);
      const audioStore = transaction.objectStore(AUDIO_FILES_STORE);
      
      const clearTracks = tracksStore.clear();
      const clearAudio = audioStore.clear();
      
      let completedOperations = 0;
      
      const checkCompletion = () => {
        completedOperations++;
        if (completedOperations === 2) {
          console.log('🧹 IndexedDB: Cleared all tracks and audio files');
          resolve();
        }
      };
      
      clearTracks.onsuccess = checkCompletion;
      clearAudio.onsuccess = checkCompletion;
      
      clearTracks.onerror = () => {
        console.error('❌ IndexedDB: Failed to clear tracks', clearTracks.error);
        reject(clearTracks.error);
      };
      
      clearAudio.onerror = () => {
        console.error('❌ IndexedDB: Failed to clear audio files', clearAudio.error);
        reject(clearAudio.error);
      };
    });
  }

  // Folders Operations
  async storeFolders(folders: Folder[]): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FOLDERS_STORE], 'readwrite');
      const store = transaction.objectStore(FOLDERS_STORE);
      
      // Clear existing folders
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Add all folders
        let completed = 0;
        const total = folders.length;
        
        if (total === 0) {
          console.log('📂 IndexedDB: Stored 0 folders');
          resolve();
          return;
        }
        
        folders.forEach(folder => {
          const addRequest = store.add(folder);
          
          addRequest.onsuccess = () => {
            completed++;
            if (completed === total) {
              console.log(`📂 IndexedDB: Stored ${total} folders`);
              resolve();
            }
          };
          
          addRequest.onerror = () => {
            console.error(`❌ IndexedDB: Failed to store folder: ${folder.id}`, addRequest.error);
            reject(addRequest.error);
          };
        });
      };
      
      clearRequest.onerror = () => {
        console.error('❌ IndexedDB: Failed to clear folders', clearRequest.error);
        reject(clearRequest.error);
      };
    });
  }

  async getFolders(): Promise<Folder[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FOLDERS_STORE], 'readonly');
      const store = transaction.objectStore(FOLDERS_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const folders = request.result as Folder[];
        console.log(`📂 IndexedDB: Retrieved ${folders.length} folders`);
        resolve(folders);
      };
      
      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to get folders', request.error);
        reject(request.error);
      };
    });
  }

  // Storage Info
  async getStorageInfo(): Promise<{
    tracksCount: number;
    foldersCount: number;
    audioFilesCount: number;
    estimatedSize: number;
  }> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TRACKS_STORE, FOLDERS_STORE, AUDIO_FILES_STORE], 'readonly');
      
      const tracksStore = transaction.objectStore(TRACKS_STORE);
      const foldersStore = transaction.objectStore(FOLDERS_STORE);
      const audioStore = transaction.objectStore(AUDIO_FILES_STORE);
      
      const tracksRequest = tracksStore.count();
      const foldersRequest = foldersStore.count();
      const audioRequest = audioStore.getAll();
      
      let completedOperations = 0;
      let tracksCount = 0;
      let foldersCount = 0;
      let audioFilesCount = 0;
      let estimatedSize = 0;
      
      const checkCompletion = () => {
        completedOperations++;
        if (completedOperations === 3) {
          resolve({
            tracksCount,
            foldersCount,
            audioFilesCount,
            estimatedSize
          });
        }
      };
      
      tracksRequest.onsuccess = () => {
        tracksCount = tracksRequest.result;
        checkCompletion();
      };
      
      foldersRequest.onsuccess = () => {
        foldersCount = foldersRequest.result;
        checkCompletion();
      };
      
      audioRequest.onsuccess = () => {
        const audioFiles = audioRequest.result as AudioFileData[];
        audioFilesCount = audioFiles.length;
        estimatedSize = audioFiles.reduce((total, file) => total + file.blob.size, 0);
        checkCompletion();
      };
      
      tracksRequest.onerror = () => reject(tracksRequest.error);
      foldersRequest.onerror = () => reject(foldersRequest.error);
      audioRequest.onerror = () => reject(audioRequest.error);
    });
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService();
