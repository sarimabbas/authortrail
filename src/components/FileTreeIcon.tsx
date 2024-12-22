import * as React from "react";
import { FolderIcon, getIconForFile } from "../utils/fileIcons";

export const FileTreeIcon = ({ filename }: { filename: string }) => {
  return (
    <div className="flex items-center justify-center w-5 h-5">
      {!filename.includes(".") ? <FolderIcon /> : getIconForFile(filename)}
    </div>
  );
};
