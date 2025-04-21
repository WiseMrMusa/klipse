import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import simpleGit from 'simple-git';
import fs from 'fs-extra';
import { getAllFiles } from './utils/fileUtils';
import { uploadToNAS } from './utils/nasManager';
import { publisher, getStatus } from './utils/redisClient';

const app = express();
app.use(cors());
app.use(express.json());

const NAS_PATH = process.env.NAS_PATH || '/mnt/mycloud/klipse'; // Change to your NAS mount path

// Endpoint to handle repo processing
app.post('/process', async (req, res) => {
  const repoUrl = req.body.repoUrl;
  const buildCmd = req.body.buildCmd;
  const buildDir = req.body.buildDir;
  const installCmd = req.body.installCmd;
  const uploadId = uuidv4();
  
  try {
    // Clone repo with depth=1 (shallow clone)
    await simpleGit().clone(repoUrl, `./out/${uploadId}`, ['--depth', '1']);
    
    // Process files
    const files = await getAllFiles(`./out/${uploadId}`);
    await Promise.all(files.map(file => 
      uploadToNAS(file, NAS_PATH)
    ));

    // Clean up
    await fs.remove(`./out/${uploadId}`);

    // Update Redis

    await publisher.lPush('build-queue', JSON.stringify({
        projectId: uploadId,
        buildCmd,
        buildDir,
        installCmd
    }));

    await publisher.set(`status:${uploadId}`, 'uploaded');
    
    res.json({ uploadId });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Status endpoint
app.get('/status/:id', async (req, res) => {
  const status = await getStatus(req.params.id);
  res.json({ status });
});

app.listen(3005, () => {
  console.log('Server running on port 3005');
});
