import { useAudioPlayer, Track } from '@/hooks/useAudioPlayer';
import { TrackInfo } from '@/components/TrackInfo';
import { PlaybackControls } from '@/components/PlaybackControls';
import { Playlist } from '@/components/Playlist';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';

// Sample tracks for demo
import albumCover1 from '@/assets/album-cover-1.jpg';
import albumCover2 from '@/assets/album-cover-2.jpg';
import albumCover3 from '@/assets/album-cover-3.jpg';

const sampleTracks: Track[] = [
  {
    id: '1',
    title: 'Neon Dreams',
    artist: 'Synthwave Artist',
    album: 'Future Nights',
    duration: 245, // 4:05
    src: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Demo audio
    cover: albumCover1,
  },
  {
    id: '2',
    title: 'Midnight Drive',
    artist: 'Retrowave Producer',
    album: 'City Lights',
    duration: 198, // 3:18
    src: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Demo audio
    cover: albumCover2,
  },
  {
    id: '3',
    title: 'Sunset Boulevard',
    artist: 'Chillwave Collective',
    album: 'Golden Hour',
    duration: 312, // 5:12
    src: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Demo audio
    cover: albumCover3,
  },
];

export const AudioPlayer = () => {
  const [showPlaylist, setShowPlaylist] = useState(false);
  
  const {
    currentTrack,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    selectTrack,
  } = useAudioPlayer(sampleTracks);

  return (
    <div className="min-h-screen bg-gradient-player">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Music Player</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="rounded-full hover:bg-secondary/50 text-foreground hover:text-primary transition-smooth"
            >
              <List className="h-6 w-6" />
            </Button>
          </div>

          {/* Main Player Card */}
          <div className="bg-gradient-card rounded-2xl shadow-player backdrop-blur-sm overflow-hidden">
            {/* Track Cover - Large */}
            <div className="relative p-8 pb-0">
              <div className="aspect-square max-w-80 mx-auto relative">
                <img
                  src={currentTrack?.cover || albumCover1}
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
            />
          </div>

          {/* Playlist */}
          {showPlaylist && (
            <Playlist
              tracks={sampleTracks}
              currentTrackIndex={currentTrackIndex}
              onSelectTrack={selectTrack}
              isPlaying={isPlaying}
            />
          )}
        </div>
      </div>
    </div>
  );
};