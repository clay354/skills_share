import { Redis } from '@upstash/redis';

// Create Redis client instance
// Uses KV_REST_API_URL and KV_REST_API_TOKEN from Vercel Marketplace
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default redis;

// Redis keys for stored data
export const REDIS_KEYS = {
  commands: 'commands',
  plugins: 'plugins',
  mcpServers: 'mcpServers',
} as const;
