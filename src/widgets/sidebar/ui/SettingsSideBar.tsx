import * as React from "react";
import { ChevronRight, File, Folder } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
} from "@/shared/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { AppSidebar } from "./Sidebar";
import { createFileFilterStore } from "@/lib/fileFilter";
import type { TreeNode } from "@/lib/fileFilter";

const dataFiles = {
  changes: [
    { file: "README.md", state: "M" },
    { file: "api/hello/route.ts", state: "U" },
    { file: "app/layout.tsx", state: "M" },
  ],
  tree: [
    [
      "app",
      [
        "api",
        ["hello", ["route.ts"]],
        "page.tsx",
        "layout.tsx",
        ["blog", ["page.tsx"]],
      ],
    ],
    [
      "components",
      ["ui", "button.tsx", "card.tsx"],
      "header.tsx",
      "footer.tsx",
    ],
    ["lib", ["util.ts"]],
    ["public", "favicon.ico", "vercel.svg"],
    ".eslintrc.json",
    ".gitignore",
    "next.config.js",
    "tailwind.config.js",
    "package.json",
    "README.md",
  ],
};

// Zustand store для фильтрации
const useFileFilterStore = createFileFilterStore(dataFiles.tree as TreeNode[]);

// Древовидный компонент с Collapsible
function Tree({ item }: { item: TreeNode }) {
  const [name, ...items] = Array.isArray(item) ? item : [item];
  if (!items.length) {
    return (
      <SidebarMenuButton
        isActive={name === "button.tsx"}
        className="data-[active=true]:bg-transparent"
      >
        <File />
        {name}
      </SidebarMenuButton>
    );
  }
  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={name === "components" || name === "ui"}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform" />
            <Folder />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((subItem, index) => (
              <Tree key={index} item={subItem as TreeNode} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

export function SettingsSidebar({
  children,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const filtered = useFileFilterStore((state) => state.filtered);
  const filter = useFileFilterStore((state) => state.filter);
  const setFilter = useFileFilterStore((state) => state.setFilter);

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
        {/* Вторая панель */}
        <Sidebar collapsible="none" className="hidden flex-1 md:flex">
          <SidebarHeader className="gap-3.5 border-b p-4">
            <div className="flex w-full items-center justify-between">
              <div className="text-foreground text-base font-medium">
                Settings
              </div>
            </div>
            <SidebarInput
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-0">
              <SidebarGroupContent>
                {filter
                  ? filtered.map((item) => (
                      <SidebarMenuButton
                        key={item.path}
                        className="data-[active=true]:bg-transparent"
                      >
                        {item.type === "file" ? <File /> : <Folder />}
                        {item.name}
                      </SidebarMenuButton>
                    ))
                  : (dataFiles.tree as TreeNode[]).map((item, idx) => (
                      <Tree key={idx} item={item} />
                    ))}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </Sidebar>
      <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
    </SidebarProvider>
  );
}
