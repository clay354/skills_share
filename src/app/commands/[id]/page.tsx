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
  const hasVersions = command.versions && command.versions.length > 0;
  const sortedVersions = hasVersions
    ? [...command.versions!].sort((a, b) => b.version - a.version)
    : [];

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
            <p className="text-xs text-neutral-400 mt-2">
              {new Date(command.updatedAt).toLocaleDateString('ko-KR')} · {command.updatedBy}
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
          {hasVersions && sortedVersions.length > 1 ? (
            <div className="space-y-3">
              {sortedVersions.map((ver) => {
                const versionInstallPrompt = generateCommandInstallPrompt(command, ver.content);
                const isLatest = ver.version === command.currentVersion;
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
                          View content
                        </summary>
                        <pre className="mt-2 p-3 bg-white border rounded text-xs text-neutral-600 overflow-x-auto max-h-40">
                          {ver.content}
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
      </div>
    </div>
  );
}
