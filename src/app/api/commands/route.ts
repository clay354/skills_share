import { NextResponse } from 'next/server';
import redis, { REDIS_KEYS } from '@/lib/redis';
import { Command, CommandVersion } from '@/data/commands';
import { getKoreanTimeISO } from '@/lib/utils';

// Get all commands from Redis
async function getAllCommands(): Promise<Command[]> {
  try {
    return await redis.get<Command[]>(REDIS_KEYS.commands) || [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const version = searchParams.get('version');

  const commands = await getAllCommands();

  // Get specific command by ID
  if (id) {
    const command = commands.find(c => c.id === id);
    if (!command) {
      return NextResponse.json({ error: 'Command not found' }, { status: 404 });
    }

    // If version specified, return that version's content
    if (version && command.versions) {
      const versionNum = parseInt(version, 10);
      const versionData = command.versions.find(v => v.version === versionNum);
      if (!versionData) {
        return NextResponse.json({ error: `Version ${version} not found` }, { status: 404 });
      }
      // Return command with specific version's content
      return NextResponse.json({
        ...command,
        content: versionData.content,
        updatedAt: versionData.updatedAt,
        updatedBy: versionData.updatedBy,
        requestedVersion: versionNum,
      });
    }

    return NextResponse.json(command);
  }

  // Filter by category
  let filtered = commands;
  if (category) {
    filtered = commands.filter(c => c.category.toLowerCase() === category.toLowerCase());
  }

  // Return list (without content for smaller payload)
  const list = filtered.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    category: c.category,
    installPath: c.installPath,
    examples: c.examples,
    updatedAt: c.updatedAt,
    updatedBy: c.updatedBy,
    currentVersion: c.currentVersion,
  }));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  try {
    const newCommand = await request.json() as Partial<Command> & { authorName?: string };

    // Validate required fields
    if (!newCommand.id || !newCommand.name || !newCommand.content || !newCommand.category) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, content, category' },
        { status: 400 }
      );
    }

    if (!newCommand.authorName) {
      return NextResponse.json(
        { error: 'Missing required field: authorName' },
        { status: 400 }
      );
    }

    // Check for duplicate ID
    const existingCommands = await getAllCommands();
    if (existingCommands.some(c => c.id === newCommand.id)) {
      return NextResponse.json(
        { error: `Command with id "${newCommand.id}" already exists` },
        { status: 409 }
      );
    }

    // Build complete command object with version 1
    const now = getKoreanTimeISO();
    const initialVersion: CommandVersion = {
      version: 1,
      content: newCommand.content,
      updatedAt: now,
      updatedBy: newCommand.authorName,
    };

    const command: Command = {
      id: newCommand.id,
      name: newCommand.name,
      description: newCommand.description || '',
      category: newCommand.category,
      content: newCommand.content,
      installPath: newCommand.installPath || `~/.claude/commands/${newCommand.id}.md`,
      examples: newCommand.examples || [],
      updatedAt: now,
      updatedBy: newCommand.authorName,
      currentVersion: 1,
      versions: [initialVersion],
    };

    // Add new command
    const updatedCommands = [...existingCommands, command];

    // Update Redis
    await redis.set(REDIS_KEYS.commands, updatedCommands);

    return NextResponse.json({ success: true, id: command.id, message: 'Command uploaded successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const updateData = await request.json() as Partial<Command> & { authorName?: string; changelog?: string };

    // Validate required fields
    if (!updateData.id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    if (!updateData.authorName) {
      return NextResponse.json(
        { error: 'Missing required field: authorName' },
        { status: 400 }
      );
    }

    // Get current commands
    const commands = await getAllCommands();
    const existingIndex = commands.findIndex(c => c.id === updateData.id);

    if (existingIndex === -1) {
      return NextResponse.json(
        { error: `Command with id "${updateData.id}" not found` },
        { status: 404 }
      );
    }

    const existingCommand = commands[existingIndex];
    const now = getKoreanTimeISO();

    // If content is being updated, create a new version
    let newVersion: number = existingCommand.currentVersion || 1;
    let versions = existingCommand.versions || [];

    if (updateData.content && updateData.content !== existingCommand.content) {
      // Backfill v1 if versions array is empty (legacy data created before versioning)
      if (versions.length === 0) {
        versions = [{
          version: 1,
          content: existingCommand.content,
          updatedAt: existingCommand.updatedAt || now,
          updatedBy: existingCommand.updatedBy || 'unknown',
        }];
      }

      newVersion = (existingCommand.currentVersion || 1) + 1;
      const newVersionData: CommandVersion = {
        version: newVersion,
        content: updateData.content,
        updatedAt: now,
        updatedBy: updateData.authorName,
        changelog: updateData.changelog,
      };
      versions = [...versions, newVersionData];
    }

    // Merge with existing command
    const updatedCommand: Command = {
      ...existingCommand,
      name: updateData.name || existingCommand.name,
      description: updateData.description ?? existingCommand.description,
      category: updateData.category || existingCommand.category,
      content: updateData.content || existingCommand.content,
      installPath: updateData.installPath || existingCommand.installPath,
      examples: updateData.examples || existingCommand.examples,
      updatedAt: now,
      updatedBy: updateData.authorName,
      currentVersion: newVersion,
      versions: versions,
    };

    // Replace in array
    commands[existingIndex] = updatedCommand;

    // Update Redis
    await redis.set(REDIS_KEYS.commands, commands);

    return NextResponse.json({
      success: true,
      id: updatedCommand.id,
      version: newVersion,
      message: `Command updated successfully (v${newVersion})`
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Update failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
