import { notFound } from "next/navigation";
import Link from "next/link";
import { Hook } from "@/data/hooks";
import { generateHookInstallPrompt } from "@/lib/installPrompts";
import { CopyButton } from "@/components/CopyButton";
import redis, { REDIS_KEYS } from "@/lib/redis";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

async function getHookById(id: string): Promise<Hook | undefined> {
  try {
    const hooks = await redis.get<Hook[]>(REDIS_KEYS.hooks) || [];
    return hooks.find((h) => h.id === id);
  } catch {
    return undefined;
  }
}

export default async function HookDetailPage({ params }: PageProps) {
  const { id } = await params;
  const hook = await getHookById(id);

  if (!hook) {
    notFound();
  }

  const installPrompt = generateHookInstallPrompt(hook);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="inline-block text-sm text-neutral-500 hover:text-black mb-8">
          ← Back
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded">
              {hook.category}
            </span>
            <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded">
              {hook.event}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-black mb-2">{hook.name}</h1>
          <p className="text-neutral-600">{hook.description}</p>
          {hook.updatedAt && (
            <p className="text-sm text-neutral-500 mt-3">
              Updated: {new Date(hook.updatedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {hook.updatedBy && <span> by <span className="font-medium text-neutral-600">{hook.updatedBy}</span></span>}
            </p>
          )}
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

        {/* Examples */}
        {hook.examples && hook.examples.length > 0 && (
          <div className="mb-8">
            <h2 className="font-medium text-black mb-4">Examples</h2>
            <div className="space-y-3">
              {hook.examples.map((ex, i) => (
                <div key={i} className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-sm text-black mb-1">{ex.description}</p>
                  <p className="text-xs text-neutral-500 font-mono">{ex.input}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="border-t border-neutral-100 pt-8">
          <h2 className="font-medium text-black mb-4">Details</h2>
          <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-sm text-neutral-500">Event</p>
              <p className="text-sm font-mono text-black">{hook.event}</p>
            </div>
            {hook.matcher && (
              <div>
                <p className="text-sm text-neutral-500">Matcher</p>
                <p className="text-sm font-mono text-black">{hook.matcher}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-neutral-500">Command</p>
              <pre className="text-sm font-mono text-black bg-white border rounded p-2 mt-1 overflow-x-auto">
                {hook.command}
              </pre>
            </div>
            {hook.timeout && (
              <div>
                <p className="text-sm text-neutral-500">Timeout</p>
                <p className="text-sm font-mono text-black">{hook.timeout}ms</p>
              </div>
            )}
            {hook.scriptPath && (
              <div>
                <p className="text-sm text-neutral-500">Script Path</p>
                <p className="text-sm font-mono text-black">{hook.scriptPath}</p>
              </div>
            )}
          </div>
        </div>

        {/* Script Content */}
        {hook.scriptContent && (
          <div className="border-t border-neutral-100 pt-8 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-black">Script Content</h2>
              <CopyButton
                text={hook.scriptContent}
                label="Copy Script"
                className="text-sm"
              />
            </div>
            <pre className="bg-neutral-900 text-neutral-100 rounded-xl p-4 text-sm font-mono overflow-x-auto max-h-96 overflow-y-auto">
              {hook.scriptContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
