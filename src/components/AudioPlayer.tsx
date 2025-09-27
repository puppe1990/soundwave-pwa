import { useAudioPlayer, Track } from '@/hooks/useAudioPlayer';
import { TrackInfo } from '@/components/TrackInfo';
import { PlaybackControls } from '@/components/PlaybackControls';
import { Playlist } from '@/components/Playlist';
import { AudioUpload } from '@/components/AudioUpload';
import { FolderManager } from '@/components/FolderManager';
import { GradientPicker } from '@/components/GradientPicker';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { List, Upload, Trash2, FolderOpen, Palette } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


export const AudioPlayer = () => {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [showGradientPicker, setShowGradientPicker] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>();
  const [tracks, setTracks] = useState<Track[]>([]);
  const { 
    getTracks, 
    getTracksByFolder,
    clearAllTracks, 
    removeTrack,
    storedTracks,
    folders,
    isLoading: isStorageLoading,
    isInitialized,
    createFolder,
    renameFolder,
    deleteFolder,
    moveTrackToFolder
  } = useLocalStorage();
  const { toast } = useToast();

  // Load tracks based on folder selection
  useEffect(() => {
    // Don't load tracks if still initializing
    if (isStorageLoading || !isInitialized) {
      console.log(`⏳ AudioPlayer: Waiting for IndexedDB initialization...`);
      return;
    }

    const loadTracks = async () => {
      try {
        console.log(`🎵 AudioPlayer: Loading tracks for folder: ${selectedFolder || 'All Tracks'}`);
        const tracksToLoad = await getTracksByFolder(selectedFolder);
        setTracks(tracksToLoad);
        console.log(`🎵 AudioPlayer: Loaded ${tracksToLoad.length} tracks`);
      } catch (error) {
        console.error('❌ AudioPlayer: Error loading tracks:', error);
      }
    };

    loadTracks();
  }, [selectedFolder, getTracksByFolder, storedTracks, isStorageLoading, isInitialized]);

  // Handle clearing all stored tracks
  const handleClearStoredTracks = async () => {
    try {
      await clearAllTracks();
      // Reset tracks to empty array
      setTracks([]);
      toast({
        title: "Stored tracks cleared",
        description: "All uploaded tracks have been removed from local storage",
      });
    } catch (error) {
      console.error('Error clearing stored tracks:', error);
      toast({
        title: "Error",
        description: "Failed to clear stored tracks",
        variant: "destructive",
      });
    }
  };

  // Handle deleting a single track
  const handleDeleteTrack = async (trackId: string) => {
    try {
      await removeTrack(trackId);
      // Reload tracks to update the list
      const updatedTracks = await getTracksByFolder(selectedFolder);
      setTracks(updatedTracks);
      toast({
        title: "Track deleted",
        description: "The track has been removed from your playlist.",
      });
    } catch (error) {
      console.error('Error deleting track:', error);
      toast({
        title: "Error",
        description: "Failed to delete track. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const {
    currentTrack,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    repeatMode,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    selectTrack,
    toggleRepeat,
  } = useAudioPlayer(tracks);

  const handleTracksUploaded = async (newTracks: Track[]) => {
    console.log(`🎵 AudioPlayer: ${newTracks.length} tracks uploaded, reloading for folder: ${selectedFolder || 'All Tracks'}`);
    
    // Force refresh from IndexedDB to bypass stale state
    const tracksToLoad = await getTracksByFolder(selectedFolder, true);
    setTracks(tracksToLoad);
    console.log(`🎵 AudioPlayer: Reloaded ${tracksToLoad.length} tracks after upload`);
    
    setShowUpload(false);
    // Open playlist modal to show the newly uploaded tracks
    setShowPlaylist(true);
  };

  const handleFolderSelect = (folderName?: string) => {
    console.log(`🎵 AudioPlayer: Folder selected: ${folderName || 'All Tracks'}`);
    setSelectedFolder(folderName);
    // Always open playlist modal when a folder is selected
    setShowPlaylist(true);
  };

  return (
    <div className="min-h-screen bg-gradient-player">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Music Player</h1>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUpload(true)}
                className="rounded-full hover:bg-secondary/50 text-foreground hover:text-primary transition-smooth"
                title="Upload audio files"
              >
                <Upload className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFolders(true)}
                className="rounded-full hover:bg-secondary/50 text-foreground hover:text-primary transition-smooth"
                title="Manage folders"
              >
                <FolderOpen className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPlaylist(true)}
                className="rounded-full hover:bg-secondary/50 text-foreground hover:text-primary transition-smooth"
                title="View playlist"
              >
                <List className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGradientPicker(true)}
                className="rounded-full hover:bg-secondary/50 text-foreground hover:text-primary transition-smooth"
                title="Customize gradient"
              >
                <Palette className="h-6 w-6" />
              </Button>
              {storedTracks.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearStoredTracks}
                  className="rounded-full hover:bg-secondary/50 text-foreground hover:text-destructive transition-smooth"
                  title="Clear stored tracks"
                >
                  <Trash2 className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>

          {/* Main Player Card */}
          <div className="bg-gradient-card rounded-2xl shadow-player backdrop-blur-sm overflow-hidden">
            {/* Track Cover - Large */}
            <div className="relative p-8 pb-0">
              <div className="aspect-square max-w-80 mx-auto relative">
                <img
                  src={currentTrack?.cover || '/placeholder.svg'}
                  alt={currentTrack ? `${currentTrack.album} cover` : 'Album cover'}
                  className="w-full h-full object-cover rounded-xl shadow-card"
                />
                {isLoading && (
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className="px-8 py-4 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {currentTrack?.title || 'Select a Track'}
              </h2>
              <p className="text-lg text-muted-foreground mb-1">
                {currentTrack?.artist || 'Unknown Artist'}
              </p>
              <p className="text-muted-foreground">
                {currentTrack?.album || 'Unknown Album'}
              </p>
            </div>

            {/* Playback Controls */}
            <PlaybackControls
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onPrevious={previous}
              onNext={next}
              volume={volume}
              onVolumeChange={setVolume}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
              repeatMode={repeatMode}
              onToggleRepeat={toggleRepeat}
            />
          </div>

          {/* Upload Modal */}
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Audio Files</DialogTitle>
              </DialogHeader>
              <AudioUpload onTracksUploaded={handleTracksUploaded} />
            </DialogContent>
          </Dialog>

          {/* Folder Manager Modal */}
          <Dialog open={showFolders} onOpenChange={setShowFolders}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Manage Folders</DialogTitle>
              </DialogHeader>
              <FolderManager
                folders={folders}
                selectedFolder={selectedFolder}
                onFolderSelect={(folderName) => {
                  handleFolderSelect(folderName);
                  setShowFolders(false);
                }}
                onCreateFolder={createFolder}
                onRenameFolder={renameFolder}
                onDeleteFolder={deleteFolder}
              />
            </DialogContent>
          </Dialog>

          {/* Playlist Modal */}
          <Dialog open={showPlaylist} onOpenChange={setShowPlaylist}>
            <DialogContent className="max-w-md max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Playlist</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                <Playlist
                  tracks={tracks}
                  currentTrackIndex={currentTrackIndex}
                  onSelectTrack={selectTrack}
                  isPlaying={isPlaying}
                  showFolders={selectedFolder === undefined}
                  onDeleteTrack={handleDeleteTrack}
                  onClearAll={handleClearStoredTracks}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Gradient Picker Modal */}
          <Dialog open={showGradientPicker} onOpenChange={setShowGradientPicker}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Customize Player Theme</DialogTitle>
              </DialogHeader>
              <GradientPicker onClose={() => setShowGradientPicker(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};