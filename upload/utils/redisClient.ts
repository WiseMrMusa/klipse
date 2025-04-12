import { createClient } from 'redis';
import { promisify } from 'util';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});
const publisher = client.duplicate();

client.on('error', (err) => console.log('Redis Client Error', err));

const connect = async () => {
  await client.connect();
  await publisher.connect();
};

connect();

export { publisher };

export const getStatus = async (id: string) => {
  return client.get(`status:${id}`);
};