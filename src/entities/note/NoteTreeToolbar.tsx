import { Button } from "@/shared/ui/button";
import { Pencil, FolderPlus, Upload, Edit2, ChevronUp, Link } from "lucide-react";
import React, { useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";

// ─── URL-import dialog ────────────────────────────────────────────────────────

async function fetchUrlContent(url: string): Promise<{ title: string; content: string }> {
  const res = await fetch(`/api/import-url?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Ошибка загрузки (${res.status})`);
  }
  return res.json() as Promise<{ title: string; content: string }>;
}

interface UrlImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportUrl: (title: string, content: string) => void;
}

function UrlImportDialog({ open, onClose, onImportUrl }: UrlImportDialogProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!url.trim()) return;
    setError("");
    setLoading(true);
    try {
      const { title, content } = await fetchUrlContent(url.trim());
      onImportUrl(title, content);
      setUrl("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Импорт из URL</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <p className="text-sm text-muted-foreground">
            Введите адрес статьи — текст будет извлечён и сохранён как заметка.
          </p>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            onKeyDown={(e) => { if (e.key === "Enter") void handleImport(); }}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleImport} disabled={loading || !url.trim()}>
            {loading ? "Загрузка…" : "Импортировать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

export const NoteTreeToolbar: React.FC<{
  onCreateNote?: () => void;
  onCreateFolder?: () => void;
  onImport?: (file: File) => void;
  onImportUrl?: (title: string, content: string) => void;
  onRename?: () => void;
  onCollapseAll?: () => void;
  selectedId?: string | null;
}> = (props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const hasSelection = !!props.selectedId;

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && props.onImport) props.onImport(file);
    e.target.value = "";
  };

  return (
    <>
      <div className="flex gap-1 mb-2 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={props.onCreateNote}>
              <Pencil className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Создать файл</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={props.onCreateFolder}>
              <FolderPlus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Создать папку</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={props.onRename}
              disabled={!hasSelection}
            >
              <Edit2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasSelection ? "Переименовать" : "Выберите файл или папку"}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleImportClick}>
              <Upload className="size-4" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Импортировать файл (.md/.txt)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setUrlDialogOpen(true)}>
              <Link className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Импортировать из URL</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={props.onCollapseAll}>
              <ChevronUp className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Схлопнуть все папки</TooltipContent>
        </Tooltip>
      </div>

      <UrlImportDialog
        open={urlDialogOpen}
        onClose={() => setUrlDialogOpen(false)}
        onImportUrl={(title, content) => props.onImportUrl?.(title, content)}
      />
    </>
  );
};
