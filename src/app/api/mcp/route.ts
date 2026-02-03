import { NextResponse } from 'next/server';
import { mcpServers } from '@/data/mcp';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');

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
