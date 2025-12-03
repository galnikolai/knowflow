import { NotesSidebar } from "@/widgets";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotesStore } from "@/shared/store/useNotesStore";
import { useDebounceEffect } from "@/shared/hooks/useDebounceEffect";
import type { Note } from "@/shared/api/notes";
import { NoteEditor } from "@/entities/note/NoteEditor";

interface Tab {
  id: string;
  note: Note;
}

export const Notes: React.FC = () => {
  const { t } = useTranslation();
  const addNote = useNotesStore((s) => s.addNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [focusedFolderId, setFocusedFolderId] = useState<string | null>(null);

  // Открыть заметку в табе
  const openTab = (note: Note) => {
    setOpenTabs((tabs) => {
      if (tabs.find((t) => t.id === note.id)) return tabs;
      return [...tabs, { id: note.id, note }];
    });
    setActiveTabId(note.id);
    setEditValues((vals) => ({ ...vals, [note.id]: note.content || "" }));
    if (note.is_folder) setFocusedFolderId(note.id);
  };

  // Закрыть вкладку
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

  // Переключить вкладку
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

  // Обработка выбора заметки из дерева или после импорта
  const handleSelectNote = (note: Note) => {
    openTab(note);
    if (note.is_folder) setFocusedFolderId(note.id);
  };

  // Фокус на папке
  const handleFocusFolder = (folderId: string) => {
    setFocusedFolderId(folderId);
  };

  // Создание заметки/папки с учётом фокуса
  const handleCreateNote = async () => {
    const parentId = focusedFolderId;
    const created = await addNote({
      parent_id: parentId,
      node_id: null,
      title: t("notes.newNote"),
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
      title: t("notes.newFolder"),
      content: null,
      is_folder: true,
    });
    openTab(created);
    setFocusedFolderId(created.id);
  };
  // Импорт файла
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

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  return (
    <NotesSidebar
      onSelectNote={handleSelectNote}
      selectedId={activeTabId}
      onCreateNote={handleCreateNote}
      onCreateFolder={handleCreateFolder}
      onImport={handleImport}
      focusedFolderId={focusedFolderId}
      onFocusFolder={handleFocusFolder}
    >
      {/* Табы */}
      <div className="flex gap-1 mb-2 border-b pb-1 overflow-x-auto">
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
        <div className="mb-8 h-[calc(100vh-120px)] flex flex-col">
          <div className="font-semibold mb-2">{activeTab.note.title}</div>
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
              {t("notes.saving")}
            </div>
          )}
        </div>
      )}
    </NotesSidebar>
  );
};
