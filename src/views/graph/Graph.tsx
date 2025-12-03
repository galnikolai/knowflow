import React, { useState } from "react";
import { KnowledgeGraph } from "@/features";
import { GraphSidebar } from "@/widgets";
import { useGraphStore } from "@/shared/store/useGraphStore";

export const Graph: React.FC = () => {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const addNode = useGraphStore((s) => s.addNode);
  // const updateNode = useGraphStore((s) => s.updateNode);
  // const removeNode = useGraphStore((s) => s.removeNode);
  // const addEdge = useGraphStore((s) => s.addEdge);
  // const removeEdge = useGraphStore((s) => s.removeEdge);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addNode({ title, content });
    setTitle("");
    setContent("");
  };

  return (
    <GraphSidebar>
      <div className="flex">
        <div className="p-8 flex-1">
          <h1 className="text-2xl font-bold mb-4">Граф знаний</h1>
          <form onSubmit={handleAddNode} className="flex gap-2 mb-6">
            <input
              className="input input-bordered"
              placeholder="Название узла"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="input input-bordered"
              placeholder="Описание/контент"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Добавить
            </button>
          </form>
          <KnowledgeGraph data={{ nodes, links: edges }} />
        </div>
      </div>
    </GraphSidebar>
  );
};

export default Graph;
