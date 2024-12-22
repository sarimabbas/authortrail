"use client";

import React, { useState, forwardRef } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const treeVariants = cva(
  "group hover:before:opacity-100 before:absolute before:rounded-lg before:left-0 px-2 before:w-full before:opacity-0 before:bg-accent/70 before:h-[2rem] before:-z-10"
);

const selectedTreeVariants = cva(
  "before:opacity-100 before:bg-accent/70 text-accent-foreground"
);

export interface TreeDataItem {
  id: string;
  name: string;
  icon?: any;
  selectedIcon?: any;
  openIcon?: any;
  children?: TreeDataItem[];
  actions?: React.ReactNode;
  onClick?: () => void;
}

interface TreeViewProps {
  data: TreeDataItem[];
  initialSelectedItemId?: string;
  onSelectChange?: (item: TreeDataItem | undefined) => void;
  className?: string;
  expandedIds?: Set<string>;
  onExpandedChange?: (ids: Set<string>) => void;
}

export const TreeView = forwardRef<HTMLDivElement, TreeViewProps>(
  (
    {
      data,
      initialSelectedItemId,
      onSelectChange,
      className,
      expandedIds,
      onExpandedChange,
    },
    ref
  ) => {
    const [selectedId, setSelectedId] = useState<string | undefined>(
      initialSelectedItemId
    );

    const handleExpand = (itemId: string) => {
      if (!onExpandedChange) return;

      const newExpandedIds = new Set(expandedIds);
      if (newExpandedIds.has(itemId)) {
        newExpandedIds.delete(itemId);
      } else {
        newExpandedIds.add(itemId);
      }
      onExpandedChange(newExpandedIds);
    };

    const renderItem = (item: TreeDataItem) => {
      const isExpanded = expandedIds?.has(item.id);
      const hasChildren = item.children && item.children.length > 0;

      return (
        <div key={item.id}>
          <div
            className={cn(
              "flex items-center py-1 px-2 cursor-pointer hover:bg-accent rounded-sm",
              selectedId === item.id && "bg-accent",
              className
            )}
            onClick={() => {
              setSelectedId(item.id);
              onSelectChange?.(item);
            }}
          >
            {hasChildren && (
              <div
                className="mr-1 hover:bg-accent rounded-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpand(item.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}
            {!hasChildren && <div className="w-4 mr-1" />}
            {item.icon?.()}
            <span className="ml-2">{item.name}</span>
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {item.children?.map((child) => renderItem(child))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div ref={ref} className={className}>
        {data.map((item) => renderItem(item))}
      </div>
    );
  }
);

TreeView.displayName = "TreeView";
