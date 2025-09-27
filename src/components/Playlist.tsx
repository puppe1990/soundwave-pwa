import { Track } from '@/hooks/useAudioPlayer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Music, ChevronDown, ChevronRight, Folder, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PlaylistProps {
  tracks: Track[];
  currentTrackIndex: number;
  onSelectTrack: (index: number) => void;
  isPlaying: boolean;
  showFolders?: boolean;
  onDeleteTrack?: (trackId: string) => void;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const Playlist = ({ tracks, currentTrackIndex, onSelectTrack, isPlaying, showFolders = true, onDeleteTrack }: PlaylistProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['All Tracks']));

  // Group tracks by folder
  const groupedTracks = useMemo(() => {
    if (!showFolders) {
      return { 'All Tracks': tracks };
    }

    const groups: Record<string, Track[]> = {};
    
    tracks.forEach((track, index) => {
      const folderName = track.folder || 'All Tracks';
      if (!groups[folderName]) {
        groups[folderName] = [];
      }
      groups[folderName].push({ ...track, originalIndex: index });
    });

    return groups;
  }, [tracks, showFolders]);

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  const renderTrack = (track: Track & { originalIndex?: number }, index: number) => {
    const actualIndex = track.originalIndex ?? index;
    const isCurrentTrack = actualIndex === currentTrackIndex;
    
    return (
      <div
        key={track.id}
        className={`group flex items-center gap-4 w-full p-4 rounded-lg transition-smooth hover:bg-secondary/50 ${
          isCurrentTrack 
            ? 'bg-primary/10 border border-primary/20 hover:bg-primary/15' 
            : ''
        }`}
      >
        <Button
          variant="ghost"
          onClick={() => onSelectTrack(actualIndex)}
          className="flex-1 justify-start p-0 h-auto"
        >
          <div className="flex items-center gap-4 w-full">
            <div className="relative flex-shrink-0">
              <img
                src={track.cover}
                alt={`${track.album} cover`}
                className="w-12 h-12 rounded-lg object-cover"
              />
              {isCurrentTrack && isPlaying && (
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                  <Play className="h-4 w-4 text-white" fill="currentColor" />
                </div>
              )}
            </div>

            <div className="flex-1 text-left min-w-0">
              <h4 className={`font-medium truncate ${
                isCurrentTrack ? 'text-primary' : 'text-foreground'
              }`}>
                {track.title}
              </h4>
              <p className={`text-sm truncate ${
                isCurrentTrack ? 'text-primary/70' : 'text-muted-foreground'
              }`}>
                {track.artist}
              </p>
            </div>

            <div className={`text-sm ${
              isCurrentTrack ? 'text-primary/70' : 'text-muted-foreground'
            }`}>
              {formatDuration(track.duration)}
            </div>
          </div>
        </Button>

        {onDeleteTrack && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Track</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{track.title}" by {track.artist}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteTrack(track.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-card rounded-xl p-6 shadow-card backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-primary rounded-lg">
          <Music className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Playlist</h2>
      </div>

      <ScrollArea className="h-80">
        <div className="space-y-2">
          {Object.entries(groupedTracks).map(([folderName, folderTracks]) => {
            const isExpanded = expandedFolders.has(folderName);
            
            return (
              <div key={folderName}>
                {showFolders && Object.keys(groupedTracks).length > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => toggleFolder(folderName)}
                    className="w-full justify-start p-2 mb-1 hover:bg-secondary/30"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    <Folder className="h-4 w-4 mr-2" />
                    <span className="font-medium text-foreground">{folderName}</span>
                    <span className="ml-auto text-sm text-muted-foreground">
                      ({folderTracks.length})
                    </span>
                  </Button>
                )}
                
                {isExpanded && (
                  <div className="ml-4 space-y-1">
                    {folderTracks.map((track, index) => renderTrack(track, index))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};