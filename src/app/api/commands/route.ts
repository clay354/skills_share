import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';
import { commands as builtInCommands, Command } from '@/data/commands';

// Get all commands (built-in + uploaded)
async function getAllCommands(): Promise<Command[]> {
  try {
    const uploadedCommands = await get<Command[]>('commands') || [];
    return [...builtInCommands, ...uploadedCommands];
  } catch {
    // Edge Config not configured, return only built-in
    return builtInCommands;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');

  const commands = await getAllCommands();

  // Get specific command by ID
  if (id) {
    const command = commands.find(c => c.id === id);
    if (!command) {
      return NextResponse.json({ error: 'Command not found' }, { status: 404 });
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
  }));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  try {
    const newCommand = await request.json() as Partial<Command>;

    // Validate required fields
    if (!newCommand.id || !newCommand.name || !newCommand.content || !newCommand.category) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, content, category' },
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

    // Build complete command object
    const command: Command = {
      id: newCommand.id,
      name: newCommand.name,
      description: newCommand.description || '',
      category: newCommand.category,
      content: newCommand.content,
      installPath: newCommand.installPath || `~/.claude/commands/${newCommand.id}.md`,
      examples: newCommand.examples || [],
    };

    // Get current uploaded commands
    let uploadedCommands: Command[] = [];
    try {
      uploadedCommands = await get<Command[]>('commands') || [];
    } catch {
      uploadedCommands = [];
    }

    // Add new command
    const updatedCommands = [...uploadedCommands, command];

    // Update Edge Config via Vercel API
    const edgeConfigId = process.env.EDGE_CONFIG_ID;
    const vercelToken = process.env.VERCEL_API_TOKEN;

    if (!edgeConfigId || !vercelToken) {
      return NextResponse.json(
        { error: 'Server not configured for uploads (missing EDGE_CONFIG_ID or VERCEL_API_TOKEN)' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{ operation: 'upsert', key: 'commands', value: updatedCommands }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Failed to update Edge Config: ${errorText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: command.id, message: 'Command uploaded successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
