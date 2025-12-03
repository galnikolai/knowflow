import { SettingsSidebar } from "@/widgets";
import React from "react";

export const Settings: React.FC = () => {
  return (
    <SettingsSidebar>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1, padding: "20px" }}>
          <h1>Settings</h1>
        </div>
      </div>
    </SettingsSidebar>
  );
};
