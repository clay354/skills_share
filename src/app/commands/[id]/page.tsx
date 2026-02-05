import { notFound } from "next/navigation";
import Link from "next/link";
import { commands, Command } from "@/data/commands";
import { generateCommandInstallPrompt } from "@/lib/installPrompts";
import { CopyButton } from "@/components/CopyButton";
import redis, { REDIS_KEYS } from "@/lib/redis";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

async function getCommandById(id: string): Promise<Command | undefined> {
  // First check static data
  const staticCmd = commands.find((cmd) => cmd.id === id);
  if (staticCmd) return staticCmd;

  // Then check Redis for uploaded data
  try {
    const uploadedCommands = await redis.get<Command[]>(REDIS_KEYS.commands) || [];
    return uploadedCommands.find((cmd) => cmd.id === id);
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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="inline-block text-sm text-neutral-500 hover:text-black mb-8">
          ← Back
        </Link>

        {/* Header */}
        <div className="mb-8">
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
            {command.category}
          </span>
          <h1 className="text-2xl font-semibold text-black mt-3 mb-2">{command.name}</h1>
          <p className="text-neutral-600">{command.description}</p>
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
                View file content
              </summary>
              <pre className="mt-3 p-3 bg-white border rounded text-xs text-neutral-600 overflow-x-auto max-h-64">
                {command.content}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
