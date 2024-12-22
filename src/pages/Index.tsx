import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { darcula } from "@uiw/codemirror-theme-darcula";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GitFile, getAuthoredFiles, getFileContent } from "../utils/gitUtils";

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

  useEffect(() => {
    localStorage.setItem("repoPath", repoPath);
  }, [repoPath]);

  useEffect(() => {
    localStorage.setItem("authorEmail", authorEmail);
  }, [authorEmail]);

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

  const handleFileSelect = async (filePath: string) => {
    try {
      setSelectedFile(filePath);
      const content = await getFileContent(repoPath, filePath);
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
        <div className="w-1/3 bg-sidebar p-4 border-r border-border overflow-auto">
          <h2 className="text-xl font-bold mb-4">Files</h2>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.path}
                className={`p-2 hover:bg-accent rounded-md cursor-pointer ${
                  selectedFile === file.path ? "bg-accent" : ""
                }`}
                onClick={() => handleFileSelect(file.path)}
              >
                <div className="font-medium">{file.path}</div>
                <div className="text-sm text-muted-foreground">
                  Last modified: {file.lastModified}
                </div>
              </div>
            ))}
          </div>
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
