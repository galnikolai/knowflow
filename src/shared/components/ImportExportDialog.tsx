"use client";

import React, { useRef, useState } from "react";
import { Upload, FileJson, FileText, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { useNotesStore } from "@/shared/store/useNotesStore";
import { useFlashcardsStore } from "@/shared/store/useFlashcardsStore";
import {
  exportToJson,
  exportNotesToMarkdown,
  triggerDownload,
  parseMarkdownFile,
  parseJsonExport,
} from "@/shared/lib/importExport";
import type { Flashcard } from "@/entities/card/Card";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImportExportDialog({ open, onClose }: Props) {
  const notes = useNotesStore((s) => s.notes);
  const addNote = useNotesStore((s) => s.addNote);
  const flashcards = useFlashcardsStore((s) => s.cards);
  const addCards = useFlashcardsStore((s) => s.addCards);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleExportJson = () => {
    const json = exportToJson(notes, flashcards);
    const date = new Date().toISOString().slice(0, 10);
    triggerDownload(json, `knowflow-export-${date}.json`, "application/json");
  };

  const handleExportMarkdown = () => {
    const md = exportNotesToMarkdown(notes);
    const date = new Date().toISOString().slice(0, 10);
    triggerDownload(md, `knowflow-notes-${date}.md`, "text/markdown");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();

      if (file.name.endsWith(".json")) {
        const exportData = parseJsonExport(text);
        if (!exportData) {
          setImportResult("Неверный формат JSON. Ожидается файл экспорта KnowFlow.");
          return;
        }

        let importedNotes = 0;
        let importedCards = 0;

        for (const note of exportData.notes) {
          try {
            await addNote({
              title: note.title,
              content: note.content,
              is_folder: note.is_folder,
              parent_id: null,
              node_id: note.node_id,
            });
            importedNotes++;
          } catch {
            // skip individual failures
          }
        }

        if (exportData.flashcards.length > 0) {
          const cardsToAdd: Omit<Flashcard, "id">[] = exportData.flashcards.map((c) => ({
            nodeId: c.nodeId,
            question: c.question,
            answer: c.answer,
            nextReview: Date.now(),
            interval: 1,
            repetitions: 0,
            easeFactor: 2.5,
          }));
          await addCards(cardsToAdd);
          importedCards = cardsToAdd.length;
        }

        setImportResult(
          `Импортировано: ${importedNotes} заметок, ${importedCards} карточек.`
        );
      } else if (file.name.endsWith(".md") || file.name.endsWith(".markdown")) {
        const parsed = parseMarkdownFile(text);

        let imported = 0;
        for (const { title, content } of parsed) {
          try {
            await addNote({ title, content, is_folder: false, parent_id: null, node_id: null });
            imported++;
          } catch {
            // skip
          }
        }
        setImportResult(`Импортировано ${imported} заметок из Markdown.`);
      } else {
        setImportResult("Поддерживаются файлы .json и .md");
      }
    } catch (err) {
      setImportResult(`Ошибка: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Импорт и экспорт</DialogTitle>
          <DialogDescription>
            Сохраните данные или загрузите их из файла
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Экспорт
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleExportJson}>
                <FileJson className="w-4 h-4" />
                JSON (всё)
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={handleExportMarkdown}>
                <FileText className="w-4 h-4" />
                Markdown
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              JSON включает заметки и карточки. Markdown — только текст заметок.
            </p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Импорт
            </p>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload className="w-4 h-4" />
              {importing ? "Импортирую..." : "Выбрать файл (.json, .md)"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.md,.markdown"
              className="hidden"
              onChange={handleImportFile}
            />
            <p className="text-xs text-muted-foreground">
              Поддерживаются файлы экспорта KnowFlow (.json) и Markdown (.md, Obsidian).
            </p>
            {importResult && (
              <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm">
                <span className="flex-1">{importResult}</span>
                <button
                  onClick={() => setImportResult(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
