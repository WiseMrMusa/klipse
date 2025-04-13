import fs from 'fs/promises';
import path from 'path';

export const getAllFiles = async (dirPath: string): Promise<string[]> => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  const files = await Promise.all(entries.map(entry => {
    const fullPath = path.join(dirPath, entry.name);
    return entry.isDirectory() ? getAllFiles(fullPath) : fullPath;
  }));
  
  return files.flat();
};