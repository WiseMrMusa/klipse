import { execSync } from 'child_process';
import {
  copy,
  ensureDir,
  remove,
} from 'fs-extra';
import { join } from 'path';
import { createClient } from 'redis';

// Redis client setup
const redisClient = createClient({ url: 'redis://redis:6379' });

// NAS Path Configuration
const NAS_INPUT_PATH = '/nas/input';
const NAS_OUTPUT_PATH = '/nas/deployments';

// Download from NAS
async function downloadFromNas(projectId: string) {
  const source = join(NAS_INPUT_PATH, projectId);
  const dest = join('/tmp', projectId);
  
  await ensureDir(dest);
  await copy(source, dest);
  return dest;
}

// Upload to NAS
async function uploadToNas(projectId: string, buildPath: string) {
  const dest = join(NAS_OUTPUT_PATH, projectId);
  await remove(dest); // Clean previous deployment
  await copy(buildPath, dest);
}

// Process Queue
async function processJobs() {
  await redisClient.connect();

  while (true) {
    const job = await redisClient.brPop('deploy-queue', 0);
    
    if (job) {
      const { projectId } = JSON.parse(job.element);

      try {
        // 1. Download from NAS
        const localPath = await downloadFromNas(projectId);
        
        // 2. Build project
        execSync('npm install && npm run build', {
          cwd: localPath,
          stdio: 'inherit'
        });

        // 3. Upload build output to NAS
        await uploadToNas(projectId, join(localPath, 'build'));

        // 4. Update status
        await redisClient.hSet('deploy-status', projectId, 'deployed');
        
      } catch (err) {
        await redisClient.hSet('deploy-status', projectId, `error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        await remove(join('/tmp', projectId)); // Cleanup
      }
    }
  }
}

processJobs().catch(console.error);