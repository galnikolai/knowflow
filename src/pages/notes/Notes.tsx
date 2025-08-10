import { NotesSidebar } from "@/widgets";
import React from "react";

export const Notes: React.FC = () => {
  return (
    <NotesSidebar>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1, padding: "20px" }}>
          <h1>Notes</h1>
        </div>
      </div>
    </NotesSidebar>
  );
};
