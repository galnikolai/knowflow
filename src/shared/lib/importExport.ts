import type { Note } from "@/shared/api/notes";
import type { Flashcard } from "@/entities/card/Card";

// ─── Export ─────────────────────────────────────────────────────────────────

export interface ExportData {
  version: 1;
  exportedAt: string;
  notes: Note[];
  flashcards: Flashcard[];
}

export function exportToJson(notes: Note[], flashcards: Flashcard[]): string {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    notes,
    flashcards,
  };
  return JSON.stringify(data, null, 2);
}

export function exportNotesToMarkdown(notes: Note[]): string {
  const fileNotes = notes.filter((n) => !n.is_folder);

  const buildPath = (note: Note): string => {
    const ancestors: string[] = [];
    let current: Note | undefined = note;
    while (current?.parent_id) {
      const parent = notes.find((n) => n.id === current!.parent_id);
      if (!parent) break;
      ancestors.unshift(parent.title);
      current = parent;
    }
    return ancestors.length ? `${ancestors.join(" / ")} / ${note.title}` : note.title;
  };

  return fileNotes
    .map((note) => {
      const path = buildPath(note);
      const lines = [
        `# ${path}`,
        "",
        `> Создано: ${new Date(note.created_at).toLocaleDateString("ru-RU")}  `,
        `> Изменено: ${new Date(note.updated_at).toLocaleDateString("ru-RU")}`,
        "",
        note.content ?? "",
      ];
      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}

export function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Import ──────────────────────────────────────────────────────────────────

export interface ParsedMarkdownNote {
  title: string;
  content: string;
}

/**
 * Parses a single Markdown file (or a multi-document export separated by `---`)
 * into an array of notes ready to be imported.
 */
export function parseMarkdownFile(text: string): ParsedMarkdownNote[] {
  const sections = text.split(/^---$/m);
  return sections
    .map((section) => {
      const trimmed = section.trim();
      if (!trimmed) return null;

      const lines = trimmed.split("\n");
      let title = "Без названия";
      let contentStart = 0;

      if (lines[0].startsWith("# ")) {
        title = lines[0].replace(/^# /, "").trim();
        contentStart = 1;
      }

      // Skip metadata blockquotes (lines starting with >)
      while (contentStart < lines.length && lines[contentStart].startsWith(">")) {
        contentStart++;
      }

      const content = lines.slice(contentStart).join("\n").trim();
      return { title, content };
    })
    .filter((n): n is ParsedMarkdownNote => n !== null);
}

export function parseJsonExport(text: string): ExportData | null {
  try {
    const data = JSON.parse(text) as unknown;
    if (
      typeof data === "object" &&
      data !== null &&
      "version" in data &&
      (data as ExportData).version === 1
    ) {
      return data as ExportData;
    }
    return null;
  } catch {
    return null;
  }
}
