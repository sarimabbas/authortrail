import { useState, useEffect, useMemo } from "react";
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
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Search as SearchIcon } from "lucide-react";
import { getIconForFile, FolderIcon } from "../utils/fileIcons";

interface ExtendedTreeDataItem extends TreeDataItem {
  className?: string;
}

const createFileTree = (files: GitFile[]): ExtendedTreeDataItem[] => {
  const buildNode = (
    path: string[],
    isFile: boolean,
    file?: GitFile
  ): ExtendedTreeDataItem => {
    const fileName = path[path.length - 1];
    return {
      id: path.join("/"),
      name: isFile ? `${fileName} (${file?.lastModified})` : fileName,
      icon: () => <FileTreeIcon filename={fileName} />,
      children: isFile ? undefined : [],
      className: "flex items-center gap-2 py-1",
    };
  };

  const root: ExtendedTreeDataItem[] = [];
  const nodeMap = new Map<string, ExtendedTreeDataItem>();

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
  nodes: ExtendedTreeDataItem[],
  sortBy: SortType
): ExtendedTreeDataItem[] => {
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

const EmptyState = () => (
  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
    <File className="h-16 w-16 mb-4 opacity-20" />
    <h3 className="text-lg font-medium mb-2">No file selected</h3>
    <p className="text-sm text-center max-w-[300px]">
      Search for files using the form above, then select a file from the tree to
      view its contents
    </p>
  </div>
);

const Header = () => (
  <div className="border-b border-border/50 pb-6">
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <File className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Git File Trailblazer</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground max-w-[600px]">
          Explore your Git repository's history by author. Find and browse files
          you've contributed to, with quick access to view and edit them.
        </p>
      </div>
      <a
        href="https://github.com/yourusername/git-file-trailblazer"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        View on GitHub
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  </div>
);

const FileTreeIcon = ({ filename }: { filename: string }) => {
  // Return folder icon if no extension (directory)
  if (!filename.includes(".")) {
    return (
      <div className="flex items-center justify-center w-5 h-5">
        <FolderIcon />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-5 h-5">
      {getIconForFile(filename)}
    </div>
  );
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
  const [treeData, setTreeData] = useState<ExtendedTreeDataItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

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

  const handleFileSelect = async (item: ExtendedTreeDataItem | undefined) => {
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

  const filteredTreeData = useMemo(() => {
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

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <div className="border-b border-border/50 bg-background">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <Header />
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
                      <TooltipContent>
                        Load email from git config
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    placeholder="Enter author email"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Search Files
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel
          defaultSize={25}
          minSize={20}
          maxSize={40}
          className="bg-background"
        >
          {files.length > 0 ? (
            <>
              <div className="border-b border-border/50 p-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {showSearch && (
                    <Input
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 w-[200px]"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSearch(!showSearch)}
                    className="h-8"
                  >
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                </div>
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
              <div className="overflow-auto h-[calc(100vh-12rem)]">
                <TreeView
                  data={filteredTreeData}
                  initialSelectedItemId={selectedFile}
                  onSelectChange={handleFileSelect}
                  className="p-2"
                />
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No files found yet. Start by entering a repository path and author
              email.
            </div>
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={75} className="bg-background">
          <div className="h-full">
            {files.length > 0 ? (
              <>
                {selectedFile && (
                  <div className="border-b border-border/50 p-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInEditor}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Editor
                    </Button>
                  </div>
                )}
                <div className="relative h-[calc(100vh-12rem)]">
                  {selectedFile ? (
                    <CodeMirror
                      value={fileContent}
                      height="100%"
                      theme={darcula}
                      extensions={[javascript()]}
                      className="h-full"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                      Select a file from the tree to view its contents
                    </div>
                  )}
                </div>
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
