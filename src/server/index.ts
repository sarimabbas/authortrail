import { serve } from "bun";
import { spawn } from "bun";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:8080",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
        const gitVersionProc = spawn(["git", "--version"]);
        await gitVersionProc.exited;
        if (gitVersionProc.exitCode !== 0) {
          return new Response(
            JSON.stringify({ error: "Git is not installed on the system" }),
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
        const gitStatusProc = spawn(["git", "status"], { cwd: repoPath });
        await gitStatusProc.exited;
        if (gitStatusProc.exitCode !== 0) {
          return new Response(
            JSON.stringify({
              error:
                "Invalid git repository path. Please ensure the path exists and contains a git repository.",
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
        const gitLogProc = spawn(
          [
            "git",
            "log",
            "--all",
            "--pretty=format:",
            `--author="${authorEmail}"`,
            "--name-only",
            "|",
            "sort",
            "-u",
          ],
          { cwd: repoPath }
        );

        const stdout = await new Response(gitLogProc.stdout).text();
        const files = stdout.trim().split("\n").filter(Boolean);
        const fileDetails = [];

        // Get blame info for each file
        for (const file of files) {
          const gitLogFileProc = spawn(
            ["git", "log", "-1", `--format="%ad"`, `-- "${file}"`],
            { cwd: repoPath }
          );

          const lastModified = await new Response(gitLogFileProc.stdout).text();
          fileDetails.push({
            path: file,
            author: authorEmail,
            lastModified: new Date(lastModified).toLocaleDateString(),
          });
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

        const catProc = spawn(["cat", filePath], { cwd: repoPath });
        const stdout = await new Response(catProc.stdout).text();

        return new Response(JSON.stringify({ content: stdout }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error("Error getting file content:", error);
        return new Response(
          JSON.stringify({ error: "Failed to get file content" }),
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
