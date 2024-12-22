import { File, ExternalLink, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const Header = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = () => {
    try {
      setTheme(theme === "dark" ? "light" : "dark");
    } catch (error) {
      console.error("Failed to change theme:", error);
    }
  };

  return (
    <div className="border-b border-border border-opacity-100 pb-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <File className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold">AuthorTrail</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground max-w-[600px]">
            Explore your Git repository's history by author. Find and browse
            files you've contributed to, with quick access to view and edit
            them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleThemeChange}
                type="button"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle theme</p>
            </TooltipContent>
          </Tooltip>
          <a
            href="https://github.com/yourusername/authortrail"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            View on GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
