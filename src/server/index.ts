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
        const { repoPath, authorEmail, branch } = await req.json();

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

        const absolutePath = resolve(repoPath);

        // Validate repository path
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

        // Use a single optimized git command to get files and their latest commit dates
        const branchArg = branch ? `${branch}` : "--all";
        const filesResult = await $`git log ${branchArg} \
          --author="${authorEmail}" \
          --pretty="format:%ad%x09%H" \
          --date=short \
          --name-only \
          --diff-filter=ACMRT \
          | awk 'NF==2 {d=$1; h=$2; next} NF==1 && $1!="" {print d "\t" $1}'`
          .cwd(absolutePath)
          .quiet();

        if (filesResult.exitCode !== 0) {
          throw new Error(
            `Failed to get file list: ${filesResult.stderr.toString()}`
          );
        }

        // Process the results
        const fileMap = new Map();
        const lines = filesResult.stdout
          .toString()
          .trim()
          .split("\n")
          .filter(Boolean);

        for (const line of lines) {
          const [date, file] = line.split("\t");
          if (!fileMap.has(file)) {
            fileMap.set(file, {
              path: file,
              author: authorEmail,
              lastModified: new Date(date).toLocaleDateString(),
            });
          }
        }

        // Filter for files that still exist in HEAD
        const fileDetails = [];
        for (const [file, details] of fileMap) {
          const fileCheck = await $`git cat-file -e HEAD:"${file}"`
            .cwd(absolutePath)
            .quiet();
          if (fileCheck.exitCode === 0) {
            fileDetails.push(details);
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

    if (url.pathname === "/api/git/user-email" && req.method === "GET") {
      try {
        const emailResult = await $`git config --global user.email`.quiet();

        if (emailResult.exitCode !== 0) {
          throw new Error(emailResult.stderr.toString());
        }

        const email = emailResult.stdout.toString().trim();

        return new Response(JSON.stringify({ email }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error("Error getting git email:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to get git email",
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
