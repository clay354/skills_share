"use client";

import { useState } from "react";

export function QuickInstall() {
  const [copied, setCopied] = useState(false);
  const installCommand = "claude mcp add skills-share -- npx -y skills-share-mcp";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 pb-12">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
            Quick Start
          </span>
        </div>
        <h2 className="text-lg font-semibold text-black mb-2">
          MCP 서버로 한 번에 설치하기
        </h2>
        <p className="text-sm text-neutral-600 mb-4">
          아래 명령어를 터미널에서 실행하면, Claude Code에서 이 사이트의 모든 확장 기능을 바로 설치할 수 있습니다.
        </p>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-4">
          <code className="text-sm text-neutral-800 break-all">
            {installCommand}
          </code>
        </div>

        <button
          onClick={handleCopy}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
            copied
              ? "bg-green-500 text-white"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          {copied ? "Copied!" : "Copy Command"}
        </button>

        <p className="text-xs text-neutral-500 mt-4 text-center">
          설치 후 Claude Code를 재시작하세요. 그러면 &ldquo;skills-share에서 pr-description 설치해줘&rdquo; 같은 요청이 가능해집니다.
        </p>
      </div>
    </div>
  );
}
