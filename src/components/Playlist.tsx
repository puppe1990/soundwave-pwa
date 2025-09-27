import { Track } from '@/hooks/useAudioPlayer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Music, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { useState, useMemo } from 'react';

interface PlaylistProps {
  tracks: Track[];
  currentTrackIndex: number;
  onSelectTrack: (index: number) => void;
  isPlaying: boolean;
  showFolders?: boolean;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const Playlist = ({ tracks, currentTrackIndex, onSelectTrack, isPlaying, showFolders = true }: PlaylistProps) => {
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
      <Button
        key={track.id}
        variant="ghost"
        onClick={() => onSelectTrack(actualIndex)}
        className={`w-full p-4 h-auto justify-start rounded-lg transition-smooth hover:bg-secondary/50 ${
          isCurrentTrack 
            ? 'bg-primary/10 border border-primary/20 hover:bg-primary/15' 
            : ''
        }`}
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