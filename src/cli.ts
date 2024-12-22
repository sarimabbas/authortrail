#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const repoPath = process.argv[2];

if (!repoPath) {
  console.error('Please provide a repository path');
  process.exit(1);
}

// Start the Vite dev server
const startServer = async () => {
  try {
    await execAsync('npm run dev');
    console.log('Server started at http://localhost:8080');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();