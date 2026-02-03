"use client";

import { useState } from "react";

const installPrompt = `다음 MCP 서버를 전역 설정에 추가해주세요.

## MCP 서버 정보
- **이름**: Skills Share MCP
- **타입**: stdio
- **설명**: skills-share 웹사이트의 커맨드, 플러그인, MCP 설정을 Claude Code에 바로 설치할 수 있게 해주는 메타 MCP 서버

## 설치 방법

\`~/.claude.json\` 파일의 \`mcpServers\` 섹션에 다음을 추가하세요:

\`\`\`json
"skills-share": {
  "command": "npx",
  "args": ["-y", "skills-share-mcp"]
}
\`\`\`

## 추가 설정
1. Node.js 18+ 설치 필요
2. 설치 후 Claude Code를 재시작하세요`;

export function QuickInstall() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installPrompt);
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
          아래 버튼을 클릭해서 프롬프트를 복사한 후, Claude Code에 붙여넣기 하세요.
        </p>

        <button
          onClick={handleCopy}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
            copied
              ? "bg-green-500 text-white"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          {copied ? "Copied!" : "Copy Install Prompt"}
        </button>

        <p className="text-xs text-neutral-500 mt-4 text-center">
          설치 후 Claude Code를 재시작하세요. 그러면 &ldquo;skills-share에서 pr-description 설치해줘&rdquo; 같은 요청이 가능해집니다.
        </p>
      </div>
    </div>
  );
}
