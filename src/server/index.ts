import { serve } from "bun";
import { $ } from "bun";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:8080",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Configure shell to not throw by default for better error handling
$.nothrow();

// Define the server
serve({
  async fetch(req) {
    const url = new URL(req.url);

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // New endpoint to resolve directory paths
    if (url.pathname === "/api/resolve-path" && req.method === "POST") {
      try {
        const formData = await req.formData();
        const dirName = formData.get("dirHandle");

        if (!dirName) {
          return new Response(
            JSON.stringify({
              error: "Directory name is required",
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // Get the current working directory
        const pwdResult = await $`pwd`.quiet();
        if (pwdResult.exitCode !== 0) {
          throw new Error("Failed to get current directory");
        }

        const currentDir = pwdResult.stdout.toString().trim();
        const resolvedPath = resolve(currentDir, dirName.toString());

        return new Response(JSON.stringify({ path: resolvedPath }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error("Error resolving path:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to resolve directory path",
            details: error instanceof Error ? error.message : String(error),
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
    }

    if (url.pathname === "/api/git/files" && req.method === "POST") {
      try {
        const { repoPath, authorEmail } = await req.json();

        if (!repoPath || !authorEmail) {
          return new Response(
            JSON.stringify({
              error: "Repository path and author email are required",
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // Validate repository path
        const absolutePath = resolve(repoPath);
        if (!existsSync(absolutePath)) {
          return new Response(
            JSON.stringify({
              error: "Repository path does not exist",
              details: `Path ${absolutePath} was not found`,
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // Verify if git is installed
        const gitCheck = await $`git --version`.quiet();
        if (gitCheck.exitCode !== 0) {
          return new Response(
            JSON.stringify({
              error: "Git is not installed on the system",
              details: gitCheck.stderr.toString(),
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // Verify if the path exists and is a git repository
        const repoCheck = await $`git status`.cwd(absolutePath).quiet();
        if (repoCheck.exitCode !== 0) {
          return new Response(
            JSON.stringify({
              error:
                "Invalid git repository path. Please ensure the path exists and contains a git repository.",
              details: repoCheck.stderr.toString(),
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // Get all files that have been modified by the author
        const filesResult =
          await $`git log --all --pretty=format: --author="${authorEmail}" --name-only | sort -u`
            .cwd(absolutePath)
            .quiet();

        if (filesResult.exitCode !== 0) {
          throw new Error(
            `Failed to get file list: ${filesResult.stderr.toString()}`
          );
        }

        const files = filesResult.stdout
          .toString()
          .trim()
          .split("\n")
          .filter(Boolean);
        const fileDetails = [];

        // Get blame info for each file
        for (const file of files) {
          const lastModifiedResult =
            await $`git log -1 --format="%ad" -- "${file}"`
              .cwd(absolutePath)
              .quiet();

          if (lastModifiedResult.exitCode === 0) {
            fileDetails.push({
              path: file,
              author: authorEmail,
              lastModified: new Date(
                lastModifiedResult.stdout.toString().trim()
              ).toLocaleDateString(),
            });
          }
        }

        return new Response(JSON.stringify(fileDetails), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error("Error getting authored files:", error);
        return new Response(
          JSON.stringify({
            error:
              "Failed to get file history. Please ensure git is installed and the repository path is correct.",
            details: error instanceof Error ? error.message : String(error),
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
    }

    if (url.pathname === "/api/git/content" && req.method === "GET") {
      try {
        const { repoPath, filePath } = Object.fromEntries(url.searchParams);

        if (typeof repoPath !== "string" || typeof filePath !== "string") {
          return new Response(JSON.stringify({ error: "Invalid parameters" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        }

        // Validate repository path
        const absolutePath = resolve(repoPath);
        if (!existsSync(absolutePath)) {
          return new Response(
            JSON.stringify({
              error: "Repository path does not exist",
              details: `Path ${absolutePath} was not found`,
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        const contentResult = await $`cat "${filePath}"`
          .cwd(absolutePath)
          .quiet();

        if (contentResult.exitCode !== 0) {
          return new Response(
            JSON.stringify({
              error: "Failed to read file content",
              details: contentResult.stderr.toString(),
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        return new Response(
          JSON.stringify({ content: contentResult.stdout.toString() }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      } catch (error) {
        console.error("Error getting file content:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to get file content",
            details: error instanceof Error ? error.message : String(error),
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
    }

    if (url.pathname === "/api/editor" && req.method === "POST") {
      try {
        const { filePath } = await req.json();

        // Get user's editor from git config
        const editorResult = await $`git config --global core.editor`.quiet();
        let editor = editorResult.stdout.toString().trim() || "code"; // Default to VS Code if not set

        // Remove --wait flag if it's VS Code
        if (editor.startsWith("code")) {
          editor = "code";
        }

        // Open file in editor
        const openResult = await $`${editor} "${filePath}"`.quiet();

        if (openResult.exitCode !== 0) {
          throw new Error(openResult.stderr.toString());
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error("Error opening editor:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to open editor",
            details: error instanceof Error ? error.message : String(error),
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
    }

    return new Response("404!", {
      status: 404,
      headers: corsHeaders,
    });
  },
  port: 3000,
});
