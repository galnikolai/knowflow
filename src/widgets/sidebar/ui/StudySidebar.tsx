import * as React from "react";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/shared/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { useFlashcardsStore } from "@/shared/store/useFlashcardsStore";

interface StudySidebarProps extends React.ComponentProps<typeof Sidebar> {
  selectedId?: string | null;
  onSelectCard?: (id: string) => void;
  children?: React.ReactNode;
}

export function StudySidebar({
  selectedId,
  onSelectCard,
  children,
  ...props
}: StudySidebarProps) {
  const cards = useFlashcardsStore((s) => s.cards);

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
        <Sidebar
          collapsible="none"
          className="hidden flex-1 md:flex border-r bg-background"
        >
          <SidebarMenu>
            {cards.map((card) => (
              <SidebarMenuItem key={card.id}>
                <SidebarMenuButton
                  isActive={selectedId === card.id}
                  onClick={() => onSelectCard?.(card.id)}
                  className="truncate"
                >
                  {card.question}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </Sidebar>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
