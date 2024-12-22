import * as React from "react";
import { TreeItemContext } from "../contexts/TreeItemContext";
import { TreeItemContextValue } from "../types/tree";
import { FolderIcon, getIconForFile } from "../utils/fileIcons";

export const FileTreeIcon = ({ filename }: { filename: string }) => {
  const { badge } = (React.useContext(TreeItemContext) ||
    {}) as TreeItemContextValue;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-5 h-5">
        {!filename.includes(".") ? <FolderIcon /> : getIconForFile(filename)}
      </div>
      {badge !== undefined && (
        <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-muted">
          {badge}
        </span>
      )}
    </div>
  );
};
