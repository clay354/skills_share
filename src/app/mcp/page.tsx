import Link from "next/link";
import { mcpServers } from "@/data/mcp";

export default function MCPPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="inline-block text-sm text-neutral-500 hover:text-black mb-12">
          ← back
        </Link>

        <h1 className="text-2xl font-medium text-black mb-2">MCP Servers</h1>
        <p className="text-neutral-500 mb-12">외부 서비스 연동을 위한 MCP 설정</p>

        <div className="space-y-3">
          {mcpServers.map((mcp) => (
            <Link key={mcp.id} href={`/mcp/${mcp.id}`}>
              <div className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-black">{mcp.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span>{mcp.type}</span>
                    <span>·</span>
                    <span>{mcp.installLocation === "global" ? "global" : "project"}</span>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 pl-5">{mcp.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 pt-12 border-t border-neutral-200">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-6">Config files</p>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-4">
              <span className="text-neutral-500 w-16 shrink-0">global</span>
              <code className="text-neutral-700">~/.claude.json</code>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-neutral-500 w-16 shrink-0">project</span>
              <code className="text-neutral-700">.claude/settings.local.json</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
