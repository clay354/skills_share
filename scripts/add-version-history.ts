import { config } from 'dotenv';
import { Redis } from '@upstash/redis';

// Load .env.local
config({ path: '.env.local' });

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('Missing environment variables!');
  console.error('Run: vercel env pull .env.local');
  process.exit(1);
}

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

interface CommandVersion {
  version: number;
  content: string;
  updatedAt: string;
  updatedBy: string;
  changelog?: string;
}

interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  installPath: string;
  examples: { input: string; description: string }[];
  updatedAt?: string;
  updatedBy?: string;
  currentVersion?: number;
  versions?: CommandVersion[];
}

async function addVersionHistory() {
  console.log('Adding version history to clone-website command...\n');

  const commands = await redis.get<Command[]>('commands') || [];
  const cloneIdx = commands.findIndex(cmd => cmd.id === 'clone-website');

  if (cloneIdx === -1) {
    console.error('clone-website command not found!');
    process.exit(1);
  }

  const cloneCmd = commands[cloneIdx];
  console.log(`Found: ${cloneCmd.name}`);
  console.log(`Current content length: ${cloneCmd.content.length} chars\n`);

  // Create fictional version history
  const versions: CommandVersion[] = [
    {
      version: 1,
      content: `---
description: Clone a website to local folder
---

# Clone Website

Download the specified website URL to a local folder.

## Steps
1. Use wget or curl to download the page
2. Save to the specified directory

Basic implementation for single page download.`,
      updatedAt: '2026-01-15T09:00:00.000Z',
      updatedBy: 'clay',
      changelog: '초기 버전 - 기본 다운로드 기능',
    },
    {
      version: 2,
      content: `---
description: Clone a website with assets to local folder
---

# Clone Website

Download the specified website URL along with its assets (CSS, JS, images) to a local folder.

## Steps
1. Use wget with recursive option to download the page and assets
2. Convert links to relative paths
3. Save to the specified directory

## Options
- Include images: yes
- Include CSS: yes
- Include JS: yes`,
      updatedAt: '2026-01-25T14:30:00.000Z',
      updatedBy: 'clay',
      changelog: '에셋 다운로드 기능 추가 (CSS, JS, 이미지)',
    },
    {
      version: 3,
      content: cloneCmd.content,
      updatedAt: cloneCmd.updatedAt || new Date().toISOString(),
      updatedBy: cloneCmd.updatedBy || 'clay',
      changelog: '프롬프트 개선 및 에러 처리 강화',
    },
  ];

  // Update the command with version history
  commands[cloneIdx] = {
    ...cloneCmd,
    currentVersion: 3,
    versions: versions,
    updatedAt: versions[2].updatedAt,
    updatedBy: versions[2].updatedBy,
  };

  await redis.set('commands', commands);

  console.log('✅ Version history added!');
  console.log(`   - Version 1: 초기 버전 (2026-01-15)`);
  console.log(`   - Version 2: 에셋 다운로드 추가 (2026-01-25)`);
  console.log(`   - Version 3: 현재 버전 (최신)`);
}

addVersionHistory().catch(console.error);
