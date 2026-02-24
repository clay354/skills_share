#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// API Base URL - Vercel에 배포된 웹사이트
const API_BASE_URL = process.env.SKILLS_SHARE_API_URL || "https://skills-share-beta.vercel.app";

// API 호출 헬퍼 (GET)
async function fetchAPI(endpoint: string): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/api${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

// API 호출 헬퍼 (POST)
async function postAPI(endpoint: string, data: unknown): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error((result as { error?: string }).error || `API error: ${response.status}`);
  }
  return result;
}

// API 호출 헬퍼 (PUT)
async function putAPI(endpoint: string, data: unknown): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error((result as { error?: string }).error || `API error: ${response.status}`);
  }
  return result;
}

interface CommandVersion {
  version: number;
  content: string;
  updatedAt: string;
  updatedBy: string;
  changelog?: string;
}

interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  installPath: string;
  examples: { input: string; description: string }[];
  updatedAt?: string;
  updatedBy?: string;
  currentVersion?: number;
  versions?: CommandVersion[];
}

interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  config: Record<string, unknown>;
  installLocation: string;
  setupSteps?: string[];
  examples: { input: string; description: string }[];
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  marketplace: string;
  installCommand: string;
  features: string[];
  agents?: string[];
  skills?: string[];
  examples: { input: string; description: string }[];
  updatedAt?: string;
  updatedBy?: string;
}

interface Hook {
  id: string;
  name: string;
  description: string;
  category: string;
  event: string;
  matcher?: string;
  command: string;
  scriptContent?: string;
  scriptPath?: string;
  timeout?: number;
  examples: { input: string; description: string }[];
}

const server = new Server(
  {
    name: "skills-share",
    version: "1.5.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_commands",
        description: "사용 가능한 커맨드 목록을 조회합니다. 카테고리별 필터링 가능.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "필터링할 카테고리 (선택사항)",
            },
          },
        },
      },
      {
        name: "list_mcp_servers",
        description: "사용 가능한 MCP 서버 목록을 조회합니다.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "필터링할 카테고리 (선택사항)",
            },
          },
        },
      },
      {
        name: "list_plugins",
        description: "사용 가능한 플러그인 목록을 조회합니다.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_command_detail",
        description: "특정 커맨드의 상세 정보와 버전 히스토리를 조회합니다. version을 지정하면 해당 버전의 내용을 반환합니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "커맨드 ID",
            },
            version: {
              type: "number",
              description: "조회할 버전 번호 (선택사항, 미지정 시 최신 버전 + 버전 히스토리 표시)",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "get_mcp_detail",
        description: "특정 MCP 서버의 상세 정보와 설정을 조회합니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "MCP 서버 ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "get_plugin_detail",
        description: "특정 플러그인의 상세 정보를 조회합니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "플러그인 ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "install_command",
        description: "커맨드를 ~/.claude/commands/ 폴더에 설치합니다. version을 지정하면 해당 버전을 설치합니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "설치할 커맨드 ID",
            },
            version: {
              type: "number",
              description: "설치할 버전 번호 (선택사항, 미지정 시 최신 버전 설치)",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "install_mcp",
        description: "MCP 서버 설정을 출력합니다. 사용자가 직접 설정 파일에 추가해야 합니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "설치할 MCP 서버 ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "install_plugin",
        description: "플러그인 설치 안내를 출력합니다. 마켓플레이스 추가 및 플러그인 설치 명령어를 제공합니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "설치할 플러그인 ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "search",
        description: "커맨드, MCP, 플러그인을 키워드로 검색합니다.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "검색 키워드",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "upload_command",
        description: "로컬 커맨드 파일을 Skills Share에 업로드합니다.",
        inputSchema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "업로드할 커맨드 파일 경로 (예: ~/.claude/commands/my-command.md)",
            },
            id: {
              type: "string",
              description: "커맨드 ID (파일명에서 추출됨, 선택사항)",
            },
            name: {
              type: "string",
              description: "커맨드 이름",
            },
            category: {
              type: "string",
              description: "카테고리 (예: Web, Design, Documentation)",
            },
            description: {
              type: "string",
              description: "커맨드 설명",
            },
            authorName: {
              type: "string",
              description: "작성자 이름",
            },
          },
          required: ["file_path", "name", "category", "description", "authorName"],
        },
      },
      {
        name: "upload_mcp",
        description: "MCP 서버 설정을 Skills Share에 업로드합니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "MCP 서버 ID",
            },
            name: {
              type: "string",
              description: "MCP 서버 이름",
            },
            description: {
              type: "string",
              description: "MCP 서버 설명",
            },
            category: {
              type: "string",
              description: "카테고리",
            },
            type: {
              type: "string",
              enum: ["stdio", "http", "sse"],
              description: "MCP 타입",
            },
            config: {
              type: "object",
              description: "MCP 설정 객체 (command, args 등)",
            },
            installLocation: {
              type: "string",
              enum: ["global", "project"],
              description: "설치 위치 (기본: global)",
            },
            setupSteps: {
              type: "array",
              items: { type: "string" },
              description: "설정 단계 목록",
            },
            authorName: {
              type: "string",
              description: "작성자 이름",
            },
          },
          required: ["id", "name", "type", "config", "authorName"],
        },
      },
      {
        name: "upload_plugin",
        description: "플러그인 정보를 Skills Share에 업로드합니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "플러그인 ID",
            },
            name: {
              type: "string",
              description: "플러그인 이름",
            },
            description: {
              type: "string",
              description: "플러그인 설명",
            },
            category: {
              type: "string",
              description: "카테고리",
            },
            marketplace: {
              type: "string",
              description: "마켓플레이스 이름",
            },
            features: {
              type: "array",
              items: { type: "string" },
              description: "주요 기능 목록",
            },
            agents: {
              type: "array",
              items: { type: "string" },
              description: "포함된 에이전트 목록",
            },
            skills: {
              type: "array",
              items: { type: "string" },
              description: "포함된 스킬 목록",
            },
            authorName: {
              type: "string",
              description: "작성자 이름",
            },
          },
          required: ["id", "name", "marketplace", "authorName"],
        },
      },
      {
        name: "update_command",
        description: "기존에 업로드한 커맨드를 업데이트합니다. 빌트인 커맨드는 업데이트할 수 없습니다.",
        inputSchema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "업데이트할 커맨드 파일 경로 (예: ~/.claude/commands/my-command.md)",
            },
            id: {
              type: "string",
              description: "업데이트할 커맨드 ID",
            },
            name: {
              type: "string",
              description: "커맨드 이름 (선택사항)",
            },
            category: {
              type: "string",
              description: "카테고리 (선택사항)",
            },
            description: {
              type: "string",
              description: "커맨드 설명 (선택사항)",
            },
            changelog: {
              type: "string",
              description: "변경 내용 요약 (선택사항, 버전 히스토리에 표시됨)",
            },
            authorName: {
              type: "string",
              description: "작성자 이름",
            },
          },
          required: ["id", "authorName"],
        },
      },
      {
        name: "update_mcp",
        description: "기존에 업로드한 MCP 서버를 업데이트합니다. 빌트인 MCP는 업데이트할 수 없습니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "업데이트할 MCP 서버 ID",
            },
            name: {
              type: "string",
              description: "MCP 서버 이름 (선택사항)",
            },
            description: {
              type: "string",
              description: "MCP 서버 설명 (선택사항)",
            },
            category: {
              type: "string",
              description: "카테고리 (선택사항)",
            },
            type: {
              type: "string",
              enum: ["stdio", "http", "sse"],
              description: "MCP 타입 (선택사항)",
            },
            config: {
              type: "object",
              description: "MCP 설정 객체 (선택사항)",
            },
            installLocation: {
              type: "string",
              enum: ["global", "project"],
              description: "설치 위치 (선택사항)",
            },
            setupSteps: {
              type: "array",
              items: { type: "string" },
              description: "설정 단계 목록 (선택사항)",
            },
            authorName: {
              type: "string",
              description: "작성자 이름",
            },
          },
          required: ["id", "authorName"],
        },
      },
      {
        name: "update_plugin",
        description: "기존에 업로드한 플러그인을 업데이트합니다. 빌트인 플러그인은 업데이트할 수 없습니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "업데이트할 플러그인 ID",
            },
            name: {
              type: "string",
              description: "플러그인 이름 (선택사항)",
            },
            description: {
              type: "string",
              description: "플러그인 설명 (선택사항)",
            },
            category: {
              type: "string",
              description: "카테고리 (선택사항)",
            },
            marketplace: {
              type: "string",
              description: "마켓플레이스 이름 (선택사항)",
            },
            features: {
              type: "array",
              items: { type: "string" },
              description: "주요 기능 목록 (선택사항)",
            },
            agents: {
              type: "array",
              items: { type: "string" },
              description: "포함된 에이전트 목록 (선택사항)",
            },
            skills: {
              type: "array",
              items: { type: "string" },
              description: "포함된 스킬 목록 (선택사항)",
            },
            authorName: {
              type: "string",
              description: "작성자 이름",
            },
          },
          required: ["id", "authorName"],
        },
      },
      {
        name: "list_hooks",
        description: "사용 가능한 Hook 목록을 조회합니다.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "필터링할 카테고리 (선택사항)",
            },
            event: {
              type: "string",
              enum: ["PreToolUse", "PostToolUse", "Notification", "Stop"],
              description: "필터링할 이벤트 타입 (선택사항)",
            },
          },
        },
      },
      {
        name: "get_hook_detail",
        description: "특정 Hook의 상세 정보를 조회합니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Hook ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "install_hook",
        description: "Hook 설정을 출력합니다. 사용자가 직접 settings.json에 추가해야 합니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "설치할 Hook ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "upload_hook",
        description: "Hook을 Skills Share에 업로드합니다. file_path를 제공하면 스크립트 파일도 함께 저장됩니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Hook ID",
            },
            name: {
              type: "string",
              description: "Hook 이름",
            },
            description: {
              type: "string",
              description: "Hook 설명",
            },
            category: {
              type: "string",
              description: "카테고리",
            },
            event: {
              type: "string",
              enum: ["PreToolUse", "PostToolUse", "Notification", "Stop"],
              description: "이벤트 타입",
            },
            matcher: {
              type: "string",
              description: "매처 패턴 (선택사항)",
            },
            command: {
              type: "string",
              description: "실행할 명령어 (file_path 제공 시 자동 생성)",
            },
            file_path: {
              type: "string",
              description: "스크립트 파일 경로 (예: ~/.claude/hooks/my-hook.js)",
            },
            timeout: {
              type: "number",
              description: "타임아웃 (밀리초, 선택사항)",
            },
            authorName: {
              type: "string",
              description: "작성자 이름",
            },
          },
          required: ["id", "name", "event", "authorName"],
        },
      },
      {
        name: "update_hook",
        description: "기존에 업로드한 Hook을 업데이트합니다. file_path를 제공하면 스크립트 내용도 업데이트됩니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "업데이트할 Hook ID",
            },
            name: {
              type: "string",
              description: "Hook 이름 (선택사항)",
            },
            description: {
              type: "string",
              description: "Hook 설명 (선택사항)",
            },
            category: {
              type: "string",
              description: "카테고리 (선택사항)",
            },
            event: {
              type: "string",
              enum: ["PreToolUse", "PostToolUse", "Notification", "Stop"],
              description: "이벤트 타입 (선택사항)",
            },
            matcher: {
              type: "string",
              description: "매처 패턴 (선택사항)",
            },
            command: {
              type: "string",
              description: "실행할 명령어 (선택사항)",
            },
            file_path: {
              type: "string",
              description: "스크립트 파일 경로 (선택사항)",
            },
            timeout: {
              type: "number",
              description: "타임아웃 (밀리초, 선택사항)",
            },
            authorName: {
              type: "string",
              description: "작성자 이름",
            },
          },
          required: ["id", "authorName"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_commands": {
        const category = (args as { category?: string }).category;
        const endpoint = category ? `/commands?category=${encodeURIComponent(category)}` : "/commands";
        const commands = await fetchAPI(endpoint) as Command[];
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(commands, null, 2),
            },
          ],
        };
      }

      case "list_mcp_servers": {
        const category = (args as { category?: string }).category;
        const endpoint = category ? `/mcp?category=${encodeURIComponent(category)}` : "/mcp";
        const mcpServers = await fetchAPI(endpoint) as MCPServer[];
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(mcpServers, null, 2),
            },
          ],
        };
      }

      case "list_plugins": {
        const plugins = await fetchAPI("/plugins") as Plugin[];
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(plugins, null, 2),
            },
          ],
        };
      }

      case "get_command_detail": {
        const { id, version } = args as { id: string; version?: number };
        const endpoint = version
          ? `/commands?id=${encodeURIComponent(id)}&version=${version}`
          : `/commands?id=${encodeURIComponent(id)}`;
        const command = await fetchAPI(endpoint) as Command;

        // Build version history summary (handle legacy data without versions array)
        let displayVersions = command.versions && command.versions.length > 0
          ? [...command.versions]
          : [];

        if (displayVersions.length === 0 && command.content) {
          displayVersions = [{
            version: command.currentVersion || 1,
            content: command.content,
            updatedAt: command.updatedAt || "",
            updatedBy: command.updatedBy || "",
          }];
        }

        let versionInfo = "";
        if (displayVersions.length > 0) {
          const sorted = displayVersions.sort((a, b) => b.version - a.version);
          versionInfo = "\n\n📋 버전 히스토리:\n" + sorted.map((v) => {
            const latest = v.version === command.currentVersion ? " (Latest)" : "";
            const changelog = v.changelog ? ` - ${v.changelog}` : "";
            return `  v${v.version}${latest} | ${v.updatedAt} | ${v.updatedBy}${changelog}`;
          }).join("\n");
        }

        // Build response
        let text = `📦 ${command.name}\n\n`;
        text += `ID: ${command.id}\n`;
        text += `카테고리: ${command.category}\n`;
        text += `설명: ${command.description}\n`;
        if (version) {
          text += `\n🔍 요청한 버전: v${version}\n`;
        } else if (command.currentVersion) {
          text += `현재 버전: v${command.currentVersion}\n`;
        }
        if (command.updatedAt) {
          text += `마지막 업데이트: ${command.updatedAt}`;
          if (command.updatedBy) text += ` by ${command.updatedBy}`;
          text += "\n";
        }
        text += versionInfo;
        text += `\n\n---\n내용:\n${command.content}`;

        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      }

      case "get_mcp_detail": {
        const id = (args as { id: string }).id;
        const mcp = await fetchAPI(`/mcp?id=${encodeURIComponent(id)}`) as MCPServer;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(mcp, null, 2),
            },
          ],
        };
      }

      case "get_plugin_detail": {
        const id = (args as { id: string }).id;
        const plugin = await fetchAPI(`/plugins?id=${encodeURIComponent(id)}`) as Plugin;

        let text = `📦 ${plugin.name}\n\n`;
        text += `ID: ${plugin.id}\n`;
        text += `카테고리: ${plugin.category}\n`;
        text += `마켓플레이스: ${plugin.marketplace}\n`;
        text += `설명: ${plugin.description}\n`;
        if (plugin.updatedAt) {
          text += `마지막 업데이트: ${plugin.updatedAt}`;
          if (plugin.updatedBy) text += ` by ${plugin.updatedBy}`;
          text += "\n";
        }
        if (plugin.features && plugin.features.length > 0) {
          text += `\n주요 기능:\n${plugin.features.map(f => `  - ${f}`).join("\n")}\n`;
        }
        if (plugin.agents && plugin.agents.length > 0) {
          text += `\n에이전트:\n${plugin.agents.map(a => `  - ${a}`).join("\n")}\n`;
        }
        if (plugin.skills && plugin.skills.length > 0) {
          text += `\n스킬:\n${plugin.skills.map(s => `  - ${s}`).join("\n")}\n`;
        }
        if (plugin.examples && plugin.examples.length > 0) {
          text += `\n사용 예시:\n${plugin.examples.map(e => `  - ${e.input}: ${e.description}`).join("\n")}\n`;
        }

        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      }

      case "install_command": {
        const { id, version } = args as { id: string; version?: number };
        const endpoint = version
          ? `/commands?id=${encodeURIComponent(id)}&version=${version}`
          : `/commands?id=${encodeURIComponent(id)}`;
        const command = await fetchAPI(endpoint) as Command;

        // Create ~/.claude/commands directory
        const commandsDir = path.join(os.homedir(), ".claude", "commands");
        fs.mkdirSync(commandsDir, { recursive: true });

        // Write command file
        const filePath = path.join(commandsDir, `${command.id}.md`);
        fs.writeFileSync(filePath, command.content, "utf-8");

        const versionLabel = version ? `v${version}` : (command.currentVersion ? `v${command.currentVersion} (Latest)` : "");

        return {
          content: [
            {
              type: "text",
              text: `✅ 커맨드 설치 완료!${versionLabel ? ` [${versionLabel}]` : ""}\n\n📁 설치 위치: ${filePath}\n\n사용법: /${command.id}\n\n예시:\n${command.examples.map((e) => `- ${e.input}: ${e.description}`).join("\n")}`,
            },
          ],
        };
      }

      case "install_mcp": {
        const id = (args as { id: string }).id;
        const mcp = await fetchAPI(`/mcp?id=${encodeURIComponent(id)}`) as MCPServer;

        const configSnippet = {
          [mcp.id]: mcp.config,
        };

        let instructions = `📦 ${mcp.name} 설치 가이드\n\n`;
        instructions += `설정 위치: ${mcp.installLocation === "global" ? "~/.claude/settings.json" : ".claude/settings.json"}\n\n`;
        instructions += `mcpServers에 추가할 설정:\n\`\`\`json\n${JSON.stringify(configSnippet, null, 2)}\n\`\`\`\n\n`;

        if (mcp.setupSteps && mcp.setupSteps.length > 0) {
          instructions += `설정 단계:\n`;
          mcp.setupSteps.forEach((step, i) => {
            instructions += `${i + 1}. ${step}\n`;
          });
        }

        return {
          content: [
            {
              type: "text",
              text: instructions,
            },
          ],
        };
      }

      case "install_plugin": {
        const id = (args as { id: string }).id;
        const plugin = await fetchAPI(`/plugins?id=${encodeURIComponent(id)}`) as Plugin;

        // Marketplace URL (hardcoded for now, could be fetched from API)
        const marketplaceUrl = `https://github.com/anthropics/${plugin.marketplace}`;

        let instructions = `📦 ${plugin.name} 설치 가이드\n\n`;
        instructions += `## 1. 마켓플레이스 추가 (처음 한 번만)\n`;
        instructions += `Claude Code에서 다음 명령어를 실행하세요:\n`;
        instructions += `\`\`\`\n/plugin marketplace add ${marketplaceUrl}\n\`\`\`\n\n`;
        instructions += `## 2. 플러그인 설치\n`;
        instructions += `마켓플레이스 추가 후 다음 명령어로 플러그인을 설치하세요:\n`;
        instructions += `\`\`\`\n/plugin install ${plugin.id}@${plugin.marketplace}\n\`\`\`\n\n`;
        instructions += `## 3. 플러그인 활성화\n`;
        instructions += `설치 후 \`~/.claude/settings.json\`에서 플러그인이 활성화되어 있는지 확인하세요:\n`;
        instructions += `\`\`\`json\n{\n  "enabledPlugins": {\n    "${plugin.id}@${plugin.marketplace}": true\n  }\n}\n\`\`\`\n`;

        if (plugin.features && plugin.features.length > 0) {
          instructions += `\n## 주요 기능\n${plugin.features.map(f => `- ${f}`).join("\n")}\n`;
        }

        return {
          content: [
            {
              type: "text",
              text: instructions,
            },
          ],
        };
      }

      case "search": {
        const query = (args as { query: string }).query.toLowerCase();
        const results: Array<{ type: string; id: string; name: string; description: string }> = [];

        // Fetch all data
        const [commands, mcpServers, plugins, hooks] = await Promise.all([
          fetchAPI("/commands") as Promise<Command[]>,
          fetchAPI("/mcp") as Promise<MCPServer[]>,
          fetchAPI("/plugins") as Promise<Plugin[]>,
          fetchAPI("/hook") as Promise<Hook[]>,
        ]);

        commands.forEach((c) => {
          if (
            c.name.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query) ||
            c.id.toLowerCase().includes(query)
          ) {
            results.push({
              type: "command",
              id: c.id,
              name: c.name,
              description: c.description,
            });
          }
        });

        mcpServers.forEach((m) => {
          if (
            m.name.toLowerCase().includes(query) ||
            m.description.toLowerCase().includes(query) ||
            m.id.toLowerCase().includes(query)
          ) {
            results.push({
              type: "mcp",
              id: m.id,
              name: m.name,
              description: m.description,
            });
          }
        });

        plugins.forEach((p) => {
          if (
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.id.toLowerCase().includes(query)
          ) {
            results.push({
              type: "plugin",
              id: p.id,
              name: p.name,
              description: p.description,
            });
          }
        });

        hooks.forEach((h) => {
          if (
            h.name.toLowerCase().includes(query) ||
            h.description.toLowerCase().includes(query) ||
            h.id.toLowerCase().includes(query)
          ) {
            results.push({
              type: "hook",
              id: h.id,
              name: h.name,
              description: h.description,
            });
          }
        });

        return {
          content: [
            {
              type: "text",
              text:
                results.length > 0
                  ? JSON.stringify(results, null, 2)
                  : `"${query}"에 대한 검색 결과가 없습니다.`,
            },
          ],
        };
      }

      case "upload_command": {
        const { file_path, name: cmdName, category, description, authorName } = args as {
          file_path: string;
          id?: string;
          name: string;
          category: string;
          description: string;
          authorName: string;
        };

        // Expand ~ to home directory
        const expandedPath = file_path.replace(/^~/, os.homedir());

        // Check if file exists
        if (!fs.existsSync(expandedPath)) {
          throw new Error(`파일을 찾을 수 없습니다: ${file_path}`);
        }

        // Read file content
        const content = fs.readFileSync(expandedPath, "utf-8");

        // Extract ID from filename if not provided
        const cmdId = (args as { id?: string }).id || path.basename(expandedPath, ".md");

        // Upload to API
        const result = await postAPI("/commands", {
          id: cmdId,
          name: cmdName,
          description,
          category,
          content,
          installPath: `~/.claude/commands/${cmdId}.md`,
          examples: [],
          authorName,
        });

        return {
          content: [
            {
              type: "text",
              text: `✅ 커맨드 업로드 완료!\n\nID: ${cmdId}\n이름: ${cmdName}\n카테고리: ${category}\n\n이제 다른 사용자들도 이 커맨드를 설치할 수 있습니다.`,
            },
          ],
        };
      }

      case "upload_mcp": {
        const mcpData = args as {
          id: string;
          name: string;
          description?: string;
          category?: string;
          type: string;
          config: Record<string, unknown>;
          installLocation?: string;
          setupSteps?: string[];
          authorName: string;
        };

        // Upload to API
        await postAPI("/mcp", {
          id: mcpData.id,
          name: mcpData.name,
          description: mcpData.description || "",
          category: mcpData.category || "Other",
          type: mcpData.type,
          config: mcpData.config,
          installLocation: mcpData.installLocation || "global",
          setupSteps: mcpData.setupSteps || [],
          examples: [],
          authorName: mcpData.authorName,
        });

        return {
          content: [
            {
              type: "text",
              text: `✅ MCP 서버 업로드 완료!\n\nID: ${mcpData.id}\n이름: ${mcpData.name}\n타입: ${mcpData.type}\n\n이제 다른 사용자들도 이 MCP 서버를 설치할 수 있습니다.`,
            },
          ],
        };
      }

      case "upload_plugin": {
        const pluginData = args as {
          id: string;
          name: string;
          description?: string;
          category?: string;
          marketplace: string;
          features?: string[];
          agents?: string[];
          skills?: string[];
          authorName: string;
        };

        // Upload to API
        await postAPI("/plugins", {
          id: pluginData.id,
          name: pluginData.name,
          description: pluginData.description || "",
          category: pluginData.category || "Other",
          marketplace: pluginData.marketplace,
          installCommand: `/install-plugin ${pluginData.id}@${pluginData.marketplace}`,
          features: pluginData.features || [],
          agents: pluginData.agents || [],
          skills: pluginData.skills || [],
          examples: [],
          authorName: pluginData.authorName,
        });

        return {
          content: [
            {
              type: "text",
              text: `✅ 플러그인 업로드 완료!\n\nID: ${pluginData.id}\n이름: ${pluginData.name}\n마켓플레이스: ${pluginData.marketplace}\n\n이제 다른 사용자들도 이 플러그인을 설치할 수 있습니다.`,
            },
          ],
        };
      }

      case "update_command": {
        const { file_path, id, name: cmdName, category, description, changelog, authorName } = args as {
          file_path?: string;
          id: string;
          name?: string;
          category?: string;
          description?: string;
          changelog?: string;
          authorName: string;
        };

        const updateData: Record<string, unknown> = { id, authorName };

        // If file_path provided, read new content
        if (file_path) {
          const expandedPath = file_path.replace(/^~/, os.homedir());
          if (!fs.existsSync(expandedPath)) {
            throw new Error(`파일을 찾을 수 없습니다: ${file_path}`);
          }
          updateData.content = fs.readFileSync(expandedPath, "utf-8");
        }

        if (cmdName) updateData.name = cmdName;
        if (category) updateData.category = category;
        if (description) updateData.description = description;
        if (changelog) updateData.changelog = changelog;

        await putAPI("/commands", updateData);

        return {
          content: [
            {
              type: "text",
              text: `✅ 커맨드 업데이트 완료!\n\nID: ${id}\n\n업데이트된 필드: ${Object.keys(updateData).filter(k => k !== "id").join(", ") || "없음"}`,
            },
          ],
        };
      }

      case "update_mcp": {
        const mcpData = args as {
          id: string;
          name?: string;
          description?: string;
          category?: string;
          type?: string;
          config?: Record<string, unknown>;
          installLocation?: string;
          setupSteps?: string[];
          authorName: string;
        };

        await putAPI("/mcp", mcpData);

        return {
          content: [
            {
              type: "text",
              text: `✅ MCP 서버 업데이트 완료!\n\nID: ${mcpData.id}\n\n업데이트된 필드: ${Object.keys(mcpData).filter(k => k !== "id").join(", ") || "없음"}`,
            },
          ],
        };
      }

      case "update_plugin": {
        const pluginData = args as {
          id: string;
          name?: string;
          description?: string;
          category?: string;
          marketplace?: string;
          features?: string[];
          agents?: string[];
          skills?: string[];
          authorName: string;
        };

        await putAPI("/plugins", pluginData);

        return {
          content: [
            {
              type: "text",
              text: `✅ 플러그인 업데이트 완료!\n\nID: ${pluginData.id}\n\n업데이트된 필드: ${Object.keys(pluginData).filter(k => k !== "id").join(", ") || "없음"}`,
            },
          ],
        };
      }

      case "list_hooks": {
        const category = (args as { category?: string; event?: string }).category;
        const event = (args as { category?: string; event?: string }).event;
        let endpoint = "/hook";
        const params: string[] = [];
        if (category) params.push(`category=${encodeURIComponent(category)}`);
        if (event) params.push(`event=${encodeURIComponent(event)}`);
        if (params.length > 0) endpoint += `?${params.join("&")}`;
        const hooks = await fetchAPI(endpoint) as Hook[];
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(hooks, null, 2),
            },
          ],
        };
      }

      case "get_hook_detail": {
        const id = (args as { id: string }).id;
        const hook = await fetchAPI(`/hook?id=${encodeURIComponent(id)}`) as Hook;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(hook, null, 2),
            },
          ],
        };
      }

      case "install_hook": {
        const id = (args as { id: string }).id;
        const hook = await fetchAPI(`/hook?id=${encodeURIComponent(id)}`) as Hook;

        let scriptInstalled = false;
        let installedPath = "";

        // Write script file if scriptContent exists
        if (hook.scriptContent && hook.scriptPath) {
          const hooksDir = path.join(os.homedir(), ".claude", "hooks");
          fs.mkdirSync(hooksDir, { recursive: true });

          const expandedScriptPath = hook.scriptPath.replace(/^~/, os.homedir());
          fs.writeFileSync(expandedScriptPath, hook.scriptContent, "utf-8");

          // Make executable if it's a shell script
          if (expandedScriptPath.endsWith(".sh")) {
            fs.chmodSync(expandedScriptPath, "755");
          }

          scriptInstalled = true;
          installedPath = hook.scriptPath;
        }

        const hookConfig = {
          type: hook.event,
          ...(hook.matcher && { matcher: hook.matcher }),
          command: hook.command,
          ...(hook.timeout && { timeout: hook.timeout }),
        };

        let instructions = `📦 ${hook.name} Hook 설치 가이드\n\n`;

        if (scriptInstalled) {
          instructions += `✅ 스크립트 파일 설치 완료: ${installedPath}\n\n`;
        }

        instructions += `설정 위치: ~/.claude/settings.json\n\n`;
        instructions += `hooks 배열에 추가할 설정:\n\`\`\`json\n${JSON.stringify(hookConfig, null, 2)}\n\`\`\`\n\n`;
        instructions += `전체 설정 예시:\n\`\`\`json\n{\n  "hooks": [\n    ${JSON.stringify(hookConfig, null, 2).split('\n').join('\n    ')}\n  ]\n}\n\`\`\``;

        return {
          content: [
            {
              type: "text",
              text: instructions,
            },
          ],
        };
      }

      case "upload_hook": {
        const hookData = args as {
          id: string;
          name: string;
          description?: string;
          category?: string;
          event: string;
          matcher?: string;
          command?: string;
          file_path?: string;
          timeout?: number;
          authorName: string;
        };

        let scriptContent: string | undefined;
        let scriptPath: string | undefined;
        let command = hookData.command;

        // Read script file if file_path is provided
        if (hookData.file_path) {
          const expandedPath = hookData.file_path.replace(/^~/, os.homedir());

          if (!fs.existsSync(expandedPath)) {
            throw new Error(`파일을 찾을 수 없습니다: ${hookData.file_path}`);
          }

          scriptContent = fs.readFileSync(expandedPath, "utf-8");
          const ext = path.extname(expandedPath);
          scriptPath = `~/.claude/hooks/${hookData.id}${ext}`;

          // Auto-generate command based on file extension
          if (!command) {
            if (ext === ".js") {
              command = `node ~/.claude/hooks/${hookData.id}${ext}`;
            } else if (ext === ".sh") {
              command = `bash ~/.claude/hooks/${hookData.id}${ext}`;
            } else if (ext === ".py") {
              command = `python ~/.claude/hooks/${hookData.id}${ext}`;
            } else {
              command = `~/.claude/hooks/${hookData.id}${ext}`;
            }
          }
        }

        if (!command) {
          throw new Error("command 또는 file_path가 필요합니다.");
        }

        await postAPI("/hook", {
          id: hookData.id,
          name: hookData.name,
          description: hookData.description || "",
          category: hookData.category || "Other",
          event: hookData.event,
          matcher: hookData.matcher,
          command,
          scriptContent,
          scriptPath,
          timeout: hookData.timeout,
          examples: [],
          authorName: hookData.authorName,
        });

        let message = `✅ Hook 업로드 완료!\n\nID: ${hookData.id}\n이름: ${hookData.name}\n이벤트: ${hookData.event}`;
        if (scriptPath) {
          message += `\n스크립트 경로: ${scriptPath}`;
        }
        message += `\n\n이제 다른 사용자들도 이 Hook을 설치할 수 있습니다.`;

        return {
          content: [
            {
              type: "text",
              text: message,
            },
          ],
        };
      }

      case "update_hook": {
        const hookData = args as {
          id: string;
          name?: string;
          description?: string;
          category?: string;
          event?: string;
          matcher?: string;
          command?: string;
          file_path?: string;
          timeout?: number;
          authorName: string;
        };

        let scriptContent: string | undefined;
        let scriptPath: string | undefined;

        // Read script file if file_path is provided
        if (hookData.file_path) {
          const expandedPath = hookData.file_path.replace(/^~/, os.homedir());

          if (!fs.existsSync(expandedPath)) {
            throw new Error(`파일을 찾을 수 없습니다: ${hookData.file_path}`);
          }

          scriptContent = fs.readFileSync(expandedPath, "utf-8");
          const ext = path.extname(expandedPath);
          scriptPath = `~/.claude/hooks/${hookData.id}${ext}`;
        }

        const updatePayload: Record<string, unknown> = { ...hookData };
        delete updatePayload.file_path;
        if (scriptContent) updatePayload.scriptContent = scriptContent;
        if (scriptPath) updatePayload.scriptPath = scriptPath;

        await putAPI("/hook", updatePayload);

        const updatedFields = Object.keys(hookData).filter(k => k !== "id" && k !== "authorName");
        if (scriptContent) updatedFields.push("scriptContent");

        return {
          content: [
            {
              type: "text",
              text: `✅ Hook 업데이트 완료!\n\nID: ${hookData.id}\n\n업데이트된 필드: ${updatedFields.join(", ") || "없음"}`,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `알 수 없는 도구: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Skills Share MCP Server running on stdio");
}

main().catch(console.error);
