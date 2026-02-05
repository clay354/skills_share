import Link from "next/link";
import { changelog } from "@/data/changelog";

const typeColors = {
  feature: "bg-green-50 text-green-700",
  fix: "bg-red-50 text-red-700",
  improvement: "bg-blue-50 text-blue-700",
  breaking: "bg-orange-50 text-orange-700",
};

const typeLabels = {
  feature: "NEW",
  fix: "FIX",
  improvement: "IMPROVED",
  breaking: "BREAKING",
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link href="/" className="text-neutral-500 hover:text-black text-sm">
            ← Back
          </Link>
        </div>
      </div>

      {/* Title */}
      <div className="max-w-2xl mx-auto px-6 pt-12 pb-8">
        <h1 className="text-2xl font-semibold text-black mb-2">Changelog</h1>
        <p className="text-neutral-500">Skills Share 업데이트 내역</p>
      </div>

      {/* Changelog List */}
      <div className="max-w-2xl mx-auto px-6 pb-16">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-neutral-200" />

          <div className="space-y-8">
            {changelog.map((entry, index) => (
              <div key={entry.version} className="relative pl-8">
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 top-2 w-4 h-4 rounded-full border-2 ${
                    index === 0
                      ? "bg-black border-black"
                      : "bg-white border-neutral-300"
                  }`}
                />

                {/* Version card */}
                <div className="border border-neutral-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg font-semibold text-black">
                      v{entry.version}
                    </span>
                    <span className="text-sm text-neutral-400">
                      {entry.date}
                    </span>
                  </div>

                  <h3 className="font-medium text-black mb-4">{entry.title}</h3>

                  <ul className="space-y-2">
                    {entry.changes.map((change, changeIndex) => (
                      <li key={changeIndex} className="flex items-start gap-2">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                            typeColors[change.type]
                          }`}
                        >
                          {typeLabels[change.type]}
                        </span>
                        <span className="text-sm text-neutral-700">
                          {change.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-sm text-neutral-400">Made with Claude Code</p>
        </div>
      </footer>
    </div>
  );
}
