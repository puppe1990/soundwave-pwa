import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder as FolderIcon, FolderPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Folder } from '@/hooks/useLocalStorage';

interface FolderSelectorProps {
  folders: Array<{ id: string; name: string; createdAt: number }>;
  selectedFolder?: string;
  onFolderChange: (folderName?: string) => void;
  onCreateFolder: (name: string) => Promise<Folder>;
}

export const FolderSelector = ({
  folders,
  selectedFolder,
  onFolderChange,
  onCreateFolder,
}: FolderSelectorProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { toast } = useToast();

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Invalid folder name",
        description: "Please enter a valid folder name",
        variant: "destructive",
      });
      return;
    }

    try {
      await onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreateDialogOpen(false);
      onFolderChange(newFolderName.trim());
      toast({
        title: "Folder created",
        description: `Folder "${newFolderName.trim()}" has been created`,
      });
    } catch (error) {
      toast({
        title: "Error creating folder",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Select Folder</label>
      <div className="flex gap-2">
        <Select value={selectedFolder || 'all'} onValueChange={(value) => onFolderChange(value === 'all' ? undefined : value)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4" />
                All Tracks
              </div>
            </SelectItem>
            {folders.map((folder) => (
              <SelectItem key={folder.id} value={folder.name}>
                <div className="flex items-center gap-2">
                  <FolderIcon className="h-4 w-4" />
                  {folder.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="px-3">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder}>
                  Create Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
