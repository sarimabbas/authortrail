import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { darcula } from "@uiw/codemirror-theme-darcula";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GitFile, getAuthoredFiles, getFileContent } from "../utils/gitUtils";
import { TreeView, TreeDataItem } from "@/components/ui/tree-view";
import {
  File,
  Folder,
  SortAsc,
  ExternalLink,
  UserRound,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const createFileTree = (files: GitFile[]): TreeDataItem[] => {
  const buildNode = (
    path: string[],
    isFile: boolean,
    file?: GitFile
  ): TreeDataItem => {
    return {
      id: path.join("/"),
      name: isFile
        ? `${path[path.length - 1]} (${file?.lastModified})`
        : path[path.length - 1],
      icon: isFile ? File : Folder,
      children: isFile ? undefined : [],
    };
  };

  const root: TreeDataItem[] = [];
  const nodeMap = new Map<string, TreeDataItem>();

  files.forEach((file) => {
    const parts = file.path.split("/");

    parts.forEach((_, index) => {
      const currentPath = parts.slice(0, index + 1);
      const currentPathStr = currentPath.join("/");
      const isFile = index === parts.length - 1;

      if (!nodeMap.has(currentPathStr)) {
        const node = buildNode(currentPath, isFile, isFile ? file : undefined);
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

type SortType = "name" | "date";

// Add a function to sort TreeDataItem nodes
const sortTreeNodes = (
  nodes: TreeDataItem[],
  sortBy: SortType
): TreeDataItem[] => {
  return [...nodes]
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else {
        // Extract dates from the name for files (assumes format "filename (date)")
        const aDate = a.children ? "" : a.name.match(/\((.*?)\)$/)?.[1] || "";
        const bDate = b.children ? "" : b.name.match(/\((.*?)\)$/)?.[1] || "";
        return bDate.localeCompare(aDate); // Newest first
      }
    })
    .map((node) => ({
      ...node,
      children: node.children
        ? sortTreeNodes(node.children, sortBy)
        : undefined,
    }));
};

const Index = () => {
  const [repoPath, setRepoPath] = useState(
    () => localStorage.getItem("repoPath") || ""
  );
  const [authorEmail, setAuthorEmail] = useState(
    () => localStorage.getItem("authorEmail") || ""
  );
  const [files, setFiles] = useState<GitFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileContent, setFileContent] = useState(
    "// Select a file to view its content"
  );
  const [sortBy, setSortBy] = useState<SortType>("name");
  const [treeData, setTreeData] = useState<TreeDataItem[]>([]);

  useEffect(() => {
    localStorage.setItem("repoPath", repoPath);
  }, [repoPath]);

  useEffect(() => {
    localStorage.setItem("authorEmail", authorEmail);
  }, [authorEmail]);

  useEffect(() => {
    const tree = createFileTree(files);
    setTreeData(sortTreeNodes(tree, sortBy));
  }, [files, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const authoredFiles = await getAuthoredFiles(repoPath, authorEmail);
      setFiles(authoredFiles);
      toast.success(`Found ${authoredFiles.length} files`);
    } catch (error) {
      toast.error("Failed to get file history");
      console.error(error);
    }
  };

  const handleFileSelect = async (item: TreeDataItem | undefined) => {
    if (!item || item.children) return; // Skip if no item selected or if it's a directory

    try {
      setSelectedFile(item.id);
      const content = await getFileContent(repoPath, item.id);
      setFileContent(content);
    } catch (error) {
      toast.error("Failed to load file content");
      console.error(error);
    }
  };

  const handleOpenInEditor = async () => {
    if (!selectedFile || !repoPath) return;

    try {
      const absolutePath = `${repoPath}/${selectedFile}`;
      const response = await fetch("http://localhost:3000/api/editor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath: absolutePath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to open editor");
      }

      toast.success("Opening file in editor");
    } catch (error) {
      toast.error("Failed to open editor");
      console.error(error);
    }
  };

  const handleGetGitEmail = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/git/user-email");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to get git email");
      }

      const { email } = await response.json();
      setAuthorEmail(email);
      toast.success("Git email loaded");
    } catch (error) {
      toast.error("Failed to get git email");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Git File Explorer</h2>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm text-muted-foreground">
                  Repository Path
                </label>
                <Input
                  placeholder="Enter repository path (e.g., /path/to/repo)"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">
                    Author Email
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleGetGitEmail}
                        className="h-6"
                      >
                        <UserRound className="h-4 w-4 mr-1" />
                        Use Git Email
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Load email from git config</TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  placeholder="Enter author email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search Files
              </Button>
            </div>
          </div>
        </form>
      </div>

      <div className="flex flex-1">
        <div className="w-1/3 bg-sidebar border-r border-border overflow-auto">
          <div className="p-2 border-b border-border flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Sort by
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("date")}>
                  Date Modified
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <TreeView
            data={treeData}
            initialSelectedItemId={selectedFile}
            onSelectChange={handleFileSelect}
            className="py-2"
          />
        </div>

        <div className="w-2/3 bg-background p-4">
          <div className="flex justify-end mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInEditor}
              disabled={!selectedFile}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Editor
            </Button>
          </div>
          <CodeMirror
            value={fileContent}
            height="100%"
            theme={darcula}
            extensions={[javascript()]}
            className="h-[calc(100vh-8rem)]"
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
