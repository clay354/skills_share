import Link from "next/link";
import { commands } from "@/data/commands";

export default function CommandsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="inline-block text-sm text-neutral-500 hover:text-black mb-12">
          ← back
        </Link>

        <h1 className="text-2xl font-medium text-black mb-2">Commands</h1>
        <p className="text-neutral-500 mb-12">
          <code className="text-neutral-700">/command</code> 형태로 실행
        </p>

        <div className="space-y-1">
          {commands.map((cmd) => (
            <Link key={cmd.id} href={`/commands/${cmd.id}`}>
              <div className="group p-4 -mx-4 rounded-lg hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <code className="text-black font-mono">/{cmd.id}</code>
                  <span className="text-xs text-neutral-400">{cmd.category}</span>
                </div>
                <p className="text-sm text-neutral-600">{cmd.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
