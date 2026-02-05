import { NextResponse } from "next/server";
import redis, { REDIS_KEYS } from "@/lib/redis";
import { MCPServer } from "@/data/mcp";
import { getKoreanTimeISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Set isOwned flag for a specific MCP
export async function POST(request: Request) {
  try {
    const { mcpId, isOwned } = await request.json();

    if (!mcpId) {
      return NextResponse.json({ error: "Missing mcpId" }, { status: 400 });
    }

    const mcpServers = await redis.get<MCPServer[]>(REDIS_KEYS.mcpServers) || [];
    const mcpIndex = mcpServers.findIndex(m => m.id === mcpId);

    if (mcpIndex === -1) {
      return NextResponse.json({ error: `MCP "${mcpId}" not found` }, { status: 404 });
    }

    const mcp = mcpServers[mcpIndex];
    const now = getKoreanTimeISO();

    // Update isOwned and initialize version if needed
    mcpServers[mcpIndex] = {
      ...mcp,
      isOwned: isOwned ?? true,
      currentVersion: mcp.currentVersion || 1,
      versions: mcp.versions || [{
        version: 1,
        config: mcp.config,
        updatedAt: mcp.updatedAt || now,
        updatedBy: mcp.updatedBy || "clay",
      }],
    };

    await redis.set(REDIS_KEYS.mcpServers, mcpServers);

    return NextResponse.json({
      success: true,
      message: `MCP "${mcpId}" isOwned set to ${isOwned ?? true}`,
      mcp: {
        id: mcpServers[mcpIndex].id,
        isOwned: mcpServers[mcpIndex].isOwned,
        currentVersion: mcpServers[mcpIndex].currentVersion,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
