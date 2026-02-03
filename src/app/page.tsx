import Link from "next/link";
import { commands } from "@/data/commands";
import { plugins } from "@/data/plugins";
import { mcpServers } from "@/data/mcp";
import { QuickInstall } from "@/components/QuickInstall";

export default function Home() {
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
            {commands.map((cmd) => (
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
            {plugins.map((plugin) => (
              <Link key={plugin.id} href={`/plugins/${plugin.id}`}>
                <div className="p-4 border border-neutral-200 rounded-xl hover:border-neutral-300 hover:bg-neutral-50 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-medium text-black">{plugin.name}</h3>
                    <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded shrink-0">
                      {plugin.category}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">{plugin.description}</p>
                  <p className="text-xs text-neutral-400">
                    {plugin.agents?.length || 0} agents · {plugin.skills?.length || 0} skills
                  </p>
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
            {mcpServers.map((mcp) => (
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
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-sm text-neutral-400">Made with Claude Code</p>
        </div>
      </footer>
    </div>
  );
}
