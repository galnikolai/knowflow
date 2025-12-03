import React, { useState, useMemo } from "react";
import { useTheme } from "@/shared/context/useTheme";
import { useNotesStore } from "@/shared/store/useNotesStore";
import { useWorkspacesStore } from "@/shared/store/useWorkspacesStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { File, Folder, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/shared/api/notes";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TreeNode extends Note {
  children: TreeNode[];
}

function buildTree(notes: Note[], parentId: string | null = null): TreeNode[] {
  return notes
    .filter((n) => n.parent_id === parentId)
    .map((n) => ({ ...n, children: buildTree(notes, n.id) }));
}

export const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { themeColors } = useTheme();
  const notes = useNotesStore((s) => s.notes);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const addWorkspace = useWorkspacesStore((s) => s.addWorkspace);
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  // Загружаем заметки при открытии диалога
  React.useEffect(() => {
    if (open) {
      fetchNotes();
    }
  }, [open, fetchNotes]);

  const tree = useMemo(() => buildTree(notes), [notes]);

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  const handleSelectAllInFolder = (node: TreeNode) => {
    const selectRecursive = (n: TreeNode) => {
      setSelectedNoteIds((prev) => {
        const next = new Set(prev);
        if (!next.has(n.id)) {
          next.add(n.id);
        }
        return next;
      });
      n.children.forEach(selectRecursive);
    };
    selectRecursive(node);
  };

  const handleDeselectAllInFolder = (node: TreeNode) => {
    const deselectRecursive = (n: TreeNode) => {
      setSelectedNoteIds((prev) => {
        const next = new Set(prev);
        next.delete(n.id);
        return next;
      });
      n.children.forEach(deselectRecursive);
    };
    deselectRecursive(node);
  };

  const isFolderFullySelected = (node: TreeNode): boolean => {
    const allIds = new Set<string>();
    const collectIds = (n: TreeNode) => {
      allIds.add(n.id);
      n.children.forEach(collectIds);
    };
    collectIds(node);
    return Array.from(allIds).every((id) => selectedNoteIds.has(id));
  };

  const renderTreeNode = (node: TreeNode): React.ReactNode => {
    const isSelected = selectedNoteIds.has(node.id);
    const isOpen = openFolders.has(node.id);
    const isFolderFullySelectedValue = node.is_folder ? isFolderFullySelected(node) : false;

    if (node.is_folder) {
      return (
        <div key={node.id} className="mb-1">
          <div className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded">
            <button
              type="button"
              onClick={() => toggleFolder(node.id)}
              className="p-0.5 hover:bg-muted rounded"
            >
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform",
                  isOpen && "rotate-90"
                )}
              />
            </button>
            <input
              type="checkbox"
              checked={isFolderFullySelectedValue}
              onChange={() => {
                if (isFolderFullySelectedValue) {
                  handleDeselectAllInFolder(node);
                } else {
                  handleSelectAllInFolder(node);
                }
              }}
              className="w-4 h-4"
            />
            <Folder className="w-4 h-4" />
            <span className="flex-1 text-sm font-medium">{node.title}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                if (isFolderFullySelectedValue) {
                  handleDeselectAllInFolder(node);
                } else {
                  handleSelectAllInFolder(node);
                }
              }}
            >
              {isFolderFullySelectedValue ? "Снять всё" : "Выбрать всё"}
            </Button>
          </div>
          {isOpen && node.children.length > 0 && (
            <div className="ml-6 mt-1">
              {node.children.map((child) => renderTreeNode(child))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div key={node.id} className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded ml-6">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleNoteSelection(node.id)}
            className="w-4 h-4"
          />
          <File className="w-4 h-4" />
          <span className="flex-1 text-sm">{node.title}</span>
        </div>
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim() || selectedNoteIds.size === 0) return;

    addWorkspace(workspaceName.trim(), Array.from(selectedNoteIds));
    setWorkspaceName("");
    setSelectedNoteIds(new Set());
    onOpenChange(false);
  };

  const handleClose = () => {
    setWorkspaceName("");
    setSelectedNoteIds(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Создать воркспейс</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Название воркспейса
            </label>
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Введите название воркспейса"
              required
            />
          </div>
          <div className="mb-4 flex-1 min-h-0 flex flex-col">
            <label className="block text-sm font-medium mb-2">
              Выберите файлы и папки из коллекции
            </label>
            <div className="border rounded-lg p-4 overflow-y-auto flex-1 min-h-0 bg-muted/30">
              {tree.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Нет файлов и папок в коллекции
                </div>
              ) : (
                <div className="space-y-1">
                  {tree.map((node) => renderTreeNode(node))}
                </div>
              )}
            </div>
            {selectedNoteIds.size > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                Выбрано: {selectedNoteIds.size}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={!workspaceName.trim() || selectedNoteIds.size === 0}
            >
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

