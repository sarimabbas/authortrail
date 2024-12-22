import { TreeDataItem } from "@/components/ui/tree-view";

export interface ExtendedTreeDataItem extends TreeDataItem {
  className?: string;
  badge?: number;
  expanded?: boolean;
}

export interface TreeItemContextValue {
  badge?: number;
}

export type SortType = "name" | "date";
