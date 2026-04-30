import type { NextApiRequest, NextApiResponse } from "next";

function extractTitle(html: string): string {
  const og = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1];
  if (og) return og.trim();
  const tag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return (tag ?? "Статья").trim().replace(/\s*[|–—-].*$/, "").trim();
}

function extractText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  text = text
    .replace(/<\/?(h[1-6]|p|div|li|br|tr|blockquote)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, " ");

  return text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ title: string; content: string } | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.query;
  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    return res.status(400).json({ error: "Укажите корректный URL" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KnowFlow/1.0; +https://knowflow.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return res
        .status(502)
        .json({ error: `Не удалось загрузить страницу (${response.status})` });
    }

    const html = await response.text();
    const title = extractTitle(html);
    const content = extractText(html);

    if (content.length < 50) {
      return res
        .status(422)
        .json({ error: "Не удалось извлечь текст. Попробуйте другой URL." });
    }

    return res.status(200).json({ title, content });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
    return res.status(500).json({ error: msg });
  }
}
