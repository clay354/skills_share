import { NextResponse } from 'next/server';
import redis, { REDIS_KEYS } from '@/lib/redis';
import { mcpServers as builtInMcpServers, MCPServer } from '@/data/mcp';

// Get all MCP servers (built-in + uploaded)
async function getAllMcpServers(): Promise<MCPServer[]> {
  try {
    const uploadedMcpServers = await redis.get<MCPServer[]>(REDIS_KEYS.mcpServers) || [];
    return [...builtInMcpServers, ...uploadedMcpServers];
  } catch {
    // Redis not configured, return only built-in
    return builtInMcpServers;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');

  const mcpServers = await getAllMcpServers();

  // Get specific MCP by ID
  if (id) {
    const mcp = mcpServers.find(m => m.id === id);
    if (!mcp) {
      return NextResponse.json({ error: 'MCP server not found' }, { status: 404 });
    }
    return NextResponse.json(mcp);
  }

  // Filter by category
  let filtered = mcpServers;
  if (category) {
    filtered = mcpServers.filter(m => m.category.toLowerCase() === category.toLowerCase());
  }

  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  try {
    const newMcp = await request.json() as Partial<MCPServer>;

    // Validate required fields
    if (!newMcp.id || !newMcp.name || !newMcp.type || !newMcp.config) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, type, config' },
        { status: 400 }
      );
    }

    // Check for duplicate ID
    const existingMcpServers = await getAllMcpServers();
    if (existingMcpServers.some(m => m.id === newMcp.id)) {
      return NextResponse.json(
        { error: `MCP server with id "${newMcp.id}" already exists` },
        { status: 409 }
      );
    }

    // Build complete MCP object
    const mcp: MCPServer = {
      id: newMcp.id,
      name: newMcp.name,
      description: newMcp.description || '',
      category: newMcp.category || 'Other',
      type: newMcp.type as "http" | "stdio" | "sse",
      config: newMcp.config,
      installLocation: newMcp.installLocation || 'global',
      setupSteps: newMcp.setupSteps || [],
      examples: newMcp.examples || [],
    };

    // Get current uploaded MCP servers
    let uploadedMcpServers: MCPServer[] = [];
    try {
      uploadedMcpServers = await redis.get<MCPServer[]>(REDIS_KEYS.mcpServers) || [];
    } catch {
      uploadedMcpServers = [];
    }

    // Add new MCP server
    const updatedMcpServers = [...uploadedMcpServers, mcp];

    // Update Redis
    await redis.set(REDIS_KEYS.mcpServers, updatedMcpServers);

    return NextResponse.json({ success: true, id: mcp.id, message: 'MCP server uploaded successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const updateData = await request.json() as Partial<MCPServer>;

    // Validate required field
    if (!updateData.id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Check if MCP server exists in uploaded servers (can't update built-in)
    let uploadedMcpServers: MCPServer[] = [];
    try {
      uploadedMcpServers = await redis.get<MCPServer[]>(REDIS_KEYS.mcpServers) || [];
    } catch {
      uploadedMcpServers = [];
    }

    const existingIndex = uploadedMcpServers.findIndex(m => m.id === updateData.id);

    // Check if it's a built-in MCP server
    if (builtInMcpServers.some(m => m.id === updateData.id)) {
      return NextResponse.json(
        { error: `Cannot update built-in MCP server "${updateData.id}"` },
        { status: 403 }
      );
    }

    if (existingIndex === -1) {
      return NextResponse.json(
        { error: `MCP server with id "${updateData.id}" not found` },
        { status: 404 }
      );
    }

    // Merge with existing MCP server
    const existingMcp = uploadedMcpServers[existingIndex];
    const updatedMcp: MCPServer = {
      ...existingMcp,
      name: updateData.name || existingMcp.name,
      description: updateData.description ?? existingMcp.description,
      category: updateData.category || existingMcp.category,
      type: updateData.type || existingMcp.type,
      config: updateData.config || existingMcp.config,
      installLocation: updateData.installLocation || existingMcp.installLocation,
      setupSteps: updateData.setupSteps || existingMcp.setupSteps,
      examples: updateData.examples || existingMcp.examples,
    };

    // Replace in array
    uploadedMcpServers[existingIndex] = updatedMcp;

    // Update Redis
    await redis.set(REDIS_KEYS.mcpServers, uploadedMcpServers);

    return NextResponse.json({ success: true, id: updatedMcp.id, message: 'MCP server updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: `Update failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
