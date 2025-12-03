import React, { useState, useEffect } from "react";
import { TrainerSidebar } from "@/widgets";
import { useWorkspacesStore } from "@/shared/store/useWorkspacesStore";
import { useLearnspacesStore } from "@/shared/store/useLearnspacesStore";
import { useTheme } from "@/shared/context/useTheme";
import { Button } from "@/shared/ui/button";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import { FolderPlus } from "lucide-react";

export const Trainer: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { themeColors } = useTheme();
  const workspaces = useWorkspacesStore((s) => s.workspaces);
  const learnspaces = useLearnspacesStore((s) => s.learnspaces);
  const fetchLearnspaces = useLearnspacesStore((s) => s.fetchLearnspaces);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchLearnspaces();
  }, [fetchLearnspaces]);

  // Объединяем workspaces и learnspaces
  const allSpaces = [...workspaces, ...learnspaces];

  return (
    <>
      <TrainerSidebar>
        {allSpaces.length === 0 ? (
          <div className="min-h-screen flex items-center justify-center transition-all duration-300">
            <div className="text-center space-y-6 px-4">
              <div
                className="text-6xl mb-4"
                style={{ color: themeColors.textMuted }}
              >
                📚
              </div>
              <h2
                className="text-3xl font-bold"
                style={{ color: themeColors.text }}
              >
                Нет созданных воркспейсов
              </h2>
              <p
                className="text-lg max-w-md mx-auto"
                style={{ color: themeColors.textMuted }}
              >
                Создайте воркспейс, чтобы начать тренироваться с выбранными
                файлами и папками из вашей коллекции
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="px-6 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                style={{ backgroundColor: themeColors.primary }}
              >
                <FolderPlus className="w-5 h-5 mr-2" />
                Создать воркспейс
              </Button>
            </div>
          </div>
        ) : (
          children
        )}
      </TrainerSidebar>
      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
};
