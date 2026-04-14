import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export type ImportResult = {
  title: string;
  content: string;
};

// ─── Markdown / plain text ────────────────────────────────────────────────────

export async function importMarkdownOrText(): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["text/plain", "text/markdown", "text/x-markdown", "*/*"],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    throw new Error("cancelled");
  }

  const asset = result.assets[0];
  const rawText = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const name = asset.name ?? "Импорт";
  const title = name.replace(/\.(md|markdown|txt)$/i, "").trim() || "Импорт";

  return { title, content: rawText.trim() };
}

// ─── Web article (URL) ────────────────────────────────────────────────────────

function extractReadableText(html: string): string {
  // Strip scripts/styles
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Replace block-level tags with newlines
  text = text
    .replace(/<\/?(h[1-6]|p|div|li|br|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, " ");

  // Collapse whitespace while preserving paragraph breaks
  return text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTitle(html: string): string {
  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1];
  if (ogTitle) return ogTitle.trim();
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return (titleTag ?? "Статья").trim().replace(/\s*[|–—-].*$/, "").trim();
}

export async function importFromUrl(url: string): Promise<ImportResult> {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http")) {
    throw new Error("Введите корректный URL (начинается с http/https)");
  }

  const response = await fetch(trimmed, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; KnowFlow/1.0; +https://knowflow.app)",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить страницу (${response.status})`);
  }

  const html = await response.text();
  const title = extractTitle(html);
  const content = extractReadableText(html);

  if (content.length < 50) {
    throw new Error(
      "Не удалось извлечь текст со страницы. Попробуйте другой URL."
    );
  }

  return { title, content };
}

// ─── PDF (via API) ────────────────────────────────────────────────────────────

export async function importPdf(): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    throw new Error("cancelled");
  }

  const asset = result.assets[0];
  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(`${API_URL}/api/parse-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64, filename: asset.name }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.error ??
        `Ошибка парсинга PDF (${response.status}). Убедитесь, что API доступен.`
    );
  }

  const data = await response.json();
  const name = asset.name ?? "Документ";
  return {
    title: name.replace(/\.pdf$/i, "").trim() || "PDF Импорт",
    content: (data.text ?? "").trim(),
  };
}

// ─── Audio / Video transcription (via API) ─────────────────────────────────

export async function importAudioOrVideo(): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      "audio/mpeg",
      "audio/mp4",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
      "video/mp4",
      "video/quicktime",
      "video/webm",
      "*/*",
    ],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    throw new Error("cancelled");
  }

  const asset = result.assets[0];
  const fileInfo = await FileSystem.getInfoAsync(asset.uri);
  const sizeInMb = fileInfo.exists && !fileInfo.isDirectory
    ? (fileInfo.size ?? 0) / (1024 * 1024)
    : 0;

  if (sizeInMb > 25) {
    throw new Error("Файл слишком большой (максимум 25 МБ)");
  }

  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(`${API_URL}/api/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      base64,
      filename: asset.name,
      mimeType: asset.mimeType ?? "audio/mpeg",
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.error ??
        `Ошибка транскрипции (${response.status}). Убедитесь, что API доступен.`
    );
  }

  const data = await response.json();
  const name = asset.name ?? "Запись";
  return {
    title: name.replace(/\.(mp3|mp4|wav|ogg|webm|m4a|mov)$/i, "").trim() || "Транскрипция",
    content: (data.transcript ?? data.text ?? "").trim(),
  };
}
