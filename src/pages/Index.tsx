import { FileTree } from "@/components/FileTree";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { javascript } from "@codemirror/lang-javascript";
import { darcula } from "@uiw/codemirror-theme-darcula";
import CodeMirror from "@uiw/react-codemirror";
import { ExternalLink, File, Search, UserRound } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExtendedTreeDataItem, SortType } from "../types/tree";
import { GitFile, getAuthoredFiles, getFileContent } from "../utils/gitUtils";
import { createFileTree, sortTreeNodes } from "../utils/treeUtils";

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
            <FileTree
              treeData={treeData}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              expandedIds={expandedIds}
              onExpandedChange={setExpandedIds}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
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
