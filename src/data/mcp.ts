export interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "http" | "stdio" | "sse";
  config: Record<string, unknown>;
  installLocation: "global" | "project";
  setupSteps?: string[];
  tools?: { name: string; description: string }[];
  examples: { input: string; description: string }[];
}
