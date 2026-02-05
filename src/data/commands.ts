export interface CommandVersion {
  version: number;
  content: string;
  updatedAt: string;
  updatedBy: string;
  changelog?: string;
}

export interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;  // 최신 버전 content (하위 호환)
  installPath: string;
  examples: { input: string; description: string }[];
  updatedAt?: string;
  updatedBy?: string;
  currentVersion?: number;
  versions?: CommandVersion[];
}
