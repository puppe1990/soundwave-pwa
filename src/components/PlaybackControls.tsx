import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Repeat1 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  repeatMode: 'none' | 'one' | 'all';
  onToggleRepeat: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const PlaybackControls = ({
  isPlaying,
  onTogglePlay,
  onPrevious,
  onNext,
  volume,
  onVolumeChange,
  currentTime,
  duration,
  onSeek,
  repeatMode,
  onToggleRepeat,
}: PlaybackControlsProps) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressChange = (values: number[]) => {
    const newTime = (values[0] / 100) * duration;
    onSeek(newTime);
  };

  const handleVolumeChange = (values: number[]) => {
    onVolumeChange(values[0] / 100);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Slider
            value={[progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={0.1}
            className="w-full [&_.slider-thumb]:bg-primary [&_.slider-thumb]:border-primary-glow [&_.slider-track]:bg-audio-progress [&_.slider-range]:bg-primary"
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          className="h-12 w-12 rounded-full hover:bg-secondary/50 text-foreground hover:text-primary transition-smooth"
        >
          <SkipBack className="h-6 w-6" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={onTogglePlay}
          className="h-16 w-16 rounded-full bg-gradient-primary hover:shadow-glow transition-smooth hover:scale-105"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="h-12 w-12 rounded-full hover:bg-secondary/50 text-foreground hover:text-primary transition-smooth"
        >
          <SkipForward className="h-6 w-6" />
        </Button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRepeat}
          className={`h-10 w-10 rounded-full transition-all duration-300 hover:scale-105 ${
            repeatMode === 'none' 
              ? 'text-muted-foreground hover:text-foreground hover:bg-secondary/50' 
              : repeatMode === 'one'
              ? 'text-primary bg-primary/10 hover:bg-primary/20 shadow-lg shadow-primary/20'
              : 'text-primary bg-primary/10 hover:bg-primary/20 shadow-lg shadow-primary/20'
          }`}
          title={`Repeat: ${repeatMode === 'none' ? 'Off' : repeatMode === 'one' ? 'One' : 'All'}`}
        >
          <div className="relative">
            {repeatMode === 'one' ? (
              <Repeat1 className={`h-5 w-5 transition-all duration-300 ${repeatMode === 'one' ? 'animate-pulse' : ''}`} />
            ) : (
              <Repeat className={`h-5 w-5 transition-all duration-300 ${repeatMode === 'all' ? 'animate-spin-slow' : ''}`} />
            )}
            {repeatMode !== 'none' && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-ping" />
            )}
          </div>
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
          className="h-8 w-8 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-smooth"
        >
          {volume === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Slider
          value={[volume * 100]}
          onValueChange={handleVolumeChange}
          max={100}
          step={1}
          className="flex-1 [&_.slider-thumb]:bg-primary [&_.slider-thumb]:border-primary-glow [&_.slider-track]:bg-muted [&_.slider-range]:bg-primary"
        />
      </div>
    </div>
  );
};