import { notFound } from "next/navigation";
import Link from "next/link";
import { MCPServer } from "@/data/mcp";
import { generateMCPInstallPrompt } from "@/lib/installPrompts";
import { CopyButton } from "@/components/CopyButton";
import redis, { REDIS_KEYS } from "@/lib/redis";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

async function getMCPById(id: string): Promise<MCPServer | undefined> {
  try {
    const mcpServers = await redis.get<MCPServer[]>(REDIS_KEYS.mcpServers) || [];
    return mcpServers.find((m) => m.id === id);
  } catch {
    return undefined;
  }
}

export default async function MCPDetailPage({ params }: PageProps) {
  const { id } = await params;
  const mcp = await getMCPById(id);

  if (!mcp) {
    notFound();
  }

  const installPrompt = generateMCPInstallPrompt(mcp);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="inline-block text-sm text-neutral-500 hover:text-black mb-8">
          ← Back
        </Link>

        {/* Header */}
        <div className="mb-8">
          <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded">
            {mcp.category}
          </span>
          <h1 className="text-2xl font-semibold text-black mt-3 mb-2">{mcp.name}</h1>
          <p className="text-neutral-600">{mcp.description}</p>
        </div>

        {/* Install */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 mb-8">
          <h2 className="font-medium text-black mb-3">Install</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Copy the prompt below and paste it into Claude Code.
          </p>
          <CopyButton
            text={installPrompt}
            label="Copy Install Prompt"
            className="w-full justify-center"
          />
        </div>

        {/* Setup Steps */}
        {mcp.setupSteps && mcp.setupSteps.length > 0 && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <h2 className="font-medium text-amber-800 mb-3">Setup Required</h2>
            <ol className="space-y-2">
              {mcp.setupSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                  <span className="font-medium">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Tools */}
        {mcp.tools && mcp.tools.length > 0 && (
          <div className="mb-8">
            <h2 className="font-medium text-black mb-4">Tools ({mcp.tools.length})</h2>
            <div className="space-y-2">
              {mcp.tools.map((tool, i) => (
                <div key={i} className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-black font-mono">{tool.name}</p>
                  <p className="text-sm text-neutral-600 mt-1">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Examples */}
        <div className="mb-8">
          <h2 className="font-medium text-black mb-4">Examples</h2>
          <div className="space-y-3">
            {mcp.examples.map((ex, i) => (
              <div key={i} className="bg-neutral-50 rounded-xl p-4">
                <p className="text-sm text-black mb-1">{ex.description}</p>
                <p className="text-xs text-neutral-500">&ldquo;{ex.input}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="border-t border-neutral-100 pt-8">
          <h2 className="font-medium text-black mb-4">Details</h2>
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="text-sm text-neutral-600 space-y-2">
              <p>Type: {mcp.type}</p>
              <p>Scope: {mcp.installLocation === "global" ? "Global (~/.claude.json)" : "Project"}</p>
              {mcp.updatedAt && (
                <p className="text-neutral-500">
                  Updated: {new Date(mcp.updatedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {mcp.updatedBy && <span> by <span className="font-medium text-neutral-600">{mcp.updatedBy}</span></span>}
                </p>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-neutral-500 hover:text-neutral-700">
                  View config
                </summary>
                <pre className="mt-2 p-3 bg-white border rounded overflow-x-auto text-xs">
                  {JSON.stringify(mcp.config, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>

        {/* Version History - only for isOwned MCPs */}
        {mcp.isOwned && (
          <div className="border-t border-neutral-100 pt-8 mt-8">
            <h2 className="font-medium text-black mb-4">Version History</h2>
            {mcp.versions && mcp.versions.length > 1 ? (
              <div className="space-y-3">
                {[...mcp.versions].sort((a, b) => b.version - a.version).map((ver) => {
                  const isLatest = ver.version === mcp.currentVersion;
                  const versionInstallPrompt = generateMCPInstallPrompt(mcp, ver.config);
                  return (
                    <div
                      key={ver.version}
                      className={`rounded-xl p-4 ${isLatest ? 'bg-green-50 border border-green-200' : 'bg-neutral-50'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isLatest ? 'text-green-700' : 'text-black'}`}>
                            v{ver.version}
                          </span>
                          {isLatest && (
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded">
                              Latest
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-neutral-500">
                          {new Date(ver.updatedAt).toLocaleDateString('ko-KR')} · {ver.updatedBy}
                        </span>
                      </div>
                      {ver.changelog && (
                        <p className="text-sm text-neutral-600 mb-3">{ver.changelog}</p>
                      )}
                      <div className="flex gap-2">
                        <CopyButton
                          text={versionInstallPrompt}
                          label={isLatest ? "Copy Install Prompt" : `Install v${ver.version}`}
                          className="text-xs"
                        />
                        <details className="flex-1">
                          <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-700 py-2">
                            View config
                          </summary>
                          <pre className="mt-2 p-3 bg-white border rounded text-xs text-neutral-600 overflow-x-auto max-h-40">
                            {JSON.stringify(ver.config, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-neutral-400">버전 히스토리 없음</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
