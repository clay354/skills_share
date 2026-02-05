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

interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  installPath: string;
  examples: { input: string; description: string }[];
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
  agents?: string[];
  skills?: string[];
}

const server = new Server(
  {
    name: "skills-share",
    version: "1.1.0",
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
        description: "특정 커맨드의 상세 정보와 설치 내용을 조회합니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "커맨드 ID",
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
        name: "install_command",
        description: "커맨드를 ~/.claude/commands/ 폴더에 설치합니다.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "설치할 커맨드 ID",
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
          },
          required: ["file_path", "name", "category", "description"],
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
          },
          required: ["id", "name", "type", "config"],
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
          },
          required: ["id", "name", "marketplace"],
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
        const id = (args as { id: string }).id;
        const command = await fetchAPI(`/commands?id=${encodeURIComponent(id)}`) as Command;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(command, null, 2),
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

      case "install_command": {
        const id = (args as { id: string }).id;
        const command = await fetchAPI(`/commands?id=${encodeURIComponent(id)}`) as Command;

        // Create ~/.claude/commands directory
        const commandsDir = path.join(os.homedir(), ".claude", "commands");
        fs.mkdirSync(commandsDir, { recursive: true });

        // Write command file
        const filePath = path.join(commandsDir, `${command.id}.md`);
        fs.writeFileSync(filePath, command.content, "utf-8");

        return {
          content: [
            {
              type: "text",
              text: `✅ 커맨드 설치 완료!\n\n📁 설치 위치: ${filePath}\n\n사용법: /${command.id}\n\n예시:\n${command.examples.map((e) => `- ${e.input}: ${e.description}`).join("\n")}`,
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

      case "search": {
        const query = (args as { query: string }).query.toLowerCase();
        const results: Array<{ type: string; id: string; name: string; description: string }> = [];

        // Fetch all data
        const [commands, mcpServers, plugins] = await Promise.all([
          fetchAPI("/commands") as Promise<Command[]>,
          fetchAPI("/mcp") as Promise<MCPServer[]>,
          fetchAPI("/plugins") as Promise<Plugin[]>,
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
        const { file_path, name: cmdName, category, description } = args as {
          file_path: string;
          id?: string;
          name: string;
          category: string;
          description: string;
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
