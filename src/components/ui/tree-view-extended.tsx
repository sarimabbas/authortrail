import { TreeView as BaseTreeView, TreeDataItem } from "./tree-view";
import { forwardRef } from "react";

interface TreeViewExtendedProps
  extends React.ComponentProps<typeof BaseTreeView> {
  expandedIds?: Set<string>;
  onExpandedChange?: (ids: Set<string>) => void;
}

export const TreeViewExtended = forwardRef<
  HTMLDivElement,
  TreeViewExtendedProps
>(({ expandedIds, onExpandedChange, ...props }, ref) => {
  return <BaseTreeView ref={ref} {...props} />;
});

TreeViewExtended.displayName = "TreeViewExtended";
