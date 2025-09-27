import { useAudioPlayer, Track } from '@/hooks/useAudioPlayer';
import { TrackInfo } from '@/components/TrackInfo';
import { PlaybackControls } from '@/components/PlaybackControls';
import { Playlist } from '@/components/Playlist';
import { AudioUpload } from '@/components/AudioUpload';
import { FolderManager } from '@/components/FolderManager';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { List, Upload, Trash2, FolderOpen } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';


export const AudioPlayer = () => {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>();
  const [tracks, setTracks] = useState<Track[]>([]);
  const { 
    getTracks, 
    getTracksByFolder,
    clearAllTracks, 
    storedTracks,
    folders,
    createFolder,
    renameFolder,
    deleteFolder,
    moveTrackToFolder
  } = useLocalStorage();
  const { toast } = useToast();

  // Load stored tracks on component mount
  useEffect(() => {
    const loadStoredTracks = () => {
      try {
        const allTracks = getTracks();
        setTracks(allTracks);
      } catch (error) {
        console.error('Error loading stored tracks:', error);
      }
    };

    loadStoredTracks();
  }, [getTracks]);

  // Update tracks when folder selection changes
  useEffect(() => {
    const loadFolderTracks = () => {
      try {
        const folderTracks = getTracksByFolder(selectedFolder);
        setTracks(folderTracks);
      } catch (error) {
        console.error('Error loading folder tracks:', error);
      }
    };

    loadFolderTracks();
  }, [selectedFolder, getTracksByFolder]);

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

  const handleTracksUploaded = (newTracks: Track[]) => {
    // Reload tracks to include the new ones
    const allTracks = getTracks();
    setTracks(allTracks);
    setShowUpload(false);
    if (!showPlaylist) {
      setShowPlaylist(true);
    }
  };

  const handleFolderSelect = (folderName?: string) => {
    setSelectedFolder(folderName);
    if (folderName) {
      setShowPlaylist(true);
    }
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
                onClick={() => setShowUpload(!showUpload)}
                className="rounded-full hover:bg-secondary/50 text-foreground hover:text-primary transition-smooth"
              >
                <Upload className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFolders(!showFolders)}
                className="rounded-full hover:bg-secondary/50 text-foreground hover:text-primary transition-smooth"
              >
                <FolderOpen className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="rounded-full hover:bg-secondary/50 text-foreground hover:text-primary transition-smooth"
              >
                <List className="h-6 w-6" />
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
          {showUpload && (
            <div className="bg-gradient-card rounded-2xl shadow-player backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Upload Audio Files</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUpload(false)}
                  className="rounded-full hover:bg-secondary/50"
                >
                  ✕
                </Button>
              </div>
              <AudioUpload onTracksUploaded={handleTracksUploaded} />
            </div>
          )}

          {/* Folder Manager */}
          {showFolders && (
            <FolderManager
              folders={folders}
              selectedFolder={selectedFolder}
              onFolderSelect={handleFolderSelect}
              onCreateFolder={createFolder}
              onRenameFolder={renameFolder}
              onDeleteFolder={deleteFolder}
            />
          )}

          {/* Playlist */}
          {showPlaylist && (
            <Playlist
              tracks={tracks}
              currentTrackIndex={currentTrackIndex}
              onSelectTrack={selectTrack}
              isPlaying={isPlaying}
              showFolders={selectedFolder === undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};