import express, { Request, Response } from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/git/files', async (req: Request, res: Response) => {
  try {
    const { repoPath, authorEmail } = req.body;
    
    // Get all files that have been modified by the author
    const { stdout } = await execAsync(
      `git log --all --pretty=format: --author="${authorEmail}" --name-only | sort -u`,
      { cwd: repoPath }
    );

    const files = stdout.trim().split('\n').filter(Boolean);
    const fileDetails = [];
    
    // Get blame info for each file
    for (const file of files) {
      const { stdout: lastModified } = await execAsync(
        `git log -1 --format="%ad" -- "${file}"`,
        { cwd: repoPath }
      );

      fileDetails.push({
        path: file,
        author: authorEmail,
        lastModified: new Date(lastModified).toLocaleDateString(),
      });
    }

    res.json(fileDetails);
  } catch (error) {
    console.error('Error getting authored files:', error);
    res.status(500).json({ error: 'Failed to get file history' });
  }
});

app.get('/api/git/content', async (req: Request, res: Response) => {
  try {
    const { repoPath, filePath } = req.query;
    
    if (typeof repoPath !== 'string' || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const { stdout } = await execAsync(
      `cat "${filePath}"`,
      { cwd: repoPath }
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