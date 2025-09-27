import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FolderPlus, Folder as FolderIcon, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Folder } from '@/hooks/useLocalStorage';

interface FolderManagerProps {
  folders: Array<{ id: string; name: string; createdAt: number }>;
  selectedFolder?: string;
  onFolderSelect: (folderName?: string) => void;
  onCreateFolder: (name: string) => Promise<Folder>;
  onRenameFolder: (folderId: string, newName: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
}

export const FolderManager = ({
  folders,
  selectedFolder,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);
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

  const handleRenameFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;

    try {
      await onRenameFolder(editingFolder.id, newFolderName.trim());
      setNewFolderName('');
      setIsRenameDialogOpen(false);
      setEditingFolder(null);
      toast({
        title: "Folder renamed",
        description: `Folder renamed to "${newFolderName.trim()}"`,
      });
    } catch (error) {
      toast({
        title: "Error renaming folder",
        description: "Failed to rename folder",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    try {
      await onDeleteFolder(folderId);
      toast({
        title: "Folder deleted",
        description: `Folder "${folderName}" has been deleted`,
      });
    } catch (error) {
      toast({
        title: "Error deleting folder",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    }
  };

  const openRenameDialog = (folder: { id: string; name: string }) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setIsRenameDialogOpen(true);
  };

  return (
    <div className="bg-gradient-card rounded-xl p-4 shadow-card backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Folders</h3>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <FolderPlus className="h-4 w-4 mr-1" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Enter a name for your new folder to organize your tracks.
              </DialogDescription>
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

      <div className="space-y-1">
        {/* All Tracks option */}
        <Button
          variant={selectedFolder === undefined ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onFolderSelect(undefined)}
        >
          <FolderIcon className="h-4 w-4 mr-2" />
          All Tracks
        </Button>

        {/* Folder list */}
        {folders.map((folder) => (
          <div key={folder.id} className="flex items-center group">
            <Button
              variant={selectedFolder === folder.name ? "secondary" : "ghost"}
              className="flex-1 justify-start"
              onClick={() => onFolderSelect(folder.name)}
            >
              <FolderIcon className="h-4 w-4 mr-2" />
              {folder.name}
            </Button>
            
            {folder.id !== 'default' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openRenameDialog(folder)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteFolder(folder.id, folder.name)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for this folder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter new folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameFolder}>
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
