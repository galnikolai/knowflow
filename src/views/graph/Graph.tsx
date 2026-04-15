"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { GraphSidebar } from "@/widgets";
import { useNotesStore } from "@/shared/store/useNotesStore";
import { useFlashcardsStore } from "@/shared/store/useFlashcardsStore";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import type { Note } from "@/shared/api/notes";
import { ROUTES } from "@/shared/config/routes";
import {
  Search,
  X,
  ExternalLink,
  Folder,
  FileText,
  Brain,
  Info,
} from "lucide-react";

// ─── dynamic import (no SSR) ────────────────────────────────────────────────

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((m) => m.default),
  { ssr: false }
);

// ─── types ──────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  title: string;
  is_folder: boolean;
  content: string | null;
  cardCount: number;
  dueCount: number;
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

// ─── color helpers ───────────────────────────────────────────────────────────

function nodeColor(node: GraphNode, selected: string | null, isDark: boolean): string {
  if (selected === node.id) return "#6366f1";
  if (node.is_folder) return isDark ? "#d4a054" : "#b8832a";
  if (node.dueCount > 0) return isDark ? "#f59e0b" : "#d97706";
  return isDark ? "#8b8bff" : "#6b6bd4";
}

function isDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

// ─── node info panel ─────────────────────────────────────────────────────────

interface NodePanelProps {
  node: GraphNode;
  onOpen: () => void;
  onClose: () => void;
}

function NodePanel({ node, onOpen, onClose }: NodePanelProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-10 animate-in slide-in-from-bottom-2 duration-200">
      <div className="rounded-xl bg-card border border-border shadow-lg p-4 flex items-start gap-3">
        <div
          className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            node.is_folder
              ? "bg-amber-100 dark:bg-amber-900/30"
              : "bg-primary/10"
          }`}
        >
          {node.is_folder ? (
            <Folder size={15} className="text-amber-600 dark:text-amber-400" />
          ) : (
            <FileText size={15} className="text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{node.title}</p>
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            {node.cardCount > 0 && (
              <span className="flex items-center gap-1">
                <Brain size={11} />
                {node.cardCount} карточек
              </span>
            )}
            {node.dueCount > 0 && (
              <span className="text-amber-500 font-medium">
                {node.dueCount} к повторению
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button size="sm" onClick={onOpen} className="gap-1.5 h-7 px-2.5 text-xs">
            <ExternalLink size={12} />
            Открыть
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
            <X size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── legend ──────────────────────────────────────────────────────────────────

function Legend({ isDark }: { isDark: boolean }) {
  return (
    <div className="absolute top-4 right-4 z-10 rounded-xl bg-card/80 backdrop-blur border border-border p-3 flex flex-col gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: isDark ? "#d4a054" : "#b8832a" }} />
        Папка
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: isDark ? "#8b8bff" : "#6b6bd4" }} />
        Заметка
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: isDark ? "#f59e0b" : "#d97706" }} />
        Есть к повторению
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-indigo-500" style={{ background: isDark ? "#6366f1" : "#6366f1" }} />
        Выбранный узел
      </div>
    </div>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────

export const Graph: React.FC = () => {
  const router = useRouter();
  const notes = useNotesStore((s) => s.notes);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const cards = useFlashcardsStore((s) => s.cards);
  const fetchCards = useFlashcardsStore((s) => s.fetchCards);

  const [isMounted, setIsMounted] = useState(false);
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<{ centerAt?: (x: number, y: number, ms: number) => void; zoom?: (k: number, ms: number) => void } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setDark(isDarkMode());
    const themeObs = new MutationObserver(() => setDark(isDarkMode()));
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const el = containerRef.current;
    if (el) {
      const ro = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
      });
      ro.observe(el);
      // initial size
      setCanvasSize({ w: Math.floor(el.clientWidth), h: Math.floor(el.clientHeight) });
      return () => { themeObs.disconnect(); ro.disconnect(); };
    }
    return () => themeObs.disconnect();
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchCards();
  }, [fetchNotes, fetchCards]);

  // Build graph data from notes
  const { nodes, links } = useMemo(() => {
    const idSet = new Set(notes.map((n) => n.id));

    const nodes: GraphNode[] = notes.map((n) => {
      const noteCards = cards.filter((c) => c.nodeId === n.id);
      return {
        id: n.id,
        title: n.title || "Без названия",
        is_folder: n.is_folder,
        content: n.content,
        cardCount: noteCards.length,
        dueCount: noteCards.filter((c) => c.nextReview <= Date.now()).length,
      };
    });

    const links: GraphLink[] = notes
      .filter((n) => n.parent_id && idSet.has(n.parent_id))
      .map((n) => ({ source: n.parent_id!, target: n.id }));

    return { nodes, links };
  }, [notes, cards]);

  // Search filtering — highlight matched nodes
  const matchIds = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return new Set(nodes.filter((n) => n.title.toLowerCase().includes(q)).map((n) => n.id));
  }, [search, nodes]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId]
  );

  const handleNodeClick = useCallback(
    (node: object) => {
      const n = node as GraphNode;
      if (selectedId === n.id) {
        router.push(`${ROUTES.COLLECTION}?note=${n.id}`);
      } else {
        setSelectedId(n.id);
      }
    },
    [selectedId, router]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleOpenNote = useCallback(() => {
    if (selectedId) router.push(`${ROUTES.COLLECTION}?note=${selectedId}`);
  }, [selectedId, router]);

  // Node paint function
  const paintNode = useCallback(
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode & { x?: number; y?: number };
      const x = n.x ?? 0;
      const y = n.y ?? 0;

      const isSel = selectedId === n.id;
      const isSearchMatch = matchIds ? matchIds.has(n.id) : false;
      const isSearchMiss = matchIds ? !matchIds.has(n.id) : false;

      const baseR = n.is_folder ? 7 : 5;
      const r = isSel ? baseR + 2.5 : baseR;
      const color = nodeColor(n, selectedId, dark);

      // Glow for selected
      if (isSel) {
        ctx.beginPath();
        ctx.arc(x, y, r + 8, 0, Math.PI * 2);
        ctx.fillStyle = `${color}22`;
        ctx.fill();
      }

      // Outer ring for search match
      if (isSearchMatch) {
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Main circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = dark ? "#1e1e26" : "#ffffff";
      ctx.globalAlpha = isSearchMiss ? 0.25 : 1;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isSel ? 2 : 1.25;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = isSearchMiss ? 0.15 : isSel ? 1 : 0.65;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Label
      if (globalScale > 0.8 || isSel || isSearchMatch) {
        const label =
          n.title.length > (isSel ? 30 : 20)
            ? `${n.title.slice(0, isSel ? 28 : 18)}…`
            : n.title;
        const fs = Math.max(8, 11 / globalScale);
        ctx.font = `${isSel ? "600 " : ""}${fs}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const textY = y + r + 4 / globalScale;

        // Background pill
        const tw = ctx.measureText(label).width;
        const pad = 3;
        ctx.fillStyle = dark ? "rgba(10,10,12,0.75)" : "rgba(255,255,255,0.85)";
        ctx.globalAlpha = isSearchMiss ? 0.3 : 0.95;
        ctx.beginPath();
        ctx.roundRect(x - tw / 2 - pad, textY - 1, tw + pad * 2, fs + 4, 3);
        ctx.fill();

        ctx.fillStyle = isSel
          ? dark ? "#ececf1" : "#12121a"
          : dark ? "#9898a4" : "#5a5a6b";
        ctx.globalAlpha = isSearchMiss ? 0.2 : 1;
        ctx.fillText(label, x, textY);
        ctx.globalAlpha = 1;
      }
    },
    [selectedId, matchIds, dark]
  );

  const bgColor = dark ? "#0a0a0c" : "#f5f5f8";
  const linkColor = dark ? "rgba(60,60,75,0.6)" : "rgba(200,200,215,0.8)";

  return (
    <GraphSidebar>
      <div ref={containerRef} className="flex flex-col h-full overflow-hidden relative bg-background">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8 h-8 w-52 text-sm bg-card/90 backdrop-blur border-border"
              placeholder="Поиск узлов…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 bg-card/90 backdrop-blur"
            onClick={() => setShowLegend((v) => !v)}
          >
            <Info size={14} />
          </Button>
        </div>

        {/* Stats */}
        <div className="absolute top-4 right-48 z-10 flex items-center gap-3 text-xs text-muted-foreground bg-card/80 backdrop-blur border border-border rounded-lg px-3 py-1.5">
          <span>{notes.length} узлов</span>
          <span className="opacity-40">·</span>
          <span>{links.length} связей</span>
          {matchIds && (
            <>
              <span className="opacity-40">·</span>
              <span className="text-primary font-medium">{matchIds.size} найдено</span>
            </>
          )}
        </div>

        {showLegend && <Legend isDark={dark} />}

        {/* Empty state */}
        {notes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground z-10">
            <FileText size={40} className="opacity-30" />
            <p className="text-sm">Нет заметок для отображения</p>
            <Button size="sm" onClick={() => router.push(ROUTES.COLLECTION)}>
              Перейти в Коллекцию
            </Button>
          </div>
        )}

        {/* Graph */}
        {isMounted && notes.length > 0 && canvasSize.w > 0 && (
          <ForceGraph2D
            ref={graphRef as React.MutableRefObject<null>}
            width={canvasSize.w}
            height={canvasSize.h}
            graphData={{ nodes: nodes as unknown[], links: links as unknown[] }}
            backgroundColor={bgColor}
            linkColor={() => linkColor}
            linkWidth={1}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            nodeCanvasObject={paintNode as (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => void}
            nodeCanvasObjectMode={() => "replace"}
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBackgroundClick}
            nodeLabel={(n) => (n as GraphNode).title}
            cooldownTicks={120}
            d3AlphaDecay={0.028}
            d3VelocityDecay={0.4}
            warmupTicks={50}
          />
        )}

        {/* Node panel */}
        {selectedNode && (
          <NodePanel
            node={selectedNode}
            onOpen={handleOpenNote}
            onClose={() => setSelectedId(null)}
          />
        )}

        {/* Hint */}
        {!selectedNode && notes.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-60">
            Клик — выбрать · двойной клик — открыть заметку
          </div>
        )}
      </div>
    </GraphSidebar>
  );
};

export default Graph;
