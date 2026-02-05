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

export async function PUT(request: Request) {
  try {
    const updateData = await request.json() as Partial<Command>;

    // Validate required field
    if (!updateData.id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Check if command exists in uploaded commands (can't update built-in)
    let uploadedCommands: Command[] = [];
    try {
      uploadedCommands = await get<Command[]>('commands') || [];
    } catch {
      uploadedCommands = [];
    }

    const existingIndex = uploadedCommands.findIndex(c => c.id === updateData.id);

    // Check if it's a built-in command
    if (builtInCommands.some(c => c.id === updateData.id)) {
      return NextResponse.json(
        { error: `Cannot update built-in command "${updateData.id}"` },
        { status: 403 }
      );
    }

    if (existingIndex === -1) {
      return NextResponse.json(
        { error: `Command with id "${updateData.id}" not found` },
        { status: 404 }
      );
    }

    // Merge with existing command
    const existingCommand = uploadedCommands[existingIndex];
    const updatedCommand: Command = {
      ...existingCommand,
      name: updateData.name || existingCommand.name,
      description: updateData.description ?? existingCommand.description,
      category: updateData.category || existingCommand.category,
      content: updateData.content || existingCommand.content,
      installPath: updateData.installPath || existingCommand.installPath,
      examples: updateData.examples || existingCommand.examples,
    };

    // Replace in array
    uploadedCommands[existingIndex] = updatedCommand;

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
          items: [{ operation: 'upsert', key: 'commands', value: uploadedCommands }],
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

    return NextResponse.json({ success: true, id: updatedCommand.id, message: 'Command updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: `Update failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
