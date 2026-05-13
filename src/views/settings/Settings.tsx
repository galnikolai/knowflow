import { SettingsSidebar } from "@/widgets";
import React, { useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ImportExportDialog } from "@/shared/components/ImportExportDialog";

export const Settings: React.FC = () => {
  const [importExportOpen, setImportExportOpen] = useState(false);

  return (
    <SettingsSidebar>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1, padding: "20px" }}>
          <h1 className="text-2xl font-semibold mb-6">Настройки</h1>

          <section className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Данные
            </h2>
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Экспортируйте заметки и карточки в JSON или Markdown, либо импортируйте
                данные из файла экспорта KnowFlow или Obsidian-совместимых Markdown-файлов.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setImportExportOpen(true)}
                >
                  <Download className="w-4 h-4" />
                  Экспорт
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setImportExportOpen(true)}
                >
                  <Upload className="w-4 h-4" />
                  Импорт
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ImportExportDialog
        open={importExportOpen}
        onClose={() => setImportExportOpen(false)}
      />
    </SettingsSidebar>
  );
};
