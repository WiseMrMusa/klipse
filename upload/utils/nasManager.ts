import path from 'path';
import fs from 'fs-extra';

export const uploadToNAS = async (localPath: string, nasRoot: string) => {
  const relativePath = path.relative(process.cwd(), localPath);
  const nasPath = path.join(nasRoot, relativePath);
  
  await fs.ensureDir(path.dirname(nasPath));
  await fs.copy(localPath, nasPath);
};