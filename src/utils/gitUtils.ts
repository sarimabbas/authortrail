import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitFile {
  path: string;
  author: string;
  lastModified: string;
}

export const getAuthoredFiles = async (repoPath: string, authorEmail: string): Promise<GitFile[]> => {
  try {
    // Get all files that have been modified by the author
    const { stdout } = await execAsync(
      `git log --all --pretty=format: --author="${authorEmail}" --name-only | sort -u`,
      { cwd: repoPath }
    );

    const files = stdout.trim().split('\n').filter(Boolean);
    
    const fileDetails: GitFile[] = [];
    
    // Get blame info for each file
    for (const file of files) {
      const { stdout: blameInfo } = await execAsync(
        `git blame --line-porcelain "${file}" | grep "^author-mail"`,
        { cwd: repoPath }
      );
      
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

    return fileDetails;
  } catch (error) {
    console.error('Error getting authored files:', error);
    throw error; // Let the error bubble up to be handled by the UI
  }
};