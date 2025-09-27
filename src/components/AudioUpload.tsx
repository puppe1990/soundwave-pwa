import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Music, FileAudio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAudioUpload } from '@/hooks/useAudioUpload';
import { Track } from '@/hooks/useAudioPlayer';
import { useLocalStorage, StoredTrack } from '@/hooks/useLocalStorage';

interface AudioUploadProps {
  onTracksUploaded: (tracks: Track[]) => void;
}

export const AudioUpload = ({ onTracksUploaded }: AudioUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAudio, isUploading, uploadProgress } = useAudioUpload();
  const { addTracks, convertToTrack } = useLocalStorage();
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      toast({
        title: "Uploading audio files",
        description: `Processing ${files.length} file${files.length > 1 ? 's' : ''}...`,
      });

      const storedTracks = await uploadAudio(files);
      
      if (storedTracks.length > 0) {
        // Save to localStorage
        await addTracks(storedTracks);
        
        // Convert to Track objects for the player
        const tracks = storedTracks.map(convertToTrack);
        onTracksUploaded(tracks);
        
        toast({
          title: "Upload successful",
          description: `Added ${storedTracks.length} track${storedTracks.length > 1 ? 's' : ''} to your playlist and saved locally`,
        });
      } else {
        toast({
          title: "No valid audio files",
          description: "Please select valid audio files (MP3, WAV, OGG, M4A, AAC, FLAC)",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your audio files",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <Button
        onClick={handleFileSelect}
        disabled={isUploading}
        className="w-full bg-gradient-primary hover:shadow-glow transition-smooth hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        size="lg"
      >
        {isUploading ? (
          <>
            <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Uploading... {Math.round(uploadProgress)}%
          </>
        ) : (
          <>
            <Upload className="mr-2 h-5 w-5" />
            Upload Audio Files
          </>
        )}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Supported formats: MP3, WAV, OGG, M4A, AAC, FLAC
        </p>
        <p className="text-xs text-muted-foreground">
          Max file size: 50MB per file
        </p>
      </div>

      {/* Upload Instructions */}
      <div className="bg-gradient-glass rounded-lg p-4 border border-border/50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <FileAudio className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground mb-1">Upload Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Name files like "Artist - Song Title" for better metadata</li>
              <li>• Multiple files can be selected at once</li>
              <li>• Files are stored locally in your browser</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};