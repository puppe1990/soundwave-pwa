import { Track } from '@/hooks/useAudioPlayer';

interface TrackInfoProps {
  track: Track | null;
  isLoading?: boolean;
}

export const TrackInfo = ({ track, isLoading }: TrackInfoProps) => {
  if (!track) {
    return (
      <div className="flex items-center gap-4 p-4">
        <div className="w-16 h-16 bg-muted rounded-lg animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-32 mb-2 animate-pulse" />
          <div className="h-3 bg-muted rounded w-24 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="relative">
        <img
          src={track.cover}
          alt={`${track.album} cover`}
          className="w-16 h-16 rounded-lg object-cover shadow-card"
        />
        {isLoading && (
          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate text-lg">
          {track.title}
        </h3>
        <p className="text-muted-foreground truncate">
          {track.artist}
        </p>
        <p className="text-muted-foreground text-sm truncate">
          {track.album}
        </p>
      </div>
    </div>
  );
};