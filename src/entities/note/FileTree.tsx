import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotesStore } from "@/shared/store/useNotesStore";
import { cn } from "@/lib/utils";
import type { Note } from "@/shared/api/notes";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shared/ui/context-menu";
import { NoteTreeToolbar } from "./NoteTreeToolbar";

// Тип для узла дерева
interface TreeNode extends Note {
  children: TreeNode[];
}

function buildTree(notes: Note[], parentId: string | null = null): TreeNode[] {
  return notes
    .filter((n) => n.parent_id === parentId)
    .map((n) => ({ ...n, children: buildTree(notes, n.id) }));
}

function filterTree(tree: TreeNode[], query: string): TreeNode[] {
  if (!query) return tree;
  const q = query.toLowerCase();
  return tree
    .map((node) => {
      const match =
        node.title.toLowerCase().includes(q) ||
        (node.content && node.content.toLowerCase().includes(q));
      const filteredChildren = filterTree(node.children || [], query);
      if (match || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    })
    .filter((n): n is TreeNode => Boolean(n));
}

// --- DND Sortable Item ---
function SortableTreeItem({
  node,
  renderNode,
}: {
  node: TreeNode;
  renderNode: (n: TreeNode) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      {renderNode(node)}
    </div>
  );
}

export const FileTree: React.FC<{
  onSelectNote?: (note: Note) => void;
  selectedId?: string;
  onOpenTab?: (note: Note) => void;
}> = ({ onSelectNote, selectedId, onOpenTab }) => {
  const { t } = useTranslation();
  const notes = useNotesStore((s) => s.notes);
  const loading = useNotesStore((s) => s.loading);
  const error = useNotesStore((s) => s.error);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const addNote = useNotesStore((s) => s.addNote);
  const removeNote = useNotesStore((s) => s.removeNote);
  const updateNote = useNotesStore((s) => s.updateNote);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"file" | "folder">("file");
  const [parentId, setParentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  React.useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const tree = buildTree(notes);
  const filteredTree = filterTree(tree, search);

  // --- DND ---
  const sensors = useSensors(useSensor(PointerSensor));

  // Получаем все id для SortableContext (только текущий уровень)
  function getIds(nodes: TreeNode[]) {
    return nodes.map((n) => n.id);
  }

  // Перемещение заметки/папки (MVP: только на корневом уровне)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Только сортировка на корневом уровне (можно доработать для вложенности)
    const rootNotes = notes.filter((n) => n.parent_id === null);
    const oldIndex = rootNotes.findIndex((n) => n.id === active.id);
    const newIndex = rootNotes.findIndex((n) => n.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    arrayMove(rootNotes, oldIndex, newIndex);
    // TODO: реализовать сохранение порядка
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = await addNote({
      parent_id: parentId,
      node_id: null,
      title: newName,
      content: newType === "file" ? "" : null,
      is_folder: newType === "folder",
    });
    setNewName("");
    setParentId(null);
    if (onSelectNote && newType === "file") {
      onSelectNote(created);
    }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    await updateNote(id, { title: renameValue });
    setRenamingId(null);
    setRenameValue("");
  };

  const renderNode = (node: TreeNode) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          key={node.id}
          className={cn("pl-2", node.is_folder && "font-bold")}
        >
          <div
            className={cn(
              "flex items-center gap-1 cursor-pointer py-0.5",
              selectedId === node.id && "bg-primary/10 rounded"
            )}
            onClick={() => !node.is_folder && onSelectNote?.(node)}
            onDoubleClick={() => {
              setRenamingId(node.id);
              setRenameValue(node.title);
            }}
          >
            {node.is_folder ? "📁" : "📝"}
            {renamingId === node.id ? (
              <input
                className="input input-bordered input-xs ml-1"
                value={renameValue}
                autoFocus
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRename(node.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(node.id);
                  if (e.key === "Escape") setRenamingId(null);
                }}
              />
            ) : (
              <span>{node.title}</span>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            setParentId(node.id);
            setNewType("file");
          }}
        >
          Создать заметку
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            setParentId(node.id);
            setNewType("folder");
          }}
        >
          Создать папку
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            setRenamingId(node.id);
            setRenameValue(node.title);
          }}
        >
          Переименовать
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => removeNote(node.id)}
          className="text-red-500"
        >
          Удалить
        </ContextMenuItem>
      </ContextMenuContent>
      {node.children && node.children.length > 0 && (
        <div className="pl-4 border-l border-muted-foreground/20 ml-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={getIds(node.children)}
              strategy={verticalListSortingStrategy}
            >
              {node.children.map((child) => (
                <SortableTreeItem
                  key={child.id}
                  node={child}
                  renderNode={renderNode}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
      {node.is_folder && (
        <button
          className="ml-4 text-xs text-blue-500 hover:underline"
          onClick={() => setParentId(node.id)}
        >
          + добавить
        </button>
      )}
    </ContextMenu>
  );

  // Для создания в выбранной папке или корне
  const getTargetParentId = () => {
    if (!selectedId) return null;
    const selected = notes.find((n) => n.id === selectedId);
    if (selected && selected.is_folder) return selected.id;
    if (selected && selected.parent_id) return selected.parent_id;
    return null;
  };

  // Импорт файла
  const handleImport = async (file: File) => {
    const text = await file.text();
    const parentId = getTargetParentId();
    const created = await addNote({
      parent_id: parentId,
      node_id: null,
      title: file.name.replace(/\.[^/.]+$/, ""),
      content: text,
      is_folder: false,
    });
    if (onSelectNote) onSelectNote(created);
  };

  // Открытие в отдельной вкладке (заготовка)
  const handleOpenSeparate = () => {
    if (!selectedId) return;
    const note = notes.find((n) => n.id === selectedId);
    if (note && onOpenTab) onOpenTab(note);
  };

  return (
    <div>
      <NoteTreeToolbar
        onCreateNote={async () => {
          const parentId = getTargetParentId();
          const created = await addNote({
            parent_id: parentId,
            node_id: null,
            title: t("notes.newNote"),
            content: "",
            is_folder: false,
          });
          if (onSelectNote) onSelectNote(created);
        }}
        onCreateFolder={async () => {
          const parentId = getTargetParentId();
          const created = await addNote({
            parent_id: parentId,
            node_id: null,
            title: t("notes.newFolder"),
            content: null,
            is_folder: true,
          });
          if (onSelectNote) onSelectNote(created);
        }}
        onImport={handleImport}
        onOpenSeparate={handleOpenSeparate}
      />
      <div className="mb-2 font-semibold">{t("notes.fileStructure")}</div>
      <input
        className="input input-bordered input-sm mb-2 w-full"
        placeholder={t("notes.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading && <div>{t("notes.loading")}</div>}
      {error && (
        <div className="text-red-500">
          {t("notes.error")} {error}
        </div>
      )}
      <form onSubmit={handleAdd} className="flex gap-2 mb-2">
        <input
          className="input input-bordered input-sm"
          placeholder={parentId ? t("notes.name") : t("notes.rootName")}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <select
          className="input input-bordered input-sm"
          value={newType}
          onChange={(e) => setNewType(e.target.value as "file" | "folder")}
        >
          <option value="file">Заметка</option>
          <option value="folder">Папка</option>
        </select>
        <button className="btn btn-primary btn-sm" type="submit">
          Добавить
        </button>
        {parentId && (
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={() => setParentId(null)}
          >
            В корень
          </button>
        )}
      </form>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={getIds(filteredTree)}
          strategy={verticalListSortingStrategy}
        >
          {filteredTree.map((node) => (
            <SortableTreeItem
              key={node.id}
              node={node}
              renderNode={renderNode}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
