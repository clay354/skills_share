import { Command } from "@/data/commands";
import { Plugin } from "@/data/plugins";
import { MCPServer } from "@/data/mcp";

export function generateCommandInstallPrompt(command: Command, versionContent?: string): string {
  const content = versionContent || command.content;
  return `다음 커스텀 커맨드를 설치해주세요.

## 설치 경로
\`${command.installPath}\`

## 파일 내용
\`\`\`markdown
${content}
\`\`\`

위 내용을 \`${command.installPath}\` 경로에 저장해주세요. 디렉토리가 없으면 생성해주세요.`;
}

export function generatePluginInstallPrompt(plugin: Plugin): string {
  return `다음 플러그인을 설치해주세요.

## 플러그인 정보
- **이름**: ${plugin.name}
- **마켓플레이스**: ${plugin.marketplace}

## 설치 방법

### 1. 마켓플레이스 추가 (처음 한 번만)
Claude Code에서 다음 명령어를 실행하세요:
\`\`\`
/install-marketplace https://github.com/anthropics/coding-basic-plugins
\`\`\`

### 2. 플러그인 설치
마켓플레이스 추가 후 다음 명령어로 플러그인을 설치하세요:
\`\`\`
${plugin.installCommand}
\`\`\`

### 3. 플러그인 활성화
설치 후 \`~/.claude/settings.json\`에서 플러그인이 활성화되어 있는지 확인하세요:
\`\`\`json
{
  "enabledPlugins": {
    "${plugin.id}@${plugin.marketplace}": true
  }
}
\`\`\``;
}

export function generateMCPInstallPrompt(mcp: MCPServer): string {
  const configJson = JSON.stringify(mcp.config, null, 2);

  if (mcp.installLocation === "global") {
    return `다음 MCP 서버를 전역 설정에 추가해주세요.

## MCP 서버 정보
- **이름**: ${mcp.name}
- **타입**: ${mcp.type}

## 설치 방법

\`~/.claude.json\` 파일의 \`mcpServers\` 섹션에 다음을 추가하세요:

\`\`\`json
"${mcp.id}": ${configJson}
\`\`\`

${mcp.setupSteps ? `## 추가 설정\n${mcp.setupSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}` : ""}`;
  } else {
    return `다음 MCP 서버를 프로젝트 설정에 추가해주세요.

## MCP 서버 정보
- **이름**: ${mcp.name}
- **타입**: ${mcp.type}

## 설치 방법

현재 프로젝트의 \`.claude/settings.local.json\` 또는 \`~/.claude.json\`의 프로젝트별 설정에서 \`mcpServers\`에 다음을 추가하세요:

\`\`\`json
"${mcp.id}": ${configJson}
\`\`\`

${mcp.setupSteps ? `## 추가 설정\n${mcp.setupSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}` : ""}`;
  }
}
