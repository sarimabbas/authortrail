import * as React from "react";
import { TreeView } from "@/components/ui/tree-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search as SearchIcon,
  ChevronDown,
  ChevronRight,
  SortAsc,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ExtendedTreeDataItem } from "../types/tree";

interface FileTreeProps {
  treeData: ExtendedTreeDataItem[];
  selectedFile: string;
  onFileSelect: (item: ExtendedTreeDataItem | undefined) => void;
  expandedIds: Set<string>;
  onExpandedChange: (ids: Set<string>) => void;
  sortBy: "name" | "date";
  onSortChange: (sort: "name" | "date") => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  treeData,
  selectedFile,
  onFileSelect,
  expandedIds,
  onExpandedChange,
  sortBy,
  onSortChange,
}) => {
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isExpanded, setIsExpanded] = React.useState(false);

  const filteredTreeData = React.useMemo(() => {
    if (!searchQuery) return treeData;

    const filterNodes = (
      nodes: ExtendedTreeDataItem[]
    ): ExtendedTreeDataItem[] => {
      return nodes
        .map((node) => ({
          ...node,
          children: node.children ? filterNodes(node.children) : undefined,
        }))
        .filter((node) => {
          const matchesSearch = node.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          return matchesSearch || (node.children && node.children.length > 0);
        });
    };

    return filterNodes(treeData);
  }, [treeData, searchQuery]);

  const handleExpandToggle = () => {
    if (isExpanded) {
      onExpandedChange(new Set());
    } else {
      const allIds = new Set<string>();
      const collectIds = (nodes: ExtendedTreeDataItem[]) => {
        nodes.forEach((node) => {
          if (node.children) {
            allIds.add(node.id);
            collectIds(node.children);
          }
        });
      };
      collectIds(treeData);
      onExpandedChange(allIds);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border border-opacity-100 p-2 flex flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-[40px]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className="h-8 w-8"
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
          {showSearch && (
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-[150px]"
            />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExpandToggle}
            className="h-8"
          >
            {isExpanded ? (
              <ChevronRight className="h-4 w-4 mr-1" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-1" />
            )}
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <SortAsc className="h-4 w-4 mr-1" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSortChange("name")}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("date")}>
                Date Modified
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <TreeView
          data={filteredTreeData}
          initialSelectedItemId={selectedFile}
          onSelectChange={onFileSelect}
          className="p-2"
          expandedIds={expandedIds}
          onExpandedChange={onExpandedChange}
        />
      </div>
    </div>
  );
};
