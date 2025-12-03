import * as React from "react";
import { AppSidebar } from "./Sidebar";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";
import { useWorkspacesStore } from "@/shared/store/useWorkspacesStore";
import { useLearnspacesStore } from "@/shared/store/useLearnspacesStore";
import { Folder, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";
import { useNotesStore } from "@/shared/store/useNotesStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface TrainerSidebarProps {
  children?: React.ReactNode;
  sidebarWidth?: string;
}

export function TrainerSidebar({
  children,
  sidebarWidth = "350px",
  ...props
}: TrainerSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const workspaces = useWorkspacesStore((s) => s.workspaces);
  const learnspaces = useLearnspacesStore((s) => s.learnspaces);
  const fetchLearnspaces = useLearnspacesStore((s) => s.fetchLearnspaces);
  const notes = useNotesStore((s) => s.notes);
  const router = useRouter();

  React.useEffect(() => {
    fetchLearnspaces();
  }, [fetchLearnspaces]);

  // Объединяем workspaces и learnspaces для отображения
  const allSpaces = [
    ...workspaces.map((w) => ({ ...w, type: "workspace" as const })),
    ...learnspaces.map((l) => ({ ...l, type: "learnspace" as const })),
  ];

  // Если нет воркспейсов, устанавливаем минимальную ширину для иконок
  const effectiveWidth = allSpaces.length === 0 ? "49px" : sidebarWidth;

  // Функция для получения названия заметки по ID
  const getNoteName = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    return note?.title || "Неизвестная заметка";
  };

  // Навигация к заметке
  const handleNavigateToNote = (noteId: string) => {
    router.push(`${ROUTES.COLLECTION}?note=${noteId}`);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": effectiveWidth,
        } as React.CSSProperties
      }
    >
      <Sidebar
        collapsible="icon"
        className={cn(
          "overflow-hidden",
          allSpaces.length > 0 && "*:data-[sidebar=sidebar]:flex-row"
        )}
        {...props}
      >
        <AppSidebar />
        {allSpaces.length > 0 && (
          <Sidebar
            collapsible="none"
            className="hidden flex-1 md:flex border-r bg-background"
          >
            <SidebarHeader>
              <div className="px-4 py-2 text-sm font-semibold">Тренировки</div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {allSpaces.map((space) => (
                      <SidebarMenuItem key={space.id} className="group">
                        <SidebarMenuButton className="truncate">
                          <Folder className="mr-2 w-4 h-4" />
                          <span className="flex-1 truncate">{space.name}</span>
                        </SidebarMenuButton>
                        {space.type === "learnspace" && space.noteIds.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
                                title="Перейти к заметкам"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {space.noteIds.map((noteId) => {
                                const noteName = getNoteName(noteId);
                                return (
                                  <DropdownMenuItem
                                    key={noteId}
                                    onClick={() => handleNavigateToNote(noteId)}
                                  >
                                    {noteName}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        )}
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
