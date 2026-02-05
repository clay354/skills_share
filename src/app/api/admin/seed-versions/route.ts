import { NextResponse } from "next/server";
import redis, { REDIS_KEYS } from "@/lib/redis";
import { Command, CommandVersion } from "@/data/commands";
import { getKoreanTimeISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Temporary endpoint to seed version history for testing
// DELETE THIS AFTER USE
export async function POST() {
  try {
    const commands = await redis.get<Command[]>(REDIS_KEYS.commands) || [];
    const cloneIdx = commands.findIndex(cmd => cmd.id === 'clone-website');

    if (cloneIdx === -1) {
      return NextResponse.json({ error: 'clone-website not found' }, { status: 404 });
    }

    const cloneCmd = commands[cloneIdx];

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
        updatedAt: cloneCmd.updatedAt || getKoreanTimeISO(),
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

    await redis.set(REDIS_KEYS.commands, commands);

    return NextResponse.json({
      success: true,
      message: 'Version history added to clone-website',
      versions: versions.map(v => ({
        version: v.version,
        updatedAt: v.updatedAt,
        updatedBy: v.updatedBy,
        changelog: v.changelog,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
