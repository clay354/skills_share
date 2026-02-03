#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { commands, mcpServers, plugins } from "./data.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const server = new Server(
  {
    name: "skills-share",
    version: "1.0.0",
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
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "list_commands": {
      const category = (args as { category?: string }).category;
      let filtered = commands;
      if (category) {
        filtered = commands.filter(
          (c) => c.category.toLowerCase() === category.toLowerCase()
        );
      }
      const list = filtered.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        category: c.category,
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(list, null, 2),
          },
        ],
      };
    }

    case "list_mcp_servers": {
      const category = (args as { category?: string }).category;
      let filtered = mcpServers;
      if (category) {
        filtered = mcpServers.filter(
          (m) => m.category.toLowerCase() === category.toLowerCase()
        );
      }
      const list = filtered.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        category: m.category,
        type: m.type,
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(list, null, 2),
          },
        ],
      };
    }

    case "list_plugins": {
      const list = plugins.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        agents: p.agents,
        skills: p.skills,
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(list, null, 2),
          },
        ],
      };
    }

    case "get_command_detail": {
      const id = (args as { id: string }).id;
      const command = commands.find((c) => c.id === id);
      if (!command) {
        return {
          content: [
            {
              type: "text",
              text: `커맨드를 찾을 수 없습니다: ${id}`,
            },
          ],
          isError: true,
        };
      }
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
      const mcp = mcpServers.find((m) => m.id === id);
      if (!mcp) {
        return {
          content: [
            {
              type: "text",
              text: `MCP 서버를 찾을 수 없습니다: ${id}`,
            },
          ],
          isError: true,
        };
      }
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
      const command = commands.find((c) => c.id === id);
      if (!command) {
        return {
          content: [
            {
              type: "text",
              text: `커맨드를 찾을 수 없습니다: ${id}`,
            },
          ],
          isError: true,
        };
      }

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
      const mcp = mcpServers.find((m) => m.id === id);
      if (!mcp) {
        return {
          content: [
            {
              type: "text",
              text: `MCP 서버를 찾을 수 없습니다: ${id}`,
            },
          ],
          isError: true,
        };
      }

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
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Skills Share MCP Server running on stdio");
}

main().catch(console.error);
