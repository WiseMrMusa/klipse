import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import simpleGit from 'simple-git';
import { getAllFiles } from './utils/fileUtils';
import { uploadToNAS } from './utils/nasManager';
import { publisher, getStatus } from './utils/redisClient';

const app = express();
app.use(cors());
app.use(express.json());

const NAS_PATH = process.env.NAS_PATH || '/mnt/nas'; // Change to your NAS mount path

// Endpoint to handle repo processing
app.post('/process', async (req, res) => {
  const repoUrl = req.body.repoUrl;
  const uploadId = uuidv4();
  
  try {
    // Clone repo
    await simpleGit().clone(repoUrl, `./out/${uploadId}`);
    
    // Process files
    const files = await getAllFiles(`./out/${uploadId}`);
    await Promise.all(files.map(file => 
      uploadToNAS(file, NAS_PATH)
    ));

    // Update Redis
    await publisher.publish('upload-queue', uploadId);
    await publisher.set(`status:${uploadId}`, 'uploaded');
    
    res.json({ uploadId });
  } catch (error) {
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Status endpoint
app.get('/status/:id', async (req, res) => {
  const status = await getStatus(req.params.id);
  res.json({ status });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});