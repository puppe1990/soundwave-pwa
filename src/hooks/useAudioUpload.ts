import { useState, useCallback } from 'react';
import { Track } from './useAudioPlayer';

export interface AudioFile extends File {
  duration?: number;
}

export const useAudioUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const extractAudioMetadata = (file: File): Promise<{
    duration: number;
    title: string;
    artist: string;
    album: string;
  }> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        
        // Try to extract metadata from filename
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        const parts = fileName.split(' - ');
        
        let title = fileName;
        let artist = 'Unknown Artist';
        let album = 'Uploaded Music';
        
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts[1].trim();
        }
        
        URL.revokeObjectURL(url);
        resolve({ duration, title, artist, album });
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        resolve({ 
          duration: 0, 
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: 'Unknown Artist',
          album: 'Uploaded Music'
        });
      });
      
      audio.src = url;
    });
  };

  const generateCoverArt = (title: string, artist: string): string => {
    // Create a simple canvas-based cover art
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 300;
    
    if (ctx) {
      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, 300, 300);
      const hue = Math.floor(Math.random() * 360);
      gradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
      gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 70%, 30%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 300, 300);
      
      // Add text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      
      // Title
      const maxWidth = 280;
      const titleLines = wrapText(ctx, title, maxWidth);
      titleLines.forEach((line, index) => {
        ctx.fillText(line, 150, 120 + (index * 30));
      });
      
      // Artist
      ctx.font = '18px Arial';
      const artistLines = wrapText(ctx, artist, maxWidth);
      artistLines.forEach((line, index) => {
        ctx.fillText(line, 150, 200 + (index * 25));
      });
    }
    
    return canvas.toDataURL('image/png');
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines.slice(0, 3); // Max 3 lines
  };

  const uploadAudio = useCallback(async (files: FileList): Promise<Track[]> => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const tracks: Track[] = [];
    const totalFiles = files.length;
    
    // Validate audio files
    const validAudioTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 
      'audio/m4a', 'audio/aac', 'audio/flac', 'audio/webm'
    ];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if it's an audio file
      if (!validAudioTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i)) {
        console.warn(`Skipping non-audio file: ${file.name}`);
        continue;
      }
      
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        console.warn(`File too large: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`);
        continue;
      }
      
      try {
        const metadata = await extractAudioMetadata(file);
        const cover = generateCoverArt(metadata.title, metadata.artist);
        const audioUrl = URL.createObjectURL(file);
        
        const track: Track = {
          id: `uploaded-${Date.now()}-${i}`,
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album,
          duration: metadata.duration,
          src: audioUrl,
          cover: cover,
        };
        
        tracks.push(track);
        setUploadProgress(((i + 1) / totalFiles) * 100);
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    setIsUploading(false);
    setUploadProgress(0);
    
    return tracks;
  }, []);

  return {
    uploadAudio,
    isUploading,
    uploadProgress,
  };
};