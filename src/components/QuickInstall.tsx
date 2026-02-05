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
      <div className="bg-orange-100 border-4 border-orange-600 shadow-[6px_6px_0px_0px_rgba(194,65,12,1)] p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-1 bg-yellow-300 text-orange-900 font-bold border-2 border-orange-600">
            Quick Start
          </span>
        </div>
        <h2 className="text-xl font-bold text-orange-900 mb-2">
          MCP 서버로 한 번에 설치하기
        </h2>
        <p className="text-sm text-orange-700 font-medium mb-4">
          아래 버튼을 클릭해서 프롬프트를 복사한 후, Claude Code에 붙여넣기 하세요.
        </p>

        <button
          onClick={handleCopy}
          className={`w-full py-3 text-sm font-bold transition-all border-4 ${
            copied
              ? "bg-green-400 text-green-900 border-green-700 shadow-[4px_4px_0px_0px_rgba(21,128,61,1)]"
              : "bg-orange-500 text-white border-orange-800 shadow-[4px_4px_0px_0px_rgba(154,52,18,1)] hover:shadow-[6px_6px_0px_0px_rgba(154,52,18,1)] hover:-translate-x-0.5 hover:-translate-y-0.5"
          }`}
        >
          {copied ? "Copied!" : "Copy Install Prompt"}
        </button>

        <p className="text-xs text-orange-600 font-medium mt-4 text-center">
          설치 후 Claude Code를 재시작하세요. 그러면 &ldquo;skills-share에서 pr-description 설치해줘&rdquo; 같은 요청이 가능해집니다.
        </p>
      </div>
    </div>
  );
}
