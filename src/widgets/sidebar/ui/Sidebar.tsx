import * as React from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Zap, GraduationCap } from "lucide-react";

import { UserProfilePopover } from "@/entities/nav-user/UserProfilePopover";
import { useTheme } from "@/shared/context/useTheme";
import { SettingsDialog } from "@/shared/settings-dialog";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/sidebar";

import { ROUTES } from "@/shared/config/routes";
import Link from "next/link";
import { usePathname } from "next/navigation";

const getNavData = (t: (key: string) => string) => ({
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: t("sidebar.collection"),
      url: ROUTES.COLLECTION,
      icon: BookOpen,
      isActive: true,
      theme: "collection" as const,
    },
    {
      title: t("sidebar.trainer"),
      url: ROUTES.TRAINER,
      icon: Zap,
      isActive: false,
      theme: "trainer" as const,
    },
  ],
});

export function AppSidebar({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslation();
  const { setOpen } = useSidebar();
  const { setTheme } = useTheme();
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const data = getNavData(t);

  // Определяем активный элемент на основе текущего маршрута
  const activeItem = React.useMemo(() => {
    const currentPath = pathname;
    const found = data.navMain.find((item) => {
      // Для тренажера проверяем, начинается ли путь с ROUTES.TRAINER
      if (item.url === ROUTES.TRAINER) {
        return currentPath.startsWith(ROUTES.TRAINER);
      }
      return currentPath.startsWith(item.url);
    });
    return found || data.navMain[0];
  }, [pathname, data.navMain]);

  return (
    <Sidebar
      collapsible="none"
      className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
              <a href="#">
                <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GraduationCap className="size-4 text-blue-500" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title} className="">
                  <SidebarMenuButton
                    tooltip={{
                      children: item.title,
                      hidden: false,
                    }}
                    onClick={() => {
                      setTheme(item.theme);
                      setOpen(true);
                    }}
                    isActive={activeItem?.title === item.title}
                    className="px-2.5 md:px-2"
                    asChild
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {children && <div className="flex-1 flex flex-col">{children}</div>}
      </SidebarContent>
      <SidebarFooter>
        <UserProfilePopover onOpenSettings={() => setSettingsOpen(true)} />
      </SidebarFooter>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  );
}
