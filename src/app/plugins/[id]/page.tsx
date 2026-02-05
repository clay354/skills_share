import { notFound } from "next/navigation";
import Link from "next/link";
import { Plugin } from "@/data/plugins";
import { generatePluginInstallPrompt } from "@/lib/installPrompts";
import { CopyButton } from "@/components/CopyButton";
import redis, { REDIS_KEYS } from "@/lib/redis";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

async function getPluginById(id: string): Promise<Plugin | undefined> {
  try {
    const plugins = await redis.get<Plugin[]>(REDIS_KEYS.plugins) || [];
    return plugins.find((p) => p.id === id);
  } catch {
    return undefined;
  }
}

export default async function PluginDetailPage({ params }: PageProps) {
  const { id } = await params;
  const plugin = await getPluginById(id);

  if (!plugin) {
    notFound();
  }

  const installPrompt = generatePluginInstallPrompt(plugin);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="inline-block text-sm text-neutral-500 hover:text-black mb-8">
          ← Back
        </Link>

        {/* Header */}
        <div className="mb-8">
          <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">
            {plugin.category}
          </span>
          <h1 className="text-2xl font-semibold text-black mt-3 mb-2">{plugin.name}</h1>
          <p className="text-neutral-600">{plugin.description}</p>
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
            {plugin.examples.map((ex, i) => (
              <div key={i} className="bg-neutral-50 rounded-xl p-4">
                <p className="text-sm text-black mb-1">{ex.description}</p>
                <p className="text-xs text-neutral-500">{ex.input}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h2 className="font-medium text-black mb-4">Features</h2>
          <ul className="space-y-2">
            {plugin.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                <span className="text-green-500">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Details */}
        <div className="border-t border-neutral-100 pt-8">
          <h2 className="font-medium text-black mb-4">Details</h2>
          <div className="bg-neutral-50 rounded-xl p-4 space-y-4">
            {plugin.agents && plugin.agents.length > 0 && (
              <div>
                <p className="text-sm text-neutral-500 mb-2">Agents ({plugin.agents.length})</p>
                <div className="flex flex-wrap gap-1">
                  {plugin.agents.map((agent) => (
                    <span key={agent} className="text-xs px-2 py-1 bg-white border rounded">
                      {agent}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {plugin.skills && plugin.skills.length > 0 && (
              <div>
                <p className="text-sm text-neutral-500 mb-2">Skills ({plugin.skills.length})</p>
                <div className="flex flex-wrap gap-1">
                  {plugin.skills.map((skill) => (
                    <span key={skill} className="text-xs px-2 py-1 bg-white border rounded font-mono">
                      /{skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
