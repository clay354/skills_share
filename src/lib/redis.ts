import { Redis } from '@upstash/redis';

// Create Redis client instance
// Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default redis;

// Redis keys for stored data
export const REDIS_KEYS = {
  commands: 'commands',
  plugins: 'plugins',
  mcpServers: 'mcpServers',
} as const;
