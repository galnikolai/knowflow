import { KnowledgeGraph } from "@/features";
import { GraphSidebar } from "@/widgets";
import React from "react";

const demoGraph = {
  nodes: Array.from({ length: 50 }, (_, i) => ({
    id: `${i + 1}`,
    title: `Node ${i + 1}`,
    content: `Content for Node ${i + 1}`,
  })),
  links: Array.from({ length: 100 }, () => ({
    source: `${Math.ceil(Math.random() * 50)}`,
    target: `${Math.ceil(Math.random() * 50)}`,
  })).filter((link) => link.source !== link.target),
};

export const Graph: React.FC = () => {
  return (
    <GraphSidebar>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1, padding: "20px" }}>
          {/* <h1>Graph</h1> */}
          <KnowledgeGraph data={demoGraph} />
        </div>
      </div>
    </GraphSidebar>
  );
};

export default Graph;
