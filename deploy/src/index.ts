import { execSync } from 'child_process';
import {
  copy,
  ensureDir,
  remove,
} from 'fs-extra';
import { join } from 'path';
import { createClient } from 'redis';

// Redis client setup
const redisClient = createClient({ 
  url: 'redis://redis:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Handle Redis connection errors
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, cleaning up...');
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, cleaning up...');
  await redisClient.quit();
  process.exit(0);
});

// NAS Path Configuration
const NAS_INPUT_PATH = '/mnt/mycloud/klipse/out';
const NAS_OUTPUT_PATH = '/mnt/mycloud/klipse/deployments';

// Download from NAS
async function downloadFromNas(projectId: string) {
  console.log(`[${projectId}] Starting download from NAS...`);
  const source = join(NAS_INPUT_PATH, projectId);
  console.log(`[${projectId}] Source path: ${source}`);
  const dest = join('/tmp', projectId);
  
  await ensureDir(dest);
  await copy(source, dest);
  console.log(`[${projectId}] Download completed successfully`);
  return dest;
}

// Upload to NAS
async function uploadToNas(projectId: string, buildPath: string) {
  console.log(`[${projectId}] Starting upload to NAS...`);
  const dest = join(NAS_OUTPUT_PATH, projectId);
  await remove(dest); // Clean previous deployment
  await copy(buildPath, dest);
  console.log(`[${projectId}] Upload completed successfully`);
}

// Process Queue
async function processJobs() {
  try {
    await redisClient.connect();
    console.log('Connected to Redis, starting deployment service...');

    while (true) {
      console.log('Waiting for new deployment job...');
      const job = await redisClient.brPop('deploy-queue', 0);
      
      if (job) {
        let projectId: string;
        try {
          const jobData = JSON.parse(job.element);
          if (!jobData.projectId || typeof jobData.projectId !== 'string') {
            throw new Error('Invalid job data: projectId is missing or invalid');
          }
          projectId = jobData.projectId;
        } catch (parseError) {
          console.error('Failed to parse job data:', {
            error: parseError instanceof Error ? parseError.message : 'Unknown error',
            rawData: job.element
          });
          continue; // Skip this job and continue processing
        }

        console.log(`[${projectId}] Processing new deployment job`);

        try {
          // 1. Download from NAS
          const localPath = await downloadFromNas(projectId);
          
          // 2. Build project with timeout
          console.log(`[${projectId}] Starting build process...`);
          execSync('npm install && npm run build', {
            cwd: localPath,
            stdio: 'inherit',
            timeout: 300000 // 5 minutes timeout
          });
          console.log(`[${projectId}] Build completed successfully`);

          // 3. Upload build output to NAS
          await uploadToNas(projectId, join(localPath, 'build'));

          // 4. Update status
          await redisClient.hSet('deploy-status', projectId, 'deployed');
          console.log(`[${projectId}] Deployment completed successfully`);
          
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error(`[${projectId}] Deployment failed:`, errorMessage);
          await redisClient.hSet('deploy-status', projectId, `error: ${errorMessage}`);
        } finally {
          console.log(`[${projectId}] Cleaning up temporary files...`);
          await remove(join('/tmp', projectId));
          console.log(`[${projectId}] Cleanup completed`);
        }
      }
    }
  } catch (err) {
    console.error('Fatal error in processJobs:', err);
    process.exit(1);
  }
}

processJobs().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});