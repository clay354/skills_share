import { Redis } from '@upstash/redis';

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

const AUTHOR = 'clay';
const NOW = new Date().toISOString();

interface WithAuthorInfo {
  updatedAt?: string;
  updatedBy?: string;
}

async function updateAuthorInfo() {
  console.log('Updating author info in Redis...\n');
  console.log(`Author: ${AUTHOR}`);
  console.log(`Timestamp: ${NOW}\n`);

  // Update commands
  const commands = await redis.get<WithAuthorInfo[]>('commands') || [];
  const updatedCommands = commands.map(cmd => ({
    ...cmd,
    updatedAt: cmd.updatedAt || NOW,
    updatedBy: cmd.updatedBy || AUTHOR,
  }));
  await redis.set('commands', updatedCommands);
  console.log(`✓ commands: ${commands.length}개 업데이트`);

  // Update plugins
  const plugins = await redis.get<WithAuthorInfo[]>('plugins') || [];
  const updatedPlugins = plugins.map(p => ({
    ...p,
    updatedAt: p.updatedAt || NOW,
    updatedBy: p.updatedBy || AUTHOR,
  }));
  await redis.set('plugins', updatedPlugins);
  console.log(`✓ plugins: ${plugins.length}개 업데이트`);

  // Update MCP servers
  const mcpServers = await redis.get<WithAuthorInfo[]>('mcpServers') || [];
  const updatedMcpServers = mcpServers.map(m => ({
    ...m,
    updatedAt: m.updatedAt || NOW,
    updatedBy: m.updatedBy || AUTHOR,
  }));
  await redis.set('mcpServers', updatedMcpServers);
  console.log(`✓ mcpServers: ${mcpServers.length}개 업데이트`);

  console.log('\n✅ 완료!');
}

updateAuthorInfo().catch(console.error);
