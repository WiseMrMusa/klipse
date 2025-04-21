import path from 'path';
import fs from 'fs-extra';

export const uploadToNAS = async (localPath: string, nasRoot: string) => {
  // Skip .git directory and its contents
  if (localPath.includes('.git')) {
    return;
  }

  const relativePath = path.relative(process.cwd(), localPath);
  const nasPath = path.join(nasRoot, relativePath);
  
  try {
    // Ensure the target directory exists with proper permissions
    await fs.ensureDir(path.dirname(nasPath), { mode: 0o755 });
    
    // Copy the file
    await fs.copy(localPath, nasPath, {
      preserveTimestamps: true
    });

    // Set file permissions after copy
    await fs.chmod(nasPath, 0o644);
  } catch (error) {
    console.error(`Failed to upload ${localPath} to ${nasPath}:`, error);
    throw error;
  }
};