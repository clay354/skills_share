import Link from "next/link";
import { Command } from "@/data/commands";
import { Plugin } from "@/data/plugins";
import { MCPServer } from "@/data/mcp";
import { QuickInstall } from "@/components/QuickInstall";
import redis, { REDIS_KEYS } from "@/lib/redis";

export const dynamic = "force-dynamic";

async function getAllData() {
  try {
    const [allCommands, allPlugins, allMcpServers] = await Promise.all([
      redis.get<Command[]>(REDIS_KEYS.commands),
      redis.get<Plugin[]>(REDIS_KEYS.plugins),
      redis.get<MCPServer[]>(REDIS_KEYS.mcpServers),
    ]);

    return {
      allCommands: allCommands || [],
      allPlugins: allPlugins || [],
      allMcpServers: allMcpServers || [],
    };
  } catch {
    return {
      allCommands: [],
      allPlugins: [],
      allMcpServers: [],
    };
  }
}

export default async function Home() {
  const { allCommands, allPlugins, allMcpServers } = await getAllData();
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="max-w-2xl mx-auto px-6 pt-32 pb-16 text-center">
        <h1 className="text-3xl md:text-4xl font-semibold text-black leading-tight mb-4">
          Claude Code Extensions
        </h1>
        <p className="text-neutral-600 text-lg leading-relaxed">
          Commands, Plugins, MCP Servers for Claude Code
        </p>
      </div>

      {/* Quick Install */}
      <QuickInstall />

      {/* Commands */}
      <section className="border-t border-neutral-100">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-black mb-2">Commands</h2>
            <p className="text-neutral-500 text-sm">Slash commands for Claude Code</p>
          </div>
          <div className="space-y-3">
            {allCommands.map((cmd) => (
              <Link key={cmd.id} href={`/commands/${cmd.id}`}>
                <div className="p-4 border border-neutral-200 rounded-xl hover:border-neutral-300 hover:bg-neutral-50 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-black mb-1">{cmd.name}</h3>
                      <p className="text-sm text-neutral-600">{cmd.description}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded shrink-0">
                      {cmd.category}
                    </span>
                  </div>
                  {cmd.updatedAt && (
                    <p className="text-xs text-neutral-400 mt-2">
                      {new Date(cmd.updatedAt).toLocaleDateString('ko-KR')} · {cmd.updatedBy}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Plugins */}
      <section className="border-t border-neutral-100">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-black mb-2">Plugins</h2>
            <p className="text-neutral-500 text-sm">Extension packages with agents and skills</p>
          </div>
          <div className="space-y-3">
            {allPlugins.map((plugin) => (
              <Link key={plugin.id} href={`/plugins/${plugin.id}`}>
                <div className="p-4 border border-neutral-200 rounded-xl hover:border-neutral-300 hover:bg-neutral-50 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-medium text-black">{plugin.name}</h3>
                    <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded shrink-0">
                      {plugin.category}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">{plugin.description}</p>
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>{plugin.agents?.length || 0} agents · {plugin.skills?.length || 0} skills</span>
                    {plugin.updatedAt && (
                      <span>{new Date(plugin.updatedAt).toLocaleDateString('ko-KR')} · {plugin.updatedBy}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MCP */}
      <section className="border-t border-neutral-100">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-black mb-2">MCP Servers</h2>
            <p className="text-neutral-500 text-sm">Model Context Protocol servers</p>
          </div>
          <div className="space-y-3">
            {allMcpServers.map((mcp) => (
              <Link key={mcp.id} href={`/mcp/${mcp.id}`}>
                <div className="p-4 border border-neutral-200 rounded-xl hover:border-neutral-300 hover:bg-neutral-50 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-black mb-1">{mcp.name}</h3>
                      <p className="text-sm text-neutral-600">{mcp.description}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded shrink-0">
                      {mcp.category}
                    </span>
                  </div>
                  {mcp.updatedAt && (
                    <p className="text-xs text-neutral-400 mt-2">
                      {new Date(mcp.updatedAt).toLocaleDateString('ko-KR')} · {mcp.updatedBy}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Link href="/changelog" className="text-sm text-neutral-500 hover:text-black">
              Changelog
            </Link>
          </div>
          <p className="text-sm text-neutral-400">Made with Claude Code</p>
        </div>
      </footer>
    </div>
  );
}
