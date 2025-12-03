import { Button } from "@/shared/ui/button";
import { Pencil, FolderPlus, Upload, Edit2, ChevronUp } from "lucide-react";
import React, { useRef } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

export const NoteTreeToolbar: React.FC<{
  onCreateNote?: () => void;
  onCreateFolder?: () => void;
  onImport?: (file: File) => void;
  onRename?: () => void;
  onCollapseAll?: () => void;
  selectedId?: string | null;
}> = (props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSelection = !!props.selectedId;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && props.onImport) {
      props.onImport(file);
    }
    e.target.value = ""; // сбросить input
  };

  return (
    <div className="flex gap-1 mb-2 items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            title="Создать файл"
            onClick={props.onCreateNote}
          >
            <Pencil className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Создать файл</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            title="Создать папку"
            onClick={props.onCreateFolder}
          >
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
            title="Переименовать"
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
          <Button
            variant="ghost"
            size="icon"
            title="Импортировать"
            onClick={handleImportClick}
          >
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
        <TooltipContent>Импортировать файл</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            title="Схлопнуть все папки"
            onClick={props.onCollapseAll}
          >
            <ChevronUp className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Схлопнуть все папки</TooltipContent>
      </Tooltip>
    </div>
  );
};
