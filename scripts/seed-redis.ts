import { Redis } from '@upstash/redis';
import { commands } from '../src/data/commands';
import { plugins } from '../src/data/plugins';
import { mcpServers } from '../src/data/mcp';

// Check env vars
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('Missing environment variables!');
  console.error('Run: vercel env pull .env.local');
  console.error('Then: source .env.local or use dotenv');
  process.exit(1);
}

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

async function seed() {
  console.log('Seeding Redis database...\n');

  // Insert commands
  console.log(`Commands: ${commands.length}개`);
  await redis.set('commands', commands);
  console.log('  ✓ commands 저장 완료');

  // Insert plugins
  console.log(`Plugins: ${plugins.length}개`);
  await redis.set('plugins', plugins);
  console.log('  ✓ plugins 저장 완료');

  // Insert MCP servers
  console.log(`MCP Servers: ${mcpServers.length}개`);
  await redis.set('mcpServers', mcpServers);
  console.log('  ✓ mcpServers 저장 완료');

  console.log('\n✅ Seed 완료!');

  // Verify
  console.log('\n검증 중...');
  const savedCommands = await redis.get('commands');
  const savedPlugins = await redis.get('plugins');
  const savedMcp = await redis.get('mcpServers');

  console.log(`  commands: ${Array.isArray(savedCommands) ? savedCommands.length : 0}개`);
  console.log(`  plugins: ${Array.isArray(savedPlugins) ? savedPlugins.length : 0}개`);
  console.log(`  mcpServers: ${Array.isArray(savedMcp) ? savedMcp.length : 0}개`);
}

seed().catch(console.error);
