import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Music, FileAudio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAudioUpload } from '@/hooks/useAudioUpload';
import { Track } from '@/hooks/useAudioPlayer';
import { useLocalStorage, StoredTrack } from '@/hooks/useLocalStorage';
import { FolderSelector } from '@/components/FolderSelector';

interface AudioUploadProps {
  onTracksUploaded: (tracks: Track[]) => void;
}

export const AudioUpload = ({ onTracksUploaded }: AudioUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>();
  const { uploadAudio, isUploading, uploadProgress } = useAudioUpload();
  const { addTracks, convertToTrack, folders, createFolder, getStorageInfo } = useLocalStorage();
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log(`📤 AudioUpload: Starting upload of ${files.length} files to folder: ${selectedFolder || 'All Tracks'}`);

    try {
      toast({
        title: "Uploading audio files",
        description: `Processing ${files.length} file${files.length > 1 ? 's' : ''}...`,
      });

      const storedTracks = await uploadAudio(files);
      console.log(`📤 AudioUpload: Processed ${storedTracks.length} tracks from ${files.length} files`);
      
      if (storedTracks.length > 0) {
        // Add folder information to tracks
        const tracksWithFolder = storedTracks.map(track => ({
          ...track,
          folder: selectedFolder || undefined // Explicitly set undefined if no folder selected
        }));
        console.log(`📤 AudioUpload: Assigning folder "${selectedFolder || 'undefined'}" to tracks`);
        console.log(`📤 AudioUpload: Adding tracks to folder: ${selectedFolder || 'All Tracks'}`);
        
        // Save to localStorage
        await addTracks(tracksWithFolder);
        
        // Convert to Track objects for the player
        const tracks = tracksWithFolder.map(convertToTrack);
        onTracksUploaded(tracks);
        
        console.log(`📤 AudioUpload: Successfully uploaded ${storedTracks.length} tracks`);
        toast({
          title: "Upload successful",
          description: `Added ${storedTracks.length} track${storedTracks.length > 1 ? 's' : ''} to your playlist and saved locally`,
        });
      } else {
        console.log('📤 AudioUpload: No valid audio files found');
        toast({
          title: "No valid audio files",
          description: "Please select valid audio files (MP3, WAV, OGG, M4A, AAC, FLAC)",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ AudioUpload: Upload error:', error);
      
      // Check if it's a storage quota error
      const storageInfo = getStorageInfo();
      const isQuotaError = error instanceof Error && error.message.includes('quota');
      
      toast({
        title: "Upload failed",
        description: isQuotaError 
          ? error.message || "Storage quota exceeded. Please try uploading fewer files or clear some existing tracks."
          : "There was an error uploading your audio files",
        variant: "destructive",
      });
      
      // Show storage info if quota error
      if (isQuotaError && storageInfo) {
        console.log(`📊 Storage usage: ${Math.round(storageInfo.usagePercentage)}% (${Math.round(storageInfo.totalSize / 1024)}KB)`);
        toast({
          title: "Storage Usage",
          description: `Using ${Math.round(storageInfo.usagePercentage)}% of available storage (${Math.round(storageInfo.totalSize / 1024)}KB)`,
          variant: "default",
        });
      }
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

      <FolderSelector
        folders={folders}
        selectedFolder={selectedFolder}
        onFolderChange={setSelectedFolder}
        onCreateFolder={createFolder}
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
          No file size limit - limited by browser storage
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