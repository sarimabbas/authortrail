import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/git/files', async (req, res) => {
  try {
    const { repoPath, authorEmail } = req.body;
    
    if (!repoPath || !authorEmail) {
      return res.status(400).json({ 
        error: 'Repository path and author email are required' 
      });
    }

    // First verify if git is installed
    try {
      await execAsync('git --version');
    } catch (error) {
      console.error('Git is not installed:', error);
      return res.status(500).json({ 
        error: 'Git is not installed on the system' 
      });
    }

    // Verify if the path exists and is a git repository
    try {
      await execAsync('git status', { cwd: repoPath });
    } catch (error) {
      console.error('Invalid git repository:', error);
      return res.status(400).json({ 
        error: 'Invalid git repository path. Please ensure the path exists and contains a git repository.' 
      });
    }

    // Get all files that have been modified by the author
    const { stdout } = await execAsync(
      `git log --all --pretty=format: --author="${authorEmail}" --name-only | sort -u`,
      { 
        cwd: repoPath,
        // Explicitly set shell to true for Windows compatibility
        shell: true
      }
    );

    const files = stdout.trim().split('\n').filter(Boolean);
    const fileDetails = [];
    
    // Get blame info for each file
    for (const file of files) {
      try {
        const { stdout: lastModified } = await execAsync(
          `git log -1 --format="%ad" -- "${file}"`,
          { 
            cwd: repoPath,
            shell: true
          }
        );

        fileDetails.push({
          path: file,
          author: authorEmail,
          lastModified: new Date(lastModified).toLocaleDateString(),
        });
      } catch (error) {
        console.error(`Error getting details for file ${file}:`, error);
        // Continue with other files even if one fails
      }
    }

    res.json(fileDetails);
  } catch (error) {
    console.error('Error getting authored files:', error);
    res.status(500).json({ 
      error: 'Failed to get file history. Please ensure git is installed and the repository path is correct.' 
    });
  }
});

app.get('/api/git/content', async (req, res) => {
  try {
    const { repoPath, filePath } = req.query;
    
    if (typeof repoPath !== 'string' || typeof filePath !== 'string') {
      res.status(400).json({ error: 'Invalid parameters' });
      return;
    }

    const { stdout } = await execAsync(
      `cat "${filePath}"`,
      { 
        cwd: repoPath,
        shell: true
      }
    );

    res.json({ content: stdout });
  } catch (error) {
    console.error('Error getting file content:', error);
    res.status(500).json({ error: 'Failed to get file content' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});