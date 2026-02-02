import { notFound } from "next/navigation";
import Link from "next/link";
import { mcpServers } from "@/data/mcp";
import { generateMCPInstallPrompt } from "@/lib/installPrompts";
import { CopyButton } from "@/components/CopyButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return mcpServers.map((mcp) => ({ id: mcp.id }));
}

export default async function MCPDetailPage({ params }: PageProps) {
  const { id } = await params;
  const mcp = mcpServers.find((m) => m.id === id);

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
      </div>
    </div>
  );
}
