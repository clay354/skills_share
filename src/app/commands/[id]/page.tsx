import { notFound } from "next/navigation";
import Link from "next/link";
import { Command } from "@/data/commands";
import { generateCommandInstallPrompt } from "@/lib/installPrompts";
import { CopyButton } from "@/components/CopyButton";
import redis, { REDIS_KEYS } from "@/lib/redis";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

// Simple line-based diff between two texts
function computeDiff(oldText: string, newText: string): { added: string[]; removed: string[]; } {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  const removed = oldLines.filter(line => !newSet.has(line) && line.trim() !== '');
  const added = newLines.filter(line => !oldSet.has(line) && line.trim() !== '');
  return { added, removed };
}

async function getCommandById(id: string): Promise<Command | undefined> {
  try {
    const commands = await redis.get<Command[]>(REDIS_KEYS.commands) || [];
    return commands.find((cmd) => cmd.id === id);
  } catch {
    return undefined;
  }
}

export default async function CommandDetailPage({ params }: PageProps) {
  const { id } = await params;
  const command = await getCommandById(id);

  if (!command) {
    notFound();
  }

  const installPrompt = generateCommandInstallPrompt(command);

  // Build version list: use existing versions, or synthesize v1 from current content for legacy data
  let displayVersions = command.versions && command.versions.length > 0
    ? [...command.versions]
    : [];

  if (displayVersions.length === 0 && command.content) {
    // Legacy command without versions array — synthesize v1
    displayVersions = [{
      version: command.currentVersion || 1,
      content: command.content,
      updatedAt: command.updatedAt || '',
      updatedBy: command.updatedBy || '',
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
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
              {command.category}
            </span>
            {command.currentVersion && (
              <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">
                v{command.currentVersion}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-black mb-2">{command.name}</h1>
          <p className="text-neutral-600">{command.description}</p>
          {command.updatedAt && (
            <p className="text-sm text-neutral-500 mt-3">
              Updated: {new Date(command.updatedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {command.updatedBy && <span> by <span className="font-medium text-neutral-600">{command.updatedBy}</span></span>}
            </p>
          )}
        </div>

        {/* Install (Latest) */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 mb-8">
          <h2 className="font-medium text-black mb-3">
            Install {command.currentVersion && <span className="text-neutral-400 font-normal">(v{command.currentVersion} - Latest)</span>}
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
        <div className="mb-8">
          <h2 className="font-medium text-black mb-4">Examples</h2>
          <div className="space-y-3">
            {command.examples.map((ex, i) => (
              <div key={i} className="bg-neutral-50 rounded-xl p-4">
                <p className="text-sm text-black mb-1">{ex.description}</p>
                <p className="text-xs text-neutral-500 font-mono">{ex.input}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="border-t border-neutral-100 pt-8">
          <h2 className="font-medium text-black mb-4">Details</h2>
          <div className="bg-neutral-50 rounded-xl p-4">
            <p className="text-sm text-neutral-600 mb-2">
              Path: <span className="font-mono">{command.installPath}</span>
            </p>
            <p className="text-sm text-neutral-600 mb-4">
              Usage: <span className="font-mono">/{command.id}</span>
            </p>
            <details>
              <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700">
                View current file content
              </summary>
              <pre className="mt-3 p-3 bg-white border rounded text-xs text-neutral-600 overflow-x-auto max-h-64">
                {command.content}
              </pre>
            </details>
          </div>
        </div>

        {/* Version History */}
        <div className="border-t border-neutral-100 pt-8 mt-8">
          <h2 className="font-medium text-black mb-4">Version History</h2>
          {hasVersions && sortedVersions.length > 0 ? (
            <div className="space-y-3">
              {sortedVersions.map((ver, idx) => {
                const versionInstallPrompt = generateCommandInstallPrompt(command, ver.content);
                const isLatest = ver.version === command.currentVersion;
                const prevVersion = sortedVersions[idx + 1];
                const diff = prevVersion ? computeDiff(prevVersion.content, ver.content) : null;
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
                        {diff && (diff.added.length > 0 || diff.removed.length > 0) && (
                          <span className="text-xs text-neutral-400">
                            {diff.added.length > 0 && <span className="text-green-600">+{diff.added.length}</span>}
                            {diff.added.length > 0 && diff.removed.length > 0 && ' '}
                            {diff.removed.length > 0 && <span className="text-red-500">-{diff.removed.length}</span>}
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
                        <pre className="mt-2 p-3 bg-white border rounded text-xs text-neutral-600 overflow-x-auto max-h-40">
                          {ver.content}
                        </pre>
                      </details>
                      {diff && (diff.added.length > 0 || diff.removed.length > 0) && (
                        <details className="w-full">
                          <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-700 py-1">
                            View changes from v{prevVersion.version}
                          </summary>
                          <div className="mt-2 p-3 bg-white border rounded text-xs font-mono overflow-x-auto max-h-48">
                            {diff.removed.map((line, i) => (
                              <div key={`r-${i}`} className="text-red-600 bg-red-50 px-1">- {line}</div>
                            ))}
                            {diff.added.map((line, i) => (
                              <div key={`a-${i}`} className="text-green-700 bg-green-50 px-1">+ {line}</div>
                            ))}
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
