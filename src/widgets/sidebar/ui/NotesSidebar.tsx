import * as React from "react";
import { AppSidebar } from "./Sidebar";

import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInput,
  SidebarMenuSub,
} from "@/shared/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { File, Folder, ChevronRight, MoreVertical, GraduationCap } from "lucide-react";
import { NoteTreeToolbar } from "@/entities/note/NoteTreeToolbar";
import { useNotesStore } from "@/shared/store/useNotesStore";
import type { Note } from "@/shared/api/notes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { SidebarMenuAction } from "@/shared/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { generateFlashcards } from "@/shared/api/ai-generator";
import { useFlashcardsStore } from "@/shared/store/useFlashcardsStore";
import { useUserStore } from "@/shared/store/useUserStore";
import { useLearnspacesStore } from "@/shared/store/useLearnspacesStore";
import { useRouter } from "next/router";
import { ROUTES } from "@/shared/config/routes";
import { ExternalLink } from "lucide-react";

interface NotesSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSelectNote?: (note: Note) => void;
  selectedId: string | null;
  onCreateNote?: () => void;
  onCreateFolder?: () => void;
  onImport?: (file: File) => void;
  onRename?: () => void;
  onCollapseAll?: () => void;
  focusedFolderId?: string | null;
  onFocusFolder?: (folderId: string) => void;
  children?: React.ReactNode;
}

export function NotesSidebar({
  children,
  onSelectNote,
  selectedId,
  onCreateNote,
  onCreateFolder,
  onImport,
  onRename,
  onCollapseAll,
  focusedFolderId,
  onFocusFolder,
  ...props
}: NotesSidebarProps) {
  const notes = useNotesStore((s) => s.notes);
  const loading = useNotesStore((s) => s.loading);
  const error = useNotesStore((s) => s.error);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const removeNote = useNotesStore((s) => s.removeNote);
  const addCard = useFlashcardsStore((s) => s.addCard);
  const user = useUserStore((s) => s.user);
  const addLearnspace = useLearnspacesStore((s) => s.addLearnspace);
  const learnspaces = useLearnspacesStore((s) => s.learnspaces);
  const fetchLearnspaces = useLearnspacesStore((s) => s.fetchLearnspaces);
  const router = useRouter();

  React.useEffect(() => {
    fetchLearnspaces();
  }, [fetchLearnspaces]);
  const [search, setSearch] = React.useState("");
  const [openFolders, setOpenFolders] = React.useState<Set<string>>(new Set());
  const [studyDialogOpen, setStudyDialogOpen] = React.useState(false);
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null);
  const [selectedMethods, setSelectedMethods] = React.useState<Set<string>>(
    new Set()
  );
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [aiProvider, setAiProvider] = React.useState<"openai" | "ollama">("ollama");
  const [ollamaModel, setOllamaModel] = React.useState("llama3.2");

  React.useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // --- Tree rendering ---
  function buildTree(notes: Note[], parentId: string | null = null): Note[] {
    return notes.filter((n) => n.parent_id === parentId);
  }
  const tree = buildTree(notes);

  const handleCollapseAll = React.useCallback(() => {
    setOpenFolders(new Set());
    onCollapseAll?.();
  }, [onCollapseAll]);

  const toggleFolder = React.useCallback((folderId: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Найти learnspace, связанный с заметкой
  const getLearnspaceForNote = (noteId: string) => {
    return learnspaces.find((ls) => ls.noteIds.includes(noteId));
  };

  // Навигация в тренажер для learnspace
  const handleNavigateToTrainer = (noteId: string) => {
    const learnspace = getLearnspaceForNote(noteId);
    if (learnspace) {
      // Переходим в тренажер с параметром learnspace
      router.push(`${ROUTES.TRAINER_CHALLENGES}?learnspace=${learnspace.id}`);
    } else {
      // Если learnspace нет, переходим просто в тренажер
      router.push(ROUTES.TRAINER_CHALLENGES);
    }
  };

  const handleStudyClick = React.useCallback((node: Note) => {
    setSelectedNote(node);
    setSelectedMethods(new Set());
    setAiProvider("ollama"); // Используем Ollama по умолчанию
    setOllamaModel("llama3.2");
    setStudyDialogOpen(true);
  }, []);

  const toggleMethod = React.useCallback((methodId: string) => {
    setSelectedMethods((prev) => {
      const next = new Set(prev);
      if (next.has(methodId)) {
        next.delete(methodId);
      } else {
        next.add(methodId);
      }
      return next;
    });
  }, []);

  const handleCreateStudy = React.useCallback(async () => {
    if (!selectedNote || selectedMethods.size === 0 || !user) return;

    setIsGenerating(true);

    try {
      if (selectedMethods.has("flashcards")) {
        // Извлекаем текст из HTML контента
        const content = selectedNote.content || "";
        // Удаляем HTML теги для получения чистого текста
        const textContent = content.replace(/<[^>]*>/g, "").trim();

        if (!textContent) {
          throw new Error(
            "Заметка не содержит текста для создания флеш-карточек"
          );
        }

        // Генерируем флеш-карточки через AI
        const cards = await generateFlashcards({
          content: textContent,
          provider: aiProvider,
          model: aiProvider === "ollama" ? ollamaModel : undefined,
          count: 8,
        });

        // Создаем флеш-карточки в базе данных
        for (const card of cards) {
          await addCard({
            nodeId: selectedNote.id,
            question: card.question,
            answer: card.answer,
            nextReview: Date.now(),
            interval: 1,
            repetitions: 0,
            easeFactor: 2.5,
          });
        }

        // Проверяем, существует ли уже learnspace для этой заметки
        const existingLearnspace = getLearnspaceForNote(selectedNote.id);
        
        if (!existingLearnspace) {
          // Создаем learnspace, связанный с заметкой/папкой
          const learnspaceName = selectedNote.is_folder
            ? `Тренировка: ${selectedNote.title}`
            : `Тренировка: ${selectedNote.title}`;
          
          // Собираем все ID заметок для learnspace (сама заметка + все дочерние, если это папка)
          const noteIds: string[] = [selectedNote.id];
          if (selectedNote.is_folder) {
            // Добавляем все дочерние заметки из папки (рекурсивно)
            const collectChildren = (parentId: string) => {
              const children = notes.filter((n) => n.parent_id === parentId);
              children.forEach((child) => {
                noteIds.push(child.id);
                if (child.is_folder) {
                  collectChildren(child.id);
                }
              });
            };
            collectChildren(selectedNote.id);
          }

          const newLearnspace = await addLearnspace(learnspaceName, noteIds);
          await fetchLearnspaces(); // Обновляем список learnspaces
          
          // Переходим в тренажер с параметром learnspace
          router.push(`${ROUTES.TRAINER_CHALLENGES}?learnspace=${newLearnspace.id}`);
        } else {
          // Если learnspace уже существует, переходим к нему
          router.push(`${ROUTES.TRAINER_CHALLENGES}?learnspace=${existingLearnspace.id}`);
        }
      }

      setStudyDialogOpen(false);
      setSelectedNote(null);
      setSelectedMethods(new Set());
    } catch (error) {
      console.error("Ошибка создания флеш-карточек:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Произошла ошибка при создании флеш-карточек"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [selectedNote, selectedMethods, user, addCard]);

  function renderTree(nodes: Note[]) {
    return nodes.map((node) => {
      if (node.is_folder) {
        const children = buildTree(notes, node.id);
        const isOpen = openFolders.has(node.id);
        const isFocused = focusedFolderId === node.id;
        return (
          <SidebarMenuItem key={node.id} className="group">
            <Collapsible
              className="[&[data-state=open]>button>svg:first-child]:rotate-90"
              open={isOpen}
              onOpenChange={() => toggleFolder(node.id)}
            >
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  isActive={isFocused || selectedId === node.id}
                  className="font-bold flex items-center"
                  onClick={() => onFocusFolder?.(node.id)}
                >
                  <ChevronRight className="transition-transform mr-1" />
                  <Folder className="mr-1" />
                  <span className="flex-1 truncate">{node.title}</span>
                  {getLearnspaceForNote(node.id) && (
                    <GraduationCap className="ml-1 w-3 h-3 text-primary" title="Есть тренировка" />
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>{renderTree(children)}</SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreVertical className="size-4" />
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStudyClick(node)}>
                  Изучить
                </DropdownMenuItem>
                {getLearnspaceForNote(node.id) && (
                  <DropdownMenuItem
                    onClick={() => handleNavigateToTrainer(node.id)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Перейти в тренажер
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => removeNote(node.id)}
                >
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        );
      } else {
        return (
          <SidebarMenuItem key={node.id} className="group">
            <SidebarMenuButton
              isActive={selectedId === node.id}
              onClick={() => onSelectNote?.(node)}
            >
              <File className="mr-1" />
              <span className="flex-1 truncate">{node.title}</span>
              {getLearnspaceForNote(node.id) && (
                <GraduationCap className="ml-1 w-3 h-3 text-primary" title="Есть тренировка" />
              )}
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreVertical className="size-4" />
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStudyClick(node)}>
                  Изучить
                </DropdownMenuItem>
                {getLearnspaceForNote(node.id) && (
                  <DropdownMenuItem
                    onClick={() => handleNavigateToTrainer(node.id)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Перейти в тренажер
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => removeNote(node.id)}
                >
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        );
      }
    });
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "350px" } as React.CSSProperties}
    >
      <Sidebar
        collapsible="icon"
        className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
        {...props}
      >
        <AppSidebar />
        <Sidebar collapsible="none" className="hidden flex-1 md:flex">
          <SidebarHeader className="gap-3.5 border-b p-4">
            <div className="flex w-full items-center justify-between">
              <div className="text-foreground text-base font-medium">Файлы</div>
            </div>
            <NoteTreeToolbar
              onCreateNote={onCreateNote}
              onCreateFolder={onCreateFolder}
              onImport={onImport}
              onRename={onRename}
              onCollapseAll={handleCollapseAll}
              selectedId={selectedId}
            />

            <SidebarInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-0">
              <SidebarGroupContent>
                {loading && <div>Загрузка...</div>}
                {error && <div className="text-red-500">Ошибка: {error}</div>}
                {renderTree(tree)}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>

      <Dialog open={studyDialogOpen} onOpenChange={setStudyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Способы изучения</DialogTitle>
            <DialogDescription>
              Выберите способы изучения для "{selectedNote?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-md p-2">
              <input
                type="checkbox"
                checked={selectedMethods.has("flashcards")}
                onChange={() => toggleMethod("flashcards")}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Создание флеш-карточек</span>
            </label>
            
            {selectedMethods.has("flashcards") && (
              <div className="ml-7 flex flex-col gap-3 mt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">AI провайдер:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="ai-provider"
                        value="openai"
                        checked={aiProvider === "openai"}
                        onChange={(e) => setAiProvider(e.target.value as "openai" | "ollama")}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">OpenAI (быстро, платно)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="ai-provider"
                        value="ollama"
                        checked={aiProvider === "ollama"}
                        onChange={(e) => setAiProvider(e.target.value as "openai" | "ollama")}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Ollama (локально, бесплатно)</span>
                    </label>
                  </div>
                </div>
                
                {aiProvider === "ollama" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Модель Ollama:</label>
                    <select
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="llama3.2">Llama 3.2 (3B) - Быстрая</option>
                      <option value="mistral">Mistral (7B) - Качественная</option>
                      <option value="qwen2.5:7b">Qwen2.5 (7B) - Качественная</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Убедитесь, что Ollama запущен и модель установлена
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStudyDialogOpen(false);
                setSelectedNote(null);
                setSelectedMethods(new Set());
                setAiProvider("ollama");
                setOllamaModel("llama3.2");
              }}
            >
              Отменить
            </Button>
            <Button
              onClick={handleCreateStudy}
              disabled={selectedMethods.size === 0 || isGenerating}
            >
              {isGenerating ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
