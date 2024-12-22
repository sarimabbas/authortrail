export interface GitFile {
  path: string;
  author: string;
  lastModified: string;
}

// Mock function to simulate getting authored files
export const getAuthoredFiles = async (repoPath: string, authorEmail: string): Promise<GitFile[]> => {
  // This is a mock implementation
  // In a real application, this would make an API call to a backend service
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock data
  return [
    {
      path: 'src/components/Button.tsx',
      author: authorEmail,
      lastModified: new Date('2024-01-20').toLocaleDateString(),
    },
    {
      path: 'src/utils/helpers.ts',
      author: authorEmail,
      lastModified: new Date('2024-01-19').toLocaleDateString(),
    },
    {
      path: 'src/pages/Home.tsx',
      author: authorEmail,
      lastModified: new Date('2024-01-18').toLocaleDateString(),
    },
  ];
};