import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { darcula } from '@uiw/codemirror-theme-darcula';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GitFile, getAuthoredFiles } from '../utils/gitUtils';
import { FolderOpen } from 'lucide-react';

const Index = () => {
  const [repoPath, setRepoPath] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [files, setFiles] = useState<GitFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState('// Select a file to view its content');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const authoredFiles = await getAuthoredFiles(repoPath, authorEmail);
      setFiles(authoredFiles);
      toast.success(`Found ${authoredFiles.length} files`);
    } catch (error) {
      toast.error('Failed to get file history');
      console.error(error);
    }
  };

  const handleDirectorySelect = async () => {
    try {
      // @ts-ignore - showDirectoryPicker is not in TypeScript's DOM types yet
      const dirHandle = await window.showDirectoryPicker();
      setRepoPath(dirHandle.name);
      toast.success('Directory selected');
    } catch (error) {
      toast.error('Failed to select directory');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Repository path"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDirectorySelect}
              className="flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              Browse
            </Button>
          </div>
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
        {/* Left side - File Tree */}
        <div className="w-1/3 bg-sidebar p-4 border-r border-border overflow-auto">
          <h2 className="text-xl font-bold mb-4">Files</h2>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.path}
                className="p-2 hover:bg-accent rounded-md cursor-pointer"
                onClick={() => setSelectedFile(file.path)}
              >
                <div className="font-medium">{file.path}</div>
                <div className="text-sm text-muted-foreground">
                  Last modified: {file.lastModified}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Code Preview */}
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