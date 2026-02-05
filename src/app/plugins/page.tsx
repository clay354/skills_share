import Link from "next/link";
import { Plugin } from "@/data/plugins";
import redis, { REDIS_KEYS } from "@/lib/redis";

export const dynamic = "force-dynamic";

async function getPlugins(): Promise<Plugin[]> {
  try {
    return await redis.get<Plugin[]>(REDIS_KEYS.plugins) || [];
  } catch {
    return [];
  }
}

export default async function PluginsPage() {
  const plugins = await getPlugins();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="inline-block text-sm text-neutral-500 hover:text-black mb-12">
          ← back
        </Link>

        <h1 className="text-2xl font-medium text-black mb-2">Plugins</h1>
        <p className="text-neutral-500 mb-12">에이전트와 스킬을 추가하는 플러그인</p>

        <div className="space-y-4">
          {plugins.map((plugin) => (
            <Link key={plugin.id} href={`/plugins/${plugin.id}`}>
              <div className="p-5 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-black font-medium">{plugin.name}</h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    {plugin.agents?.length || 0} agents · {plugin.skills?.length || 0} skills
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mb-4">{plugin.description}</p>
                <div className="flex flex-wrap gap-2">
                  {plugin.features.slice(0, 3).map((feature, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
