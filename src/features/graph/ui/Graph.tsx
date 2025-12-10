"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Динамический импорт с отключенным SSR, так как react-force-graph-2d использует window
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default),
  { ssr: false }
);

// import "aframe"; // гарантируем, что AFRAME глобален
// import "aframe-extras"; // extras используют глобальный AFRAME

type NoteNode = {
  id: string;
  title: string;
  content: string;
};

type NoteLink = {
  source: string;
  target: string;
};

interface GraphData {
  nodes: NoteNode[];
  links: NoteLink[];
}

interface Props {
  data: GraphData;
}

export function KnowledgeGraph({ data }: Props) {
  const [selectedNode, setSelectedNode] = useState<NoteNode | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-[80vw] h-full overflow-hidden relative flex items-center justify-center">
        <p>Загрузка графа...</p>
      </div>
    );
  }

  return (
    <div className="w-[80vw] h-full overflow-hidden relative">
      <ForceGraph2D
        graphData={data}
        nodeLabel="title"
        nodeAutoColorBy="id"
        onNodeClick={(node) => {
          const n = node as NoteNode;
          setSelectedNode(n);
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = (node as NoteNode).title;
          const fontSize = 12 / globalScale;
          const radius = 5 / globalScale;

          // Draw the node as a thick circle
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = "indigo";
          ctx.fill();
          ctx.closePath();

          // Draw the label below the node
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.fillStyle = "black";
          ctx.textAlign = "center";
          ctx.textBaseline = "top"; // Position the text below the node
          ctx.fillText(label, node.x!, node.y! + radius + 2); // Adjust position below the circle
        }}
      />

      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="bg-gray-100">
          {" "}
          {/* Ensure light gray background for content */}
          <DialogHeader>
            <DialogTitle>{selectedNode?.title}</DialogTitle>
          </DialogHeader>
          <p>{selectedNode?.content}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
