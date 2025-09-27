import { Track } from '@/hooks/useAudioPlayer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Music } from 'lucide-react';

interface PlaylistProps {
  tracks: Track[];
  currentTrackIndex: number;
  onSelectTrack: (index: number) => void;
  isPlaying: boolean;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const Playlist = ({ tracks, currentTrackIndex, onSelectTrack, isPlaying }: PlaylistProps) => {
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
          {tracks.map((track, index) => {
            const isCurrentTrack = index === currentTrackIndex;
            return (
              <Button
                key={track.id}
                variant="ghost"
                onClick={() => onSelectTrack(index)}
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
          })}
        </div>
      </ScrollArea>
    </div>
  );
};