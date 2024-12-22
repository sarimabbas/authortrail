import { serve } from "bun";
import { $ } from "bun";

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
        const repoCheck = await $`git status`.cwd(repoPath).quiet();
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
            .cwd(repoPath)
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
              .cwd(repoPath)
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

        const contentResult = await $`cat "${filePath}"`.cwd(repoPath).quiet();

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

    return new Response("404!", {
      status: 404,
      headers: corsHeaders,
    });
  },
  port: 3000,
});
