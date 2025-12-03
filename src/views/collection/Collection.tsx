import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/shared/context/useTheme";
import { NotesSidebar } from "@/widgets";
import { useNotesStore } from "@/shared/store/useNotesStore";
import { useDebounceEffect } from "@/shared/hooks/useDebounceEffect";
import type { Note } from "@/shared/api/notes";
import { NoteEditor } from "@/entities/note/NoteEditor";
import { FileEdit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

interface Tab {
  id: string;
  note: Note;
}

export const Collection: React.FC = () => {
  const { t } = useTranslation();
  const { themeColors } = useTheme();

  // Состояние для заметок
  const addNote = useNotesStore((s) => s.addNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const notes = useNotesStore((s) => s.notes);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [focusedFolderId, setFocusedFolderId] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleEditValue, setTitleEditValue] = useState("");

  // Функции для работы с заметками
  const openTab = (note: Note) => {
    setOpenTabs((tabs) => {
      if (tabs.find((t) => t.id === note.id)) return tabs;
      return [...tabs, { id: note.id, note }];
    });
    setActiveTabId(note.id);
    setEditValues((vals) => ({ ...vals, [note.id]: note.content || "" }));
    if (note.is_folder) setFocusedFolderId(note.id);
  };

  const closeTab = (id: string) => {
    setOpenTabs((tabs) => {
      const idx = tabs.findIndex((t) => t.id === id);
      const newTabs = tabs.filter((t) => t.id !== id);
      if (activeTabId === id) {
        if (newTabs.length > 0) {
          const nextIdx = idx === 0 ? 0 : idx - 1;
          setActiveTabId(newTabs[nextIdx].id);
        } else {
          setActiveTabId(null);
        }
      }
      return newTabs;
    });
    setEditValues((vals) => {
      const newVals = { ...vals };
      delete newVals[id];
      return newVals;
    });
  };

  const activateTab = (id: string) => {
    setActiveTabId(id);
    const tab = openTabs.find((t) => t.id === id);
    if (tab && tab.note.is_folder) setFocusedFolderId(tab.id);
  };

  // Автосохранение с дебаунсом
  useDebounceEffect(
    () => {
      if (!activeTabId) return;
      const tab = openTabs.find((t) => t.id === activeTabId);
      if (!tab) return;
      const value = editValues[activeTabId];
      if (value !== tab.note.content) {
        setSaving(true);
        updateNote(tab.id, { content: value }).finally(() => setSaving(false));
      }
    },
    [editValues, activeTabId],
    5000
  );

  const handleSelectNote = (note: Note) => {
    openTab(note);
    if (note.is_folder) {
      setFocusedFolderId(note.id);
    }
  };

  const handleFocusFolder = (folderId: string) => {
    setFocusedFolderId(folderId);
  };

  const handleCreateNote = async () => {
    const parentId = focusedFolderId;
    const created = await addNote({
      parent_id: parentId,
      node_id: null,
      title: t("collection.newNote"),
      content: "",
      is_folder: false,
    });
    openTab(created);
  };

  const handleCreateFolder = async () => {
    const parentId = focusedFolderId;
    const created = await addNote({
      parent_id: parentId,
      node_id: null,
      title: t("collection.newFolder"),
      content: null,
      is_folder: true,
    });
    openTab(created);
    setFocusedFolderId(created.id);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const parentId = focusedFolderId;
    const created = await addNote({
      parent_id: parentId,
      node_id: null,
      title: file.name.replace(/\.[^/.]+$/, ""),
      content: text,
      is_folder: false,
    });
    openTab(created);
  };

  const handleRename = () => {
    if (!activeTabId) return;
    const note = notes.find((n) => n.id === activeTabId);
    if (note) {
      setRenameValue(note.title);
      setRenameDialogOpen(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (!activeTabId || !renameValue.trim()) return;
    await updateNote(activeTabId, { title: renameValue.trim() });
    setRenameDialogOpen(false);
    setRenameValue("");
  };

  const handleStartEditingTitle = (noteId: string, currentTitle: string) => {
    setEditingTitleId(noteId);
    setTitleEditValue(currentTitle);
  };

  const handleSaveTitle = async (noteId: string) => {
    if (!titleEditValue.trim()) {
      setEditingTitleId(null);
      return;
    }
    const note = notes.find((n) => n.id === noteId);
    if (note && note.title !== titleEditValue.trim()) {
      await updateNote(noteId, { title: titleEditValue.trim() });
    }
    setEditingTitleId(null);
    setTitleEditValue("");
  };

  const handleCancelTitleEdit = () => {
    setEditingTitleId(null);
    setTitleEditValue("");
  };

  // Синхронизация вкладок с обновленными заметками
  React.useEffect(() => {
    setOpenTabs((tabs) =>
      tabs.map((tab) => {
        const updatedNote = notes.find((n) => n.id === tab.id);
        return updatedNote ? { ...tab, note: updatedNote } : tab;
      })
    );
  }, [notes]);

  const handleCollapseAll = () => {
    // Функция вызывается из NotesSidebar, там уже управляется состоянием
  };

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  return (
    <>
      <NotesSidebar
        onSelectNote={handleSelectNote}
        selectedId={activeTabId}
        onCreateNote={handleCreateNote}
        onCreateFolder={handleCreateFolder}
        onImport={handleImport}
        onRename={handleRename}
        onCollapseAll={handleCollapseAll}
        focusedFolderId={focusedFolderId}
        onFocusFolder={handleFocusFolder}
      >
        <div className="min-h-screen transition-all duration-300">
          {/* Табы */}
          <div className="flex gap-1 mb-2 border-b pb-1 overflow-x-auto px-4 pt-4">
            {openTabs.map((tab) => (
              <div
                key={tab.id}
                className={
                  "px-3 py-1 rounded-t cursor-pointer flex items-center gap-1 " +
                  (tab.id === activeTabId
                    ? "bg-muted text-primary font-semibold"
                    : "bg-transparent text-muted-foreground hover:bg-muted/50")
                }
                onClick={() => activateTab(tab.id)}
              >
                <span className="truncate max-w-[120px]">{tab.note.title}</span>
                <button
                  className="ml-1 text-xs text-muted-foreground hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Редактор */}
          {activeTab && !activeTab.note.is_folder && (
            <div className="mb-8 h-[calc(100vh-120px)] flex flex-col px-4">
              <div className="bg-white rounded-lg p-4 flex-1 min-h-0">
                {editingTitleId === activeTab.id ? (
                  <Input
                    value={titleEditValue}
                    onChange={(e) => setTitleEditValue(e.target.value)}
                    onBlur={() => handleSaveTitle(activeTab.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveTitle(activeTab.id);
                      } else if (e.key === "Escape") {
                        handleCancelTitleEdit();
                      }
                    }}
                    className="font-semibold mb-2 text-lg border-2 focus-visible:ring-2"
                    autoFocus
                  />
                ) : (
                  <div
                    className="font-semibold mb-2 text-lg cursor-text hover:bg-muted/50 rounded px-2 py-1 -mx-2 transition-colors"
                    onClick={() =>
                      handleStartEditingTitle(
                        activeTab.id,
                        activeTab.note.title
                      )
                    }
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleStartEditingTitle(
                        activeTab.id,
                        activeTab.note.title
                      );
                    }}
                    title="Кликните для редактирования названия"
                  >
                    {activeTab.note.title}
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  <NoteEditor
                    value={editValues[activeTab.id] ?? ""}
                    onChange={(val: string) => {
                      setEditValues((vals) => ({
                        ...vals,
                        [activeTab.id]: val,
                      }));
                    }}
                  />
                </div>
                {saving && (
                  <div className="text-muted-foreground text-xs">
                    {t("collection.saving")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state for notes */}
          {openTabs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <FileEdit
                className="w-16 h-16 mb-4"
                style={{ color: themeColors.textMuted }}
              />
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: themeColors.text }}
              >
                {t("collection.emptyState.title")}
              </h3>
              <p
                className="text-center max-w-md"
                style={{ color: themeColors.textMuted }}
              >
                {t("collection.emptyState.description")}
              </p>
            </div>
          )}
        </div>
      </NotesSidebar>

      {/* Диалог переименования */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переименовать</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Введите новое название"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameSubmit();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button onClick={handleRenameSubmit} disabled={!renameValue.trim()}>
              Переименовать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
