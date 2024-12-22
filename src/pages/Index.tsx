import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { darcula } from "@uiw/codemirror-theme-darcula";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GitFile, getAuthoredFiles, getFileContent } from "../utils/gitUtils";
import { TreeView, TreeDataItem } from "@/components/ui/tree-view";
import { File, Folder } from "lucide-react";

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
  const [treeData, setTreeData] = useState<TreeDataItem[]>([]);

  useEffect(() => {
    localStorage.setItem("repoPath", repoPath);
  }, [repoPath]);

  useEffect(() => {
    localStorage.setItem("authorEmail", authorEmail);
  }, [authorEmail]);

  useEffect(() => {
    setTreeData(createFileTree(files));
  }, [files]);

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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <Input
            placeholder="Repository path (e.g., /path/to/repo)"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Author email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Get Files</Button>
        </form>
      </div>

      <div className="flex flex-1">
        <div className="w-1/3 bg-sidebar border-r border-border overflow-auto">
          <TreeView
            data={treeData}
            initialSelectedItemId={selectedFile}
            onSelectChange={handleFileSelect}
            className="py-2"
          />
        </div>

        <div className="w-2/3 bg-background p-4">
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
