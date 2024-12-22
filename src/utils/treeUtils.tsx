import { ExtendedTreeDataItem } from "../types/tree";
import { GitFile } from "./gitUtils";
import { FileTreeIcon } from "../components/FileTreeIcon";
import { Badge } from "@/components/ui/badge";

export const createFileTree = (files: GitFile[]): ExtendedTreeDataItem[] => {
  const root: ExtendedTreeDataItem[] = [];
  const nodeMap = new Map<string, ExtendedTreeDataItem>();
  const folderCounts = new Map<string, number>();

  files.forEach((file) => {
    const parts = file.path.split("/");
    parts.slice(0, -1).forEach((_, index) => {
      const folderPath = parts.slice(0, index + 1).join("/");
      folderCounts.set(folderPath, (folderCounts.get(folderPath) || 0) + 1);
    });
  });

  files.forEach((file) => {
    const parts = file.path.split("/");
    parts.forEach((_, index) => {
      const currentPath = parts.slice(0, index + 1);
      const currentPathStr = currentPath.join("/");
      const isFile = index === parts.length - 1;

      if (!nodeMap.has(currentPathStr)) {
        const childCount = folderCounts.get(currentPathStr);
        const node = buildNode(
          currentPath,
          isFile,
          isFile ? file : undefined,
          childCount
        );
        nodeMap.set(currentPathStr, node);

        if (index === 0) {
          root.push(node);
        } else {
          const parentPath = parts.slice(0, index).join("/");
          const parent = nodeMap.get(parentPath);
          parent?.children?.push(node);
        }
      }
    });
  });

  return root;
};

const buildNode = (
  path: string[],
  isFile: boolean,
  file?: GitFile,
  childCount?: number
): ExtendedTreeDataItem => {
  const fileName = path[path.length - 1];
  const displayName = fileName;

  return {
    id: path.join("/"),
    name: displayName,
    icon: () => <FileTreeIcon filename={fileName} />,
    children: isFile ? undefined : [],
    className: "flex items-center gap-2 py-1",
    metadata: isFile
      ? {
          date: file?.lastModified,
          count: undefined,
        }
      : {
          date: undefined,
          count: childCount,
        },
  };
};

export const sortTreeNodes = (
  nodes: ExtendedTreeDataItem[],
  sortBy: "name" | "date"
): ExtendedTreeDataItem[] => {
  return [...nodes]
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else {
        const aDate = a.metadata?.date || "";
        const bDate = b.metadata?.date || "";
        return bDate.localeCompare(aDate);
      }
    })
    .map((node) => ({
      ...node,
      children: node.children
        ? sortTreeNodes(node.children, sortBy)
        : undefined,
    }));
};
