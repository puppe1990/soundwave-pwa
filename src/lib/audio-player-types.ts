/**
 * Shared audio player domain types.
 * Kept out of the hook so UI components can import types without the hook module.
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  src: string;
  cover: string;
  folder?: string;
}

export type RepeatMode = "none" | "one" | "all";

export interface AudioPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  repeatMode: RepeatMode;
}
