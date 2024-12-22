export interface GitFile {
  path: string;
  author: string;
  lastModified: string;
}

const API_URL = 'http://localhost:3000/api';

export const getAuthoredFiles = async (repoPath: string, authorEmail: string): Promise<GitFile[]> => {
  try {
    const response = await fetch(`${API_URL}/git/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ repoPath, authorEmail }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting authored files:', error);
    throw error;
  }
};

export const getFileContent = async (repoPath: string, filePath: string): Promise<string> => {
  try {
    const response = await fetch(
      `${API_URL}/git/content?repoPath=${encodeURIComponent(repoPath)}&filePath=${encodeURIComponent(filePath)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch file content');
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error getting file content:', error);
    throw error;
  }
};