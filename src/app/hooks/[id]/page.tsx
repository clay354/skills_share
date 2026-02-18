import { notFound } from "next/navigation";
import Link from "next/link";
import { Hook } from "@/data/hooks";
import { generateHookInstallPrompt } from "@/lib/installPrompts";
import { CopyButton } from "@/components/CopyButton";
import redis, { REDIS_KEYS } from "@/lib/redis";
import { diffLines, type Change } from "diff";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

function computeDiff(oldText: string, newText: string): { changes: Change[]; addedCount: number; removedCount: number } {
  const changes = diffLines(oldText, newText);
  let addedCount = 0;
  let removedCount = 0;
  for (const change of changes) {
    const lineCount = change.value.replace(/\n$/, '').split('\n').length;
    if (change.added) addedCount += lineCount;
    if (change.removed) removedCount += lineCount;
  }
  return { changes, addedCount, removedCount };
}

function buildVersionContent(ver: { command: string; scriptContent?: string; matcher?: string; timeout?: number }): string {
  let content = ver.command;
  if (ver.scriptContent) content += '\n---\n' + ver.scriptContent;
  if (ver.matcher) content += '\n---\nmatcher: ' + ver.matcher;
  if (ver.timeout) content += '\ntimeout: ' + ver.timeout;
  return content;
}

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

  // Build version list
  let displayVersions = hook.versions && hook.versions.length > 0
    ? [...hook.versions]
    : [];

  if (displayVersions.length === 0 && hook.command) {
    displayVersions = [{
      version: hook.currentVersion || 1,
      command: hook.command,
      scriptContent: hook.scriptContent,
      matcher: hook.matcher,
      timeout: hook.timeout,
      updatedAt: hook.updatedAt || '',
      updatedBy: hook.updatedBy || '',
    }];
  }

  const sortedVersions = displayVersions.sort((a, b) => b.version - a.version);
  const hasVersions = sortedVersions.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="inline-block text-sm text-neutral-500 hover:text-black mb-8">
          ← Back
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-700 rounded">
              {hook.category}
            </span>
            <span className="text-xs px-2 py-1 bg-neutral-800 text-white rounded">
              {hook.event}
            </span>
            {hook.currentVersion && (
              <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">
                v{hook.currentVersion}
              </span>
            )}
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
          <h2 className="font-medium text-black mb-3">
            Install {hook.currentVersion && <span className="text-neutral-400 font-normal">(v{hook.currentVersion} - Latest)</span>}
          </h2>
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

        {/* Version History */}
        <div className="border-t border-neutral-100 pt-8 mt-8">
          <h2 className="font-medium text-black mb-4">Version History</h2>
          {hasVersions && sortedVersions.length > 0 ? (
            <div className="space-y-3">
              {sortedVersions.map((ver, idx) => {
                const versionInstallPrompt = generateHookInstallPrompt(hook, {
                  command: ver.command,
                  scriptContent: ver.scriptContent,
                  matcher: ver.matcher,
                  timeout: ver.timeout,
                });
                const isLatest = ver.version === hook.currentVersion;
                const prevVersion = sortedVersions[idx + 1];
                const diff = prevVersion
                  ? computeDiff(buildVersionContent(prevVersion), buildVersionContent(ver))
                  : null;
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
                        {diff && (diff.addedCount > 0 || diff.removedCount > 0) && (
                          <span className="text-xs text-neutral-400">
                            {diff.addedCount > 0 && <span className="text-green-600">+{diff.addedCount}</span>}
                            {diff.addedCount > 0 && diff.removedCount > 0 && ' '}
                            {diff.removedCount > 0 && <span className="text-red-500">-{diff.removedCount}</span>}
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
                    <div className="flex flex-wrap gap-2">
                      <CopyButton
                        text={versionInstallPrompt}
                        label={isLatest ? "Copy Install Prompt" : `Install v${ver.version}`}
                        className="text-xs"
                      />
                      <details className="flex-1 min-w-0">
                        <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-700 py-2">
                          View content
                        </summary>
                        <div className="mt-2 p-3 bg-white border rounded text-xs font-mono overflow-x-auto max-h-40 space-y-2">
                          <div>
                            <span className="text-neutral-400">command:</span>
                            <pre className="text-neutral-600 mt-1">{ver.command}</pre>
                          </div>
                          {ver.scriptContent && (
                            <div>
                              <span className="text-neutral-400">script:</span>
                              <pre className="text-neutral-600 mt-1">{ver.scriptContent}</pre>
                            </div>
                          )}
                          {ver.matcher && (
                            <div>
                              <span className="text-neutral-400">matcher:</span> <span className="text-neutral-600">{ver.matcher}</span>
                            </div>
                          )}
                        </div>
                      </details>
                      {diff && (diff.addedCount > 0 || diff.removedCount > 0) && (
                        <details className="w-full">
                          <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-700 py-1">
                            View changes from v{prevVersion.version}
                          </summary>
                          <div className="mt-2 p-3 bg-white border rounded text-xs font-mono overflow-x-auto max-h-48">
                            {diff.changes.map((change, i) => {
                              const lines = change.value.replace(/\n$/, '').split('\n');
                              return lines.map((line, j) => (
                                <div
                                  key={`${i}-${j}`}
                                  className={
                                    change.added ? "text-green-700 bg-green-50 px-1" :
                                    change.removed ? "text-red-600 bg-red-50 px-1" :
                                    "text-neutral-400 px-1"
                                  }
                                >
                                  {change.added ? '+ ' : change.removed ? '- ' : '  '}{line}
                                </div>
                              ));
                            })}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">버전 히스토리 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}
