/**
 * POST /api/generate-links
 *
 * Body: { notes: { id, title, content }[], apiKey?, provider?, model? }
 * Response: { links: { sourceId, targetId, strength, label }[] }
 *
 * Uses cosine similarity of simple word-frequency vectors for Ollama,
 * or OpenAI embeddings when provider === "openai".
 */

import type { NextApiRequest, NextApiResponse } from "next";

interface NoteInput {
  id: string;
  title: string;
  content?: string | null;
}

interface LinkResult {
  sourceId: string;
  targetId: string;
  strength: number;
  label?: string;
}

// ─── Lightweight TF-IDF-like cosine similarity (no external deps) ─────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яёa-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function buildVector(tokens: string[], vocab: string[]): number[] {
  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] ?? 0) + 1;
  return vocab.map((v) => freq[v] ?? 0);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildLocalLinks(notes: NoteInput[], threshold = 0.15): LinkResult[] {
  const stopWords = new Set([
    "the","and","for","are","but","not","you","all","can","had","her","was","one",
    "our","out","day","get","has","him","his","how","its","now","did","did","she",
    "too","use","что","это","как","так","для","при","или","они","мне","его",
    "он","на","по","из","от","до","за","но","со","то","же","да",
  ]);

  const texts = notes.map((n) =>
    tokenize(`${n.title} ${n.content ?? ""}`).filter((t) => !stopWords.has(t))
  );

  // Build vocabulary (top-200 terms by frequency across all docs)
  const globalFreq: Record<string, number> = {};
  for (const tokens of texts) {
    const unique = new Set(tokens);
    for (const t of unique) globalFreq[t] = (globalFreq[t] ?? 0) + 1;
  }
  const vocab = Object.entries(globalFreq)
    .filter(([, f]) => f >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 200)
    .map(([w]) => w);

  if (!vocab.length) return [];

  const vectors = texts.map((tokens) => buildVector(tokens, vocab));
  const links: LinkResult[] = [];

  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const strength = cosine(vectors[i], vectors[j]);
      if (strength >= threshold) {
        links.push({
          sourceId: notes[i].id,
          targetId: notes[j].id,
          strength: parseFloat(strength.toFixed(3)),
        });
      }
    }
  }

  // Return top 50 strongest links
  return links.sort((a, b) => b.strength - a.strength).slice(0, 50);
}

// ─── OpenAI embeddings (better quality) ─────────────────────────────────────

async function buildOpenAILinks(
  notes: NoteInput[],
  apiKey: string,
  model = "text-embedding-3-small",
  threshold = 0.6
): Promise<LinkResult[]> {
  const inputs = notes.map((n) =>
    `${n.title}\n${(n.content ?? "").slice(0, 2000)}`
  );

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: inputs }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message: string } }).error?.message ?? "OpenAI embeddings error");
  }

  const data = (await res.json()) as { data: { embedding: number[]; index: number }[] };
  const sorted = data.data.sort((a, b) => a.index - b.index);
  const embeddings = sorted.map((d) => d.embedding);

  const links: LinkResult[] = [];
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const strength = cosine(embeddings[i], embeddings[j]);
      if (strength >= threshold) {
        links.push({
          sourceId: notes[i].id,
          targetId: notes[j].id,
          strength: parseFloat(strength.toFixed(3)),
        });
      }
    }
  }
  return links.sort((a, b) => b.strength - a.strength).slice(0, 50);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ links: LinkResult[] } | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    notes,
    provider = "local",
    apiKey: bodyApiKey,
    model,
  } = req.body as {
    notes: NoteInput[];
    provider?: string;
    apiKey?: string;
    model?: string;
  };

  if (!Array.isArray(notes) || notes.length < 2) {
    return res.status(400).json({ error: "Нужно минимум 2 заметки" });
  }

  // Filter notes with meaningful content
  const filtered = notes.filter((n) => {
    const text = `${n.title} ${n.content ?? ""}`.trim();
    return text.length > 30;
  });

  if (filtered.length < 2) {
    return res.status(200).json({ links: [] });
  }

  try {
    const apiKey =
      bodyApiKey ||
      (provider === "openai" ? process.env.OPENAI_API_KEY : undefined);

    let links: LinkResult[];

    if (provider === "openai" && apiKey) {
      links = await buildOpenAILinks(filtered, apiKey, model);
    } else {
      links = buildLocalLinks(filtered);
    }

    return res.status(200).json({ links });
  } catch (err) {
    console.error("generate-links error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Ошибка генерации связей",
    });
  }
}
