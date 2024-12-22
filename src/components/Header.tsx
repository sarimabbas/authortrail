import { File, ExternalLink } from "lucide-react";

export const Header = () => (
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
