import { create } from "zustand";
import type { NoteNode } from "@/entities/note/Node";
import type { NoteEdge } from "@/entities/note/Edge";

interface GraphStore {
  nodes: NoteNode[];
  edges: NoteEdge[];
  addNode: (node: Omit<NoteNode, "id">) => void;
  updateNode: (id: string, update: Partial<NoteNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: NoteEdge) => void;
  removeEdge: (edge: NoteEdge) => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  addNode: (node) =>
    set((state) => ({
      nodes: [
        ...state.nodes,
        { ...node, id: Math.random().toString(36).slice(2) },
      ],
    })),
  updateNode: (id, update) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...update } : n)),
    })),
  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
    })),
  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
    })),
  removeEdge: (edge) =>
    set((state) => ({
      edges: state.edges.filter(
        (e) => !(e.source === edge.source && e.target === edge.target)
      ),
    })),
}));
