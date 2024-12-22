import { TreeDataItem } from "@/components/ui/tree-view";

export interface ExtendedTreeDataItem extends TreeDataItem {
  className?: string;
  metadata?: {
    date?: string;
    count?: number;
  };
  expanded?: boolean;
}

export interface TreeItemContextValue {
  metadata?: {
    date?: string;
    count?: number;
  };
}

export type SortType = "name" | "date";
