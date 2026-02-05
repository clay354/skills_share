import { NextResponse } from 'next/server';
import redis, { REDIS_KEYS } from '@/lib/redis';
import { MCPServer } from '@/data/mcp';

// Get all MCP servers from Redis
async function getAllMcpServers(): Promise<MCPServer[]> {
  try {
    return await redis.get<MCPServer[]>(REDIS_KEYS.mcpServers) || [];
  } catch {
    return [];
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

  // Return list with update info
  const list = filtered.map(m => ({
    id: m.id,
    name: m.name,
    description: m.description,
    category: m.category,
    type: m.type,
    config: m.config,
    installLocation: m.installLocation,
    setupSteps: m.setupSteps,
    tools: m.tools,
    examples: m.examples,
    updatedAt: m.updatedAt,
    updatedBy: m.updatedBy,
  }));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  try {
    const newMcp = await request.json() as Partial<MCPServer> & { authorName?: string };

    // Validate required fields
    if (!newMcp.id || !newMcp.name || !newMcp.type || !newMcp.config) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, type, config' },
        { status: 400 }
      );
    }

    if (!newMcp.authorName) {
      return NextResponse.json(
        { error: 'Missing required field: authorName' },
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
      tools: newMcp.tools || [],
      examples: newMcp.examples || [],
      updatedAt: new Date().toISOString(),
      updatedBy: newMcp.authorName,
    };

    // Add new MCP server
    const updatedMcpServers = [...existingMcpServers, mcp];

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
    const updateData = await request.json() as Partial<MCPServer> & { authorName?: string };

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

    // Get current MCP servers
    const mcpServers = await getAllMcpServers();
    const existingIndex = mcpServers.findIndex(m => m.id === updateData.id);

    if (existingIndex === -1) {
      return NextResponse.json(
        { error: `MCP server with id "${updateData.id}" not found` },
        { status: 404 }
      );
    }

    // Merge with existing MCP server
    const existingMcp = mcpServers[existingIndex];
    const updatedMcp: MCPServer = {
      ...existingMcp,
      name: updateData.name || existingMcp.name,
      description: updateData.description ?? existingMcp.description,
      category: updateData.category || existingMcp.category,
      type: updateData.type || existingMcp.type,
      config: updateData.config || existingMcp.config,
      installLocation: updateData.installLocation || existingMcp.installLocation,
      setupSteps: updateData.setupSteps || existingMcp.setupSteps,
      tools: updateData.tools || existingMcp.tools,
      examples: updateData.examples || existingMcp.examples,
      updatedAt: new Date().toISOString(),
      updatedBy: updateData.authorName,
    };

    // Replace in array
    mcpServers[existingIndex] = updatedMcp;

    // Update Redis
    await redis.set(REDIS_KEYS.mcpServers, mcpServers);

    return NextResponse.json({ success: true, id: updatedMcp.id, message: 'MCP server updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: `Update failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
