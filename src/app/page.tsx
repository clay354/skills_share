import Link from "next/link";
import { Command } from "@/data/commands";
import { Plugin } from "@/data/plugins";
import { MCPServer } from "@/data/mcp";
import { Hook } from "@/data/hooks";
import { QuickInstall } from "@/components/QuickInstall";
import redis, { REDIS_KEYS } from "@/lib/redis";

export const dynamic = "force-dynamic";

async function getAllData() {
  try {
    const [allCommands, allPlugins, allMcpServers, allHooks] = await Promise.all([
      redis.get<Command[]>(REDIS_KEYS.commands),
      redis.get<Plugin[]>(REDIS_KEYS.plugins),
      redis.get<MCPServer[]>(REDIS_KEYS.mcpServers),
      redis.get<Hook[]>(REDIS_KEYS.hooks),
    ]);

    return {
      allCommands: allCommands || [],
      allPlugins: allPlugins || [],
      allMcpServers: allMcpServers || [],
      allHooks: allHooks || [],
    };
  } catch {
    return {
      allCommands: [],
      allPlugins: [],
      allMcpServers: [],
      allHooks: [],
    };
  }
}

export default async function Home() {
  const { allCommands, allPlugins, allMcpServers, allHooks } = await getAllData();
  return (
    <div className="min-h-screen bg-amber-50">
      {/* Hero */}
      <div className="max-w-2xl mx-auto px-6 pt-16 pb-16">
        <img
          src="/images/main_image.png"
          alt="Claude Code Extensions"
          className="w-full h-auto drop-shadow-[0_25px_40px_rgba(0,0,0,0.35)] scale-105"
        />
      </div>

      {/* Quick Install */}
      <QuickInstall />

      {/* Commands */}
      <section className="border-t-4 border-blue-800">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-800 mb-2 tracking-wide">Commands</h2>
            <p className="text-blue-600 text-sm font-medium">Slash commands for Claude Code</p>
          </div>
          <div className="space-y-4">
            {allCommands.map((cmd) => (
              <Link key={cmd.id} href={`/commands/${cmd.id}`}>
                <div className="p-4 bg-white border-4 border-blue-800 shadow-[4px_4px_0px_0px_rgba(30,64,175,1)] hover:shadow-[6px_6px_0px_0px_rgba(30,64,175,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-blue-900 mb-1">{cmd.name}</h3>
                      <p className="text-sm text-blue-700">{cmd.description}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-yellow-300 text-blue-900 font-bold border-2 border-blue-800 shrink-0">
                      {cmd.category}
                    </span>
                  </div>
                  {cmd.updatedAt && (
                    <p className="text-xs text-blue-500 mt-2 font-medium">
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
      <section className="border-t-4 border-green-700">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-green-800 mb-2 tracking-wide">Plugins</h2>
            <p className="text-green-600 text-sm font-medium">Extension packages with agents and skills</p>
          </div>
          <div className="space-y-4">
            {allPlugins.map((plugin) => (
              <Link key={plugin.id} href={`/plugins/${plugin.id}`}>
                <div className="p-4 bg-white border-4 border-green-700 shadow-[4px_4px_0px_0px_rgba(21,128,61,1)] hover:shadow-[6px_6px_0px_0px_rgba(21,128,61,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-bold text-green-900">{plugin.name}</h3>
                    <span className="text-xs px-2 py-1 bg-lime-300 text-green-900 font-bold border-2 border-green-700 shrink-0">
                      {plugin.category}
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">{plugin.description}</p>
                  <div className="flex items-center justify-between text-xs text-green-600 font-medium">
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
      <section className="border-t-4 border-purple-700">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-purple-800 mb-2 tracking-wide">MCP Servers</h2>
            <p className="text-purple-600 text-sm font-medium">Model Context Protocol servers</p>
          </div>
          <div className="space-y-4">
            {allMcpServers.map((mcp) => (
              <Link key={mcp.id} href={`/mcp/${mcp.id}`}>
                <div className="p-4 bg-white border-4 border-purple-700 shadow-[4px_4px_0px_0px_rgba(126,34,206,1)] hover:shadow-[6px_6px_0px_0px_rgba(126,34,206,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-purple-900 mb-1">{mcp.name}</h3>
                      <p className="text-sm text-purple-700">{mcp.description}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-pink-300 text-purple-900 font-bold border-2 border-purple-700 shrink-0">
                      {mcp.category}
                    </span>
                  </div>
                  {mcp.updatedAt && (
                    <p className="text-xs text-purple-500 mt-2 font-medium">
                      {new Date(mcp.updatedAt).toLocaleDateString('ko-KR')} · {mcp.updatedBy}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Hooks */}
      <section className="border-t border-neutral-100">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-black mb-2">Hooks</h2>
            <p className="text-neutral-500 text-sm">Event-driven automation scripts</p>
          </div>
          <div className="space-y-3">
            {allHooks.map((hook) => (
              <Link key={hook.id} href={`/hooks/${hook.id}`}>
                <div className="p-4 border border-neutral-200 rounded-xl hover:border-neutral-300 hover:bg-neutral-50 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-black mb-1">{hook.name}</h3>
                      <p className="text-sm text-neutral-600">{hook.description}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-700 rounded">
                        {hook.category}
                      </span>
                      <span className="text-xs px-2 py-1 bg-neutral-800 text-white rounded">
                        {hook.event}
                      </span>
                    </div>
                  </div>
                  {hook.updatedAt && (
                    <p className="text-xs text-neutral-400 mt-2">
                      {new Date(hook.updatedAt).toLocaleDateString('ko-KR')} · {hook.updatedBy}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-blue-800 bg-blue-800 py-8">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Link href="/changelog" className="text-sm text-yellow-300 hover:text-white font-bold">
              Changelog
            </Link>
          </div>
          <p className="text-sm text-blue-200 font-medium">Made with Claude Code</p>
        </div>
      </footer>
    </div>
  );
}
